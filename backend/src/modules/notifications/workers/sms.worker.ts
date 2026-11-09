// sms.worker.ts
// Worker BullMQ NTF-01 pour la queue notifications-sms.
// Retry : BullMQ gère les tentatives automatiques (rethrow obligatoire).
// Dead-letter : après le nombre max de tentatives, le job est persisté en DB
// (DeadLetterJob) et la Notification associée passe en DEAD_LETTER.

import { Processor, WorkerHost, OnWorkerEvent, type Job } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { SmsAdapter } from '../adapters/sms.adapter';
import { NotificationsService } from '../notifications.service';
import { sanitizeNotificationPayload } from '../sanitizers/notification-sanitizer';
import { NOTIFICATIONS_SMS_QUEUE } from '../queue.constants';
import type { SmsJobPayload } from '../queue.service';

export const MAX_ATTEMPTS = 5;
export const SMS_BACKOFF_MS = 5_000;

@Injectable()
@Processor(NOTIFICATIONS_SMS_QUEUE)
export class SmsWorker extends WorkerHost {
  private readonly logger = new Logger(SmsWorker.name);

  constructor(
    private readonly smsAdapter: SmsAdapter,
    private readonly notifications: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<SmsJobPayload>): Promise<void> {
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
      `Processing SMS job`,
    );

    try {
      const result = await this.smsAdapter.send({
        to: job.data.recipient,
        message: job.data.message,
      });

      if (!result.success) {
        throw new Error(result.error ?? 'sms send failed');
      }

      await this.notifications.markAsSent(notificationId, job.id);
      this.logger.info(
        {
          jobId: job.id,
          notificationId,
          durationMs: Date.now() - start,
        },
        `SMS job completed`,
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
        `SMS job failed (retry)`,
      );
      throw err;
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<SmsJobPayload>, error: Error): Promise<void> {
    const attemptsMade = job.attemptsMade ?? 0;
    if (attemptsMade >= (job.opts?.attempts ?? MAX_ATTEMPTS)) {
      await this.notifications.moveToDeadLetter(
        job.data.notificationId,
        error,
        NOTIFICATIONS_SMS_QUEUE,
        'send-sms',
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
        `SMS job still retrying`,
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
