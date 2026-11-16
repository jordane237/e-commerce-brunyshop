import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';

import type { ApplicationConfig } from '../../config/configuration';
import { PrismaService } from '../../infrastructure/database/database.module';
import { AuditLogService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { sanitizeEmail } from '../notifications/sanitizers/notification-sanitizer';
import { ContactDto, type ContactSubject } from './dto/contact.dto';

export interface ContactResponse {
  id: string;
  receivedAt: string;
  message: string;
}

export const CONTACT_CONFIRMATION_MESSAGE =
  'Votre message est envoyé. Nous répondons sous 24 h ouvrées.';

export const CONTACT_SUBJECT_LABELS: Record<ContactSubject, string> = {
  order: 'Une commande',
  product: 'Un produit ou une taille',
  return: 'Un retour ou un échange',
  delivery: 'Une livraison',
  other: 'Autre demande',
};

const DEFAULT_CONTACT_EMAIL_TO = 'support@brunyshop.cm';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditLogService,
    private readonly logger: PinoLogger,
  ) {}

  async submit(
    dto: ContactDto,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<ContactResponse> {
    // Honeypot: a real visitor never fills a field hidden from assistive
    // technology. Keep the response indistinguishable from a real success and
    // avoid creating a row or sending mail.
    if (dto._honey !== undefined && dto._honey.trim() !== '') {
      this.logger.warn(
        { action: 'CONTACT_HONEYPOT_TRIGGERED', subject: dto.subject },
        'contact honeypot triggered',
      );
      return {
        id: randomUUID(),
        receivedAt: new Date().toISOString(),
        message: CONTACT_CONFIRMATION_MESSAGE,
      };
    }

    const created = await this.prisma.contactMessage.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone ?? null,
        subject: dto.subject,
        orderReference: dto.orderReference ?? null,
        message: dto.message,
        consent: dto.consent,
        ip: meta.ipAddress ?? null,
        userAgent: meta.userAgent ?? null,
      },
      select: { id: true, createdAt: true },
    });

    const subjectLabel = CONTACT_SUBJECT_LABELS[dto.subject];
    const submittedAt = created.createdAt.toISOString();
    const teamRecipient = this.contactEmailTo();

    // The support notification is the primary delivery path for the ticket.
    // If the queue is unavailable the request fails explicitly rather than
    // pretending the message reached the team.
    await this.notifications.enqueueEmail(
      null,
      teamRecipient,
      'contact.message',
      'v1',
      {
        contactId: created.id,
        name: dto.name,
        email: dto.email,
        phone: dto.phone ?? 'Non renseigné',
        subjectLabel,
        orderReference: dto.orderReference ?? 'Non renseignée',
        message: dto.message,
        submittedAt,
      },
      { metadata: { contactId: created.id, subject: dto.subject } },
    );

    // Visitor confirmation is a UX bonus: a queue hiccup must not turn a
    // successfully persisted request into a retry that creates a duplicate.
    try {
      await this.notifications.enqueueEmail(
        null,
        dto.email,
        'contact.confirmation',
        'v1',
        { name: dto.name, subjectLabel },
        { metadata: { contactId: created.id } },
      );
    } catch (error) {
      this.logger.warn(
        {
          contactMessageId: created.id,
          err: error instanceof Error ? error.message : String(error),
        },
        'contact confirmation could not be enqueued',
      );
    }

    await this.audit.record(this.prisma, {
      userId: null,
      action: 'CONTACT_SUBMITTED',
      entity: 'ContactMessage',
      entityId: created.id,
      ...(meta.ipAddress !== undefined ? { ip: meta.ipAddress } : {}),
      ...(meta.userAgent !== undefined ? { userAgent: meta.userAgent } : {}),
      after: {
        subject: dto.subject,
        emailMasked: sanitizeEmail(dto.email),
        hasPhone: dto.phone !== undefined,
        orderReference: dto.orderReference ?? null,
      },
    });

    // Never log the message, the e-mail address or the phone number.
    this.logger.info(
      {
        action: 'CONTACT_SUBMITTED',
        contactMessageId: created.id,
        subject: dto.subject,
      },
      'contact message received',
    );

    return {
      id: created.id,
      receivedAt: submittedAt,
      message: CONTACT_CONFIRMATION_MESSAGE,
    };
  }

  private contactEmailTo(): string {
    const configured = this.config.get<ApplicationConfig>('app')?.contactEmailTo?.trim();
    return configured !== undefined && configured !== '' ? configured : DEFAULT_CONTACT_EMAIL_TO;
  }
}
