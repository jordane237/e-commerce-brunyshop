import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { PrismaService } from '../../infrastructure/database/database.module';
import { ContactDto } from './dto/contact.dto';

export interface ContactResponse {
  id: string;
  receivedAt: string;
}

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {}

  async submit(
    dto: ContactDto,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<ContactResponse> {
    const created = await this.prisma.contactMessage.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone ?? null,
        subject: dto.subject,
        orderReference: dto.orderReference ?? null,
        message: dto.message.trim(),
        consent: dto.consent,
        ip: meta.ipAddress ?? null,
        userAgent: meta.userAgent ?? null,
      },
      select: { id: true, createdAt: true },
    });

    // Do not log the message or the contact details: only an operational
    // correlation id and non-personal subject are needed for support triage.
    this.logger.info(
      {
        action: 'CONTACT_SUBMITTED',
        contactMessageId: created.id,
        subject: dto.subject,
      },
      'contact message received',
    );

    return { id: created.id, receivedAt: created.createdAt.toISOString() };
  }
}
