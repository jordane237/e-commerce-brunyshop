// whatsapp.worker.ts
// Worker BullMQ NTF-01 pour la queue notifications-whatsapp.
// Retry : BullMQ gère les tentatives automatiques (rethrow obligatoire).
// Dead-letter : après le nombre max de tentatives, le job est persisté en DB
// (DeadLetterJob) et la Notification associée passe en DEAD_LETTER.

import { Processor, WorkerHost, OnWorkerEvent, type Job } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppAdapter } from '../adapters/whatsapp.adapter';
import { NotificationsService } from '../notifications.service';
import { sanitizeNotificationPayload } from '../sanitizers/notification-sanitizer';
import { NOTIFICATIONS_WHATSAPP_QUEUE } from '../queue.constants';
import type { WhatsAppJobPayload } from '../queue.service';

export const MAX_ATTEMPTS = 5;
export const WHATSAPP_BACKOFF_MS = 5_000;

@Injectable()
@Processor(NOTIFICATIONS_WHATSAPP_QUEUE)
export class WhatsAppWorker extends WorkerHost {
  private readonly logger = new Logger(WhatsAppWorker.name);

  constructor(
    private readonly whatsappAdapter: WhatsAppAdapter,
    private readonly notifications: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<WhatsAppJobPayload>): Promise<void> {
    const start = Date.now();
    const { notificationId, recipient, templateKey } = job.data;

    this.logger.info(
      {
        jobId: job.id,
        notificationId,
        templateKey,
        recipient: sanitizeNotificationPayload(recipient),
        attempt: job.attemptsMade + 1,
      },
      `Processing WhatsApp job`,
    );

    try {
      const result = await this.whatsappAdapter.send({
        to: job.data.recipient,
        templateName: job.data.templateName,
        templateData: job.data.templateData,
      });

      if (!result.success) {
        throw new Error(result.error ?? 'whatsapp send failed');
      }

      await this.notifications.markAsSent(notificationId, job.id);
      this.logger.info(
        {
          jobId: job.id,
          notificationId,
          durationMs: Date.now() - start,
        },
        `WhatsApp job completed`,
      );
    } catch (err) {
      await this.notifications.recordFailure(notificationId, err, job.id);
      this.logger.error(
        {
          jobId: job.id,
          notificationId,
          templateKey: job.data.templateKey,
          err: this.serializeError(err),
        },
        `WhatsApp job failed (retry)`,
      );
      throw err;
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<WhatsAppJobPayload>, error: Error): Promise<void> {
    const attemptsMade = job.attemptsMade ?? 0;
    if (attemptsMade >= (job.opts?.attempts ?? MAX_ATTEMPTS)) {
      await this.notifications.moveToDeadLetter(
        job.data.notificationId,
        error,
        NOTIFICATIONS_WHATSAPP_QUEUE,
        'send-whatsapp',
        job.id ?? '',
        attemptsMade,
      );
    } else {
      this.logger.warn(
        {
          jobId: job.id,
          notificationId: job.data.notificationId,
          attemptsMade,
          maxAttempts: job.opts?.attempts ?? MAX_ATTEMPTS,
        },
        `WhatsApp job still retrying`,
      );
    }
  }

  private serializeError(err: unknown): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String(err.message);
    }
    return String(err ?? 'unknown error');
  }
}
