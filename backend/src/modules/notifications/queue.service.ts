// queue.service.ts
// Service de queue BullMQ NTF-01 : enfiler les jobs sur les queues par canal.
// Les options de retry/backoff sont centralisées ici et alignées sur la config
// globale BullModule (voir AppModule).

import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  NOTIFICATIONS_EMAIL_QUEUE,
  NOTIFICATIONS_SMS_QUEUE,
  NOTIFICATIONS_WHATSAPP_QUEUE,
} from './queue.constants';

export interface EmailJobPayload {
  notificationId: string;
  recipient: string;
  templateKey: string;
  templateVersion: string;
  subject: string;
  html: string;
  text: string;
}

export interface SmsJobPayload {
  notificationId: string;
  recipient: string;
  templateKey: string;
  templateVersion: string;
  message: string;
}

export interface WhatsAppJobPayload {
  notificationId: string;
  recipient: string;
  templateKey: string;
  templateVersion: string;
  templateName: string;
  templateData: Record<string, string>;
}

export interface EnqueueOptions {
  jobId?: string;
  attempts?: number;
  backoff?: { type: 'exponential' | 'fixed'; delay: number };
  removeOnComplete?: { age: number; count: number } | number;
  removeOnFail?: { age: number; count: number } | number;
}

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(NOTIFICATIONS_EMAIL_QUEUE)
    private readonly emailQueue: Queue<EmailJobPayload>,
    @InjectQueue(NOTIFICATIONS_SMS_QUEUE)
    private readonly smsQueue: Queue<SmsJobPayload>,
    @InjectQueue(NOTIFICATIONS_WHATSAPP_QUEUE)
    private readonly whatsappQueue: Queue<WhatsAppJobPayload>,
  ) {}

  async enqueueEmail(payload: EmailJobPayload, options?: EnqueueOptions): Promise<string> {
    const job = await this.emailQueue.add(
      'send-email',
      {
        notificationId: payload.notificationId,
        recipient: payload.recipient,
        templateKey: payload.templateKey,
        templateVersion: payload.templateVersion,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      },
      {
        jobId: options?.jobId,
        attempts: options?.attempts,
        backoff: options?.backoff,
        removeOnComplete: options?.removeOnComplete,
        removeOnFail: options?.removeOnFail,
      },
    );
    return job.id ?? '';
  }

  async enqueueSms(payload: SmsJobPayload, options?: EnqueueOptions): Promise<string> {
    const job = await this.smsQueue.add(
      'send-sms',
      {
        notificationId: payload.notificationId,
        recipient: payload.recipient,
        templateKey: payload.templateKey,
        templateVersion: payload.templateVersion,
        message: payload.message,
      },
      {
        jobId: options?.jobId,
        attempts: options?.attempts,
        backoff: options?.backoff,
        removeOnComplete: options?.removeOnComplete,
        removeOnFail: options?.removeOnFail,
      },
    );
    return job.id ?? '';
  }

  async enqueueWhatsapp(payload: WhatsAppJobPayload, options?: EnqueueOptions): Promise<string> {
    const job = await this.whatsappQueue.add(
      'send-whatsapp',
      {
        notificationId: payload.notificationId,
        recipient: payload.recipient,
        templateKey: payload.templateKey,
        templateVersion: payload.templateVersion,
        templateName: payload.templateName,
        templateData: payload.templateData,
      },
      {
        jobId: options?.jobId,
        attempts: options?.attempts,
        backoff: options?.backoff,
        removeOnComplete: options?.removeOnComplete,
        removeOnFail: options?.removeOnFail,
      },
    );
    return job.id ?? '';
  }
}
