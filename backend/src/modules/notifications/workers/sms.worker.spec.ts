// sms.worker.spec.ts
// Tests unitaires NTF-01 : SmsWorker process, failure, onFailed.

import { describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { SmsWorker, MAX_ATTEMPTS } from './sms.worker';
import { SmsAdapter } from '../adapters/sms.adapter';
import { NotificationsService } from '../notifications.service';
import { Job } from 'bullmq';
import type { SmsJobPayload } from '../queue.service';

function makeJob(data: SmsJobPayload, id = 'job-sms-1') {
  return {
    id,
    data,
    attemptsMade: 0,
    opts: { attempts: MAX_ATTEMPTS },
  } as unknown as Job<SmsJobPayload>;
}

describe('SmsWorker (NTF-01)', () => {
  let worker: SmsWorker;
  let smsAdapter: SmsAdapter;
  let notifications: NotificationsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SmsWorker,
        {
          provide: SmsAdapter,
          useValue: {
            send: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-sms-1' }),
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

    worker = moduleRef.get(SmsWorker);
    smsAdapter = moduleRef.get(SmsAdapter);
    notifications = moduleRef.get(NotificationsService);
  });

  it('process : succès → markAsSent appelé', async () => {
    const job = makeJob({
      notificationId: 'notif-sms-1',
      recipient: '+237612345678',
      templateKey: 'order.shipped',
      templateVersion: 'v1',
      message: 'Votre commande est expédiée.',
    });

    await worker.process(job);

    expect(smsAdapter.send).toHaveBeenCalledWith({
      to: '+237612345678',
      message: 'Votre commande est expédiée.',
    });
    expect(notifications.markAsSent).toHaveBeenCalledWith('notif-sms-1', job.id);
    expect(notifications.recordFailure).not.toHaveBeenCalled();
  });

  it('process : échec → recordFailure + rethrow', async () => {
    vi.mocked(smsAdapter.send).mockRejectedValueOnce(new Error('SMS provider unreachable'));

    const job = makeJob({
      notificationId: 'notif-sms-2',
      recipient: '+237612345678',
      templateKey: 'order.shipped',
      templateVersion: 'v1',
      message: 'Votre commande est expédiée.',
    });

    await expect(worker.process(job)).rejects.toThrow('SMS provider unreachable');
    expect(notifications.recordFailure).toHaveBeenCalledWith(
      'notif-sms-2',
      expect.any(Error),
      job.id,
    );
  });

  it('onFailed : attempts max → moveToDeadLetter appelé', async () => {
    const job = makeJob(
      {
        notificationId: 'notif-sms-3',
        recipient: '+237612345678',
        templateKey: 'order.shipped',
        templateVersion: 'v1',
        message: 'Votre commande est expédiée.',
      },
      'job-sms-3',
    );
    (job as unknown as { attemptsMade: number }).attemptsMade = MAX_ATTEMPTS - 1;

    // @ts-expect-error onFailed event test
    await (
      worker as unknown as { onFailed?: (job: Job<SmsJobPayload>, error: Error) => Promise<void> }
    ).onFailed(job, new Error('Permanent sms failure'));

    expect(notifications.moveToDeadLetter).toHaveBeenCalledWith(
      'notif-sms-3',
      expect.any(Error),
      'notifications-sms',
      'send-sms',
      'job-sms-3',
      MAX_ATTEMPTS,
    );
  });
});
