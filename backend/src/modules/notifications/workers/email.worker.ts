// email.worker.ts
// Worker BullMQ NTF-01 pour la queue notifications-email.
// Retry : BullMQ gère les tentatives automatiques (rethrow obligatoire).
// Dead-letter : après le nombre max de tentatives, le job est persisté en DB
// (DeadLetterJob) et la Notification associée passe en DEAD_LETTER.

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { EmailAdapter } from '../adapters/email.adapter';
import { NotificationsService } from '../notifications.service';
import { sanitizeNotificationPayload } from '../sanitizers/notification-sanitizer';
import { NOTIFICATIONS_EMAIL_QUEUE } from '../queue.constants';
import type { EmailJobPayload } from '../queue.service';

export const MAX_ATTEMPTS = 5;
export const EMAIL_BACKOFF_MS = 5_000;

@Injectable()
@Processor(NOTIFICATIONS_EMAIL_QUEUE)
export class EmailWorker extends WorkerHost {
  private readonly logger = new Logger(EmailWorker.name);

  constructor(
    private readonly emailAdapter: EmailAdapter,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<EmailJobPayload>): Promise<void> {
    const start = Date.now();
    const { notificationId, recipient, templateKey } = job.data;

    this.logger.log(
      {
        jobId: job.id,
        notificationId,
        templateKey,
        recipient: sanitizeNotificationPayload(recipient),
        attempt: job.attemptsMade + 1,
      },
      `Processing email job`,
    );

    try {
      const result = await this.emailAdapter.send({
        to: job.data.recipient,
        subject: job.data.subject,
        html: job.data.html,
        text: job.data.text,
      });

      if (!result.success) {
        throw new Error(result.error ?? 'email send failed');
      }

      await this.notifications.markAsSent(notificationId, job.id);
      this.logger.log(
        {
          jobId: job.id,
          notificationId,
          durationMs: Date.now() - start,
        },
        `Email job completed`,
      );
    } catch (err) {
      await this.notifications.recordFailure(notificationId, err, job.id);
      this.logger.error(
        {
          jobId: job.id,
          notificationId,
          templateKey,
          err: this.serializeError(err),
        },
        `Email job failed (retry)`,
      );
      // Rethrow obligatoire : BullMQ ne retente pas si le worker ne remonte pas
      // l'erreur.
      throw err;
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<EmailJobPayload>, error: Error): Promise<void> {
    const attemptsMade = job.attemptsMade ?? 0;
    if (attemptsMade >= (job.opts?.attempts ?? MAX_ATTEMPTS)) {
      await this.notifications.moveToDeadLetter(
        job.data.notificationId,
        error,
        NOTIFICATIONS_EMAIL_QUEUE,
        'send-email',
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
        `Email job still retrying`,
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
