// queue.service.spec.ts
// Tests unitaires NTF-01 : QueueService enfile les jobs sur les queues par canal.

import { describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { BullModule } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  QueueService,
  type EmailJobPayload,
  type SmsJobPayload,
  type WhatsAppJobPayload,
} from './queue.service';
import {
  NOTIFICATIONS_EMAIL_QUEUE,
  NOTIFICATIONS_SMS_QUEUE,
  NOTIFICATIONS_WHATSAPP_QUEUE,
} from './queue.constants';

/* eslint-disable @typescript-eslint/no-unused-vars */
function createMockQueue<T>() {
  const add = vi.fn<Promise<{ id: string }>, [{ name: string; data: T }]>();
  add.mockResolvedValue({ id: `job-${Math.random().toString(36).slice(2, 10)}` });

  const queue = {
    add,
  } as unknown as Queue<T>;

  vi.spyOn(Queue.prototype, 'add').mockImplementation(add);

  return { queue, add };
}

describe('QueueService (NTF-01)', () => {
  it('enqueueEmail ajoute un job send-email à la queue notifications-email', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        BullModule.registerQueue(
          { name: NOTIFICATIONS_EMAIL_QUEUE },
          { name: NOTIFICATIONS_SMS_QUEUE },
          { name: NOTIFICATIONS_WHATSAPP_QUEUE },
        ),
      ],
      providers: [QueueService],
    }).compile();

    const service = moduleRef.get(QueueService);
    const emailQueue = moduleRef.get<Queue<EmailJobPayload>>(NOTIFICATIONS_EMAIL_QUEUE);

    const payload: EmailJobPayload = {
      notificationId: 'notif-1',
      recipient: 'client@brunyshop.cm',
      templateKey: 'order.confirmed',
      templateVersion: 'v1',
      subject: 'Commande confirmée',
      html: '<p>Confirmation</p>',
      text: 'Confirmation',
    };

    const jobId = await service.enqueueEmail(payload);

    expect(jobId).toMatch(/^job-/);
    expect(emailQueue.add).toHaveBeenCalledWith(
      'send-email',
      expect.objectContaining({
        notificationId: 'notif-1',
        recipient: 'client@brunyshop.cm',
        templateKey: 'order.confirmed',
        templateVersion: 'v1',
      }),
      expect.any(Object),
    );
  });

  it('enqueueSms ajoute un job send-sms à la queue notifications-sms', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        BullModule.registerQueue(
          { name: NOTIFICATIONS_EMAIL_QUEUE },
          { name: NOTIFICATIONS_SMS_QUEUE },
          { name: NOTIFICATIONS_WHATSAPP_QUEUE },
        ),
      ],
      providers: [QueueService],
    }).compile();

    const service = moduleRef.get(QueueService);
    const smsQueue = moduleRef.get<Queue<SmsJobPayload>>(NOTIFICATIONS_SMS_QUEUE);

    const payload: SmsJobPayload = {
      notificationId: 'notif-2',
      recipient: '+237612345678',
      templateKey: 'order.shipped',
      templateVersion: 'v1',
      message: 'Votre commande est expédiée.',
    };

    const jobId = await service.enqueueSms(payload);

    expect(jobId).toMatch(/^job-/);
    expect(smsQueue.add).toHaveBeenCalledWith(
      'send-sms',
      expect.objectContaining({
        notificationId: 'notif-2',
        recipient: '+237612345678',
        templateKey: 'order.shipped',
      }),
      expect.any(Object),
    );
  });

  it('enqueueWhatsapp ajoute un job send-whatsapp à la queue notifications-whatsapp', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        BullModule.registerQueue(
          { name: NOTIFICATIONS_EMAIL_QUEUE },
          { name: NOTIFICATIONS_SMS_QUEUE },
          { name: NOTIFICATIONS_WHATSAPP_QUEUE },
        ),
      ],
      providers: [QueueService],
    }).compile();

    const service = moduleRef.get(QueueService);
    const waQueue = moduleRef.get<Queue<WhatsAppJobPayload>>(NOTIFICATIONS_WHATSAPP_QUEUE);

    const payload: WhatsAppJobPayload = {
      notificationId: 'notif-3',
      recipient: '+237687654321',
      templateKey: 'order.delivered',
      templateVersion: 'v1',
      templateName: 'order.delivered',
      templateData: { firstName: 'Aminat', orderRef: 'BRN-001' },
    };

    const jobId = await service.enqueueWhatsapp(payload);

    expect(jobId).toMatch(/^job-/);
    expect(waQueue.add).toHaveBeenCalledWith(
      'send-whatsapp',
      expect.objectContaining({
        notificationId: 'notif-3',
        recipient: '+237687654321',
        templateName: 'order.delivered',
      }),
      expect.any(Object),
    );
  });
});
