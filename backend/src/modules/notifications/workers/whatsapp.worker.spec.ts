// whatsapp.worker.spec.ts
// Tests unitaires NTF-01 : WhatsAppWorker process, failure, onFailed.

import { describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { WhatsAppWorker, MAX_ATTEMPTS } from './whatsapp.worker';
import { WhatsAppAdapter } from '../adapters/whatsapp.adapter';
import { NotificationsService } from '../notifications.service';
import { Job } from 'bullmq';
import type { WhatsAppJobPayload } from '../queue.service';

function makeJob(data: WhatsAppJobPayload, id = 'job-wa-1') {
  return {
    id,
    data,
    attemptsMade: 0,
    opts: { attempts: MAX_ATTEMPTS },
  } as unknown as Job<WhatsAppJobPayload>;
}

describe('WhatsAppWorker (NTF-01)', () => {
  let worker: WhatsAppWorker;
  let whatsappAdapter: WhatsAppAdapter;
  let notifications: NotificationsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        WhatsAppWorker,
        {
          provide: WhatsAppAdapter,
          useValue: {
            send: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-wa-1' }),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            markAsSent: vi.fn().mockResolvedValue(undefined),
            recordFailure: vi.fn().mockResolvedValue(undefined),
            moveToDeadLetter: vi.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    worker = moduleRef.get(WhatsAppWorker);
    whatsappAdapter = moduleRef.get(WhatsAppAdapter);
    notifications = moduleRef.get(NotificationsService);
  });

  it('process : succès → markAsSent appelé', async () => {
    const job = makeJob({
      notificationId: 'notif-wa-1',
      recipient: '+237687654321',
      templateKey: 'order.delivered',
      templateVersion: 'v1',
      templateName: 'order.delivered',
      templateData: { firstName: 'Aminat', orderRef: 'BRN-001' },
    });

    await worker.process(job);

    expect(whatsappAdapter.send).toHaveBeenCalledWith({
      to: '+237687654321',
      templateName: 'order.delivered',
      templateData: { firstName: 'Aminat', orderRef: 'BRN-001' },
    });
    expect(notifications.markAsSent).toHaveBeenCalledWith('notif-wa-1', job.id);
  });

  it('process : échec → recordFailure + rethrow', async () => {
    vi.mocked(whatsappAdapter.send).mockRejectedValueOnce(new Error('WhatsApp API timeout'));

    const job = makeJob({
      notificationId: 'notif-wa-2',
      recipient: '+237687654321',
      templateKey: 'order.delivered',
      templateVersion: 'v1',
      templateName: 'order.delivered',
      templateData: { firstName: 'Aminat' },
    });

    await expect(worker.process(job)).rejects.toThrow('WhatsApp API timeout');
    expect(notifications.recordFailure).toHaveBeenCalledWith(
      'notif-wa-2',
      expect.any(Error),
      job.id,
    );
  });

  it('onFailed : attempts max → moveToDeadLetter appelé', async () => {
    const job = makeJob(
      {
        notificationId: 'notif-wa-3',
        recipient: '+237687654321',
        templateKey: 'order.delivered',
        templateVersion: 'v1',
        templateName: 'order.delivered',
        templateData: {},
      },
      'job-wa-3',
    );
    (job as unknown as { attemptsMade: number }).attemptsMade = MAX_ATTEMPTS - 1;

    // @ts-expect-error onFailed event test
    await (
      worker as unknown as {
        onFailed?: (job: Job<WhatsAppJobPayload>, error: Error) => Promise<void>;
      }
    ).onFailed(job, new Error('Permanent wa failure'));

    expect(notifications.moveToDeadLetter).toHaveBeenCalledWith(
      'notif-wa-3',
      expect.any(Error),
      'notifications-whatsapp',
      'send-whatsapp',
      'job-wa-3',
      MAX_ATTEMPTS,
    );
  });
});
