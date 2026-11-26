// email.worker.spec.ts
// Tests unitaires NTF-01 : EmailWorker process, failure, onFailed.

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { EmailWorker, MAX_ATTEMPTS } from './email.worker';
import { EmailAdapter } from '../adapters/email.adapter';
import { NotificationsService } from '../notifications.service';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import type { EmailJobPayload } from '../queue.service';

function makeJob(data: EmailJobPayload, id = 'job-1') {
  return {
    id,
    data,
    attemptsMade: 0,
    opts: { attempts: MAX_ATTEMPTS },
    progress: vi.fn(),
  } as unknown as Job<EmailJobPayload>;
}

describe('EmailWorker (NTF-01)', () => {
  let worker: EmailWorker;
  let emailAdapter: EmailAdapter;
  let notifications: NotificationsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        EmailWorker,
        {
          provide: EmailAdapter,
          useValue: {
            send: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-1' }),
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
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockReturnValue('console'),
          },
        },
      ],
    }).compile();

    worker = moduleRef.get(EmailWorker);
    emailAdapter = moduleRef.get(EmailAdapter);
    notifications = moduleRef.get(NotificationsService);
  });

  it('process : succès → markAsSent appelé', async () => {
    const job = makeJob({
      notificationId: 'notif-1',
      recipient: 'client@brunyshop.cm',
      templateKey: 'order.confirmed',
      templateVersion: 'v1',
      subject: 'Test',
      html: '<p>Test</p>',
      text: 'Test',
    });

    await worker.process(job);

    expect(emailAdapter.send).toHaveBeenCalledWith({
      to: 'client@brunyshop.cm',
      subject: 'Test',
      html: '<p>Test</p>',
      text: 'Test',
    });
    expect(notifications.markAsSent).toHaveBeenCalledWith('notif-1', job.id);
    expect(notifications.recordFailure).not.toHaveBeenCalled();
  });

  it('process : échec de l’adaptateur → recordFailure appelé + rethrow', async () => {
    vi.mocked(emailAdapter.send).mockRejectedValueOnce(new Error('SMTP connection refused'));

    const job = makeJob({
      notificationId: 'notif-2',
      recipient: 'client@brunyshop.cm',
      templateKey: 'order.confirmed',
      templateVersion: 'v1',
      subject: 'Test',
      html: '<p>Test</p>',
      text: 'Test',
    });

    await expect(worker.process(job)).rejects.toThrow('SMTP connection refused');
    expect(notifications.recordFailure).toHaveBeenCalledWith('notif-2', expect.any(Error), job.id);
    expect(notifications.markAsSent).not.toHaveBeenCalled();
  });

  it('onFailed : attempts max atteints → moveToDeadLetter appelé', async () => {
    const job = makeJob(
      {
        notificationId: 'notif-3',
        recipient: 'client@brunyshop.cm',
        templateKey: 'order.confirmed',
        templateVersion: 'v1',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      },
      'job-3',
    );
    job.attemptsMade = MAX_ATTEMPTS - 1;

    // @ts-expect-error onFailed event test
    await (
      worker as unknown as { onFailed?: (job: Job<EmailJobPayload>, error: Error) => Promise<void> }
    ).onFailed(job, new Error('Permanent failure'));

    expect(notifications.moveToDeadLetter).toHaveBeenCalledWith(
      'notif-3',
      expect.any(Error),
      'notifications-email',
      'send-email',
      'job-3',
      MAX_ATTEMPTS,
    );
    expect(notifications.recordFailure).not.toHaveBeenCalled();
  });
});
