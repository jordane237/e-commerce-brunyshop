// notifications.service.ts
// Façade NTF-01 : enfile les notifications et met à jour l'historique dans
// la base (indépendant de la queue BullMQ).

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/database.module';
import { QueueService } from './queue.service';
import { AuditService } from '../../modules/audit/audit.service';
import { sanitizeNotificationPayload } from './sanitizers/notification-sanitizer';
import { renderTemplate } from './templates/template.registry';
import type { EmailPayload, SmsPayload } from './adapters/notification-provider.interface';
import type { Prisma } from '../../generated/prisma';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly audit: AuditService,
  ) {}

  async enqueueEmail(
    userId: string | null,
    recipient: string,
    templateKey: string,
    templateVersion: string,
    data: Record<string, unknown>,
    options?: { metadata?: Record<string, unknown> },
  ): Promise<string> {
    const rendered = renderTemplate(
      templateKey,
      templateVersion,
      data as Parameters<typeof renderTemplate>[2],
    );
    const _payload: EmailPayload = {
      to: recipient,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    };

    const notification = await this.prisma.notification.create({
      data: {
        userId: userId ?? null,
        channel: 'EMAIL',
        templateKey,
        templateVersion,
        recipient,
        status: 'PENDING',
        metadata: this.metadataWithTemplateData(options?.metadata, templateKey, templateVersion),
      },
    });

    await this.queue.enqueue('notifications-email', {
      notificationId: notification.id,
      recipient: recipient,
      templateKey,
      templateVersion,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    this.logger.debug(
      {
        notificationId: notification.id,
        templateKey,
        templateVersion,
        recipient: this.sanitizeRecipient(recipient),
      },
      'Notification email enqueued',
    );

    return notification.id;
  }

  async enqueueSms(
    userId: string | null,
    recipient: string,
    templateKey: string,
    templateVersion: string,
    data: Record<string, unknown>,
    options?: { metadata?: Record<string, unknown> },
  ): Promise<string> {
    const rendered = renderTemplate(
      templateKey,
      templateVersion,
      data as Parameters<typeof renderTemplate>[2],
    );
    const _payload: SmsPayload = {
      to: recipient,
      message: rendered.text ?? rendered.subject,
    };

    const notification = await this.prisma.notification.create({
      data: {
        userId: userId ?? null,
        channel: 'SMS',
        templateKey,
        templateVersion,
        recipient,
        status: 'PENDING',
        metadata: this.metadataWithTemplateData(options?.metadata, templateKey, templateVersion),
      },
    });

    await this.queue.enqueue('notifications-sms', {
      notificationId: notification.id,
      recipient: recipient,
      templateKey,
      templateVersion,
      message: rendered.text ?? rendered.subject,
    });

    this.logger.debug(
      {
        notificationId: notification.id,
        templateKey,
        templateVersion,
        recipient: this.sanitizeRecipient(recipient),
      },
      'Notification SMS enqueued',
    );

    return notification.id;
  }

  async enqueueWhatsapp(
    userId: string | null,
    recipient: string,
    templateKey: string,
    templateVersion: string,
    data: Record<string, unknown>,
    options?: { metadata?: Record<string, unknown> },
  ): Promise<string> {
    const rendered = renderTemplate(
      templateKey,
      templateVersion,
      data as Parameters<typeof renderTemplate>[2],
    );
    const _rendered2 = rendered;

    const notification = await this.prisma.notification.create({
      data: {
        userId: userId ?? null,
        channel: 'WHATSAPP',
        templateKey,
        templateVersion,
        recipient,
        status: 'PENDING',
        metadata: this.metadataWithTemplateData(options?.metadata, templateKey, templateVersion),
      },
    });

    await this.queue.enqueue('notifications-whatsapp', {
      notificationId: notification.id,
      recipient: recipient,
      templateKey,
      templateVersion,
      templateName: templateKey,
      templateData: data as Record<string, string>,
    });

    this.logger.debug(
      {
        notificationId: notification.id,
        templateKey,
        templateVersion,
        recipient: this.sanitizeRecipient(recipient),
      },
      'Notification WhatsApp enqueued',
    );

    return notification.id;
  }

  async markAsSent(notificationId: string, jobId?: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        attempts: { increment: 1 },
      },
    });

    this.logger.debug({ notificationId, jobId }, 'Notification marked SENT');
  }

  async recordFailure(notificationId: string, error: unknown, jobId?: string): Promise<void> {
    const message = this.errorMessage(error);
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'FAILED',
        attempts: { increment: 1 },
        lastError: message,
      },
    });

    this.logger.warn(
      {
        notificationId,
        jobId,
        lastError: message.length > 500 ? `${message.slice(0, 500)}…` : message,
      },
      'Notification marked FAILED',
    );
  }

  async moveToDeadLetter(
    notificationId: string,
    error: unknown,
    queueName: string,
    jobName: string,
    jobId: string,
    attempts: number,
  ): Promise<void> {
    const message = this.errorMessage(error);

    await this.prisma.$transaction([
      this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'DEAD_LETTER' },
      }),
      this.prisma.deadLetterJob.create({
        data: {
          queueName,
          jobId,
          jobName,
          payload: sanitizeNotificationPayload({}) as object,
          error: message,
          attempts,
        },
      }),
    ]);

    await this.audit.log({
      userId: null,
      action: 'NOTIFICATION_MOVED_TO_DEAD_LETTER',
      entity: 'Notification',
      entityId: notificationId,
      before: null,
      after: sanitizeNotificationPayload({
        notificationId,
        queueName,
        jobName,
        attempts,
      }) as object,
    });

    this.logger.error(
      {
        notificationId,
        queueName,
        jobName,
        jobId,
        attempts,
        lastError: message.length > 500 ? `${message.slice(0, 500)}…` : message,
      },
      'Notification moved to dead-letter',
    );
  }

  async findOne(id: string): Promise<Notification | null> {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  async findDeadLetters(
    filters: {
      page?: number;
      limit?: number;
      queueName?: string;
      jobName?: string;
      from?: string;
      to?: string;
    } = {},
  ): Promise<{
    data: DeadLetterJob[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const limit = Math.min(filters.limit ?? 20, 100);
    const page = Math.max(filters.page ?? 1, 1);
    const where: Prisma.DeadLetterJobWhereInput = {
      ...(filters.queueName && { queueName: filters.queueName }),
      ...(filters.jobName && { jobName: filters.jobName }),
      ...(filters.from || filters.to
        ? {
            failedAt: {
              ...(filters.from && { gte: new Date(filters.from) }),
              ...(filters.to && { lte: new Date(filters.to) }),
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.deadLetterJob.findMany({
        where,
        orderBy: { failedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.deadLetterJob.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private metadataWithTemplateData(
    metadata?: Record<string, unknown>,
    templateKey: string,
    templateVersion: string,
  ): Record<string, unknown> {
    const base: Record<string, unknown> = { templateKey, templateVersion };
    if (metadata) {
      base.metadata = metadata;
    }
    return base;
  }

  private sanitizeRecipient(recipient: string): string {
    return recipient.includes('@')
      ? sanitizeNotificationPayload(recipient)
      : sanitizeNotificationPayload(recipient);
  }

  private errorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }
    return String(error ?? 'unknown error');
  }
}

export type Notification = Prisma.NotificationGetPayload<object>;
export type DeadLetterJob = Prisma.DeadLetterJobGetPayload<object>;
