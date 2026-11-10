// notifications.service.spec.ts
// Tests unitaires NTF-01 : NotificationsService enqueue, recordFailure,
// moveToDeadLetter, findDeadLetters.

import { describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { QueueService } from './queue.service';
import { PrismaService } from '../../infrastructure/database/database.module';
import { AuditService } from '../../modules/audit/audit.service';
import { ConfigService } from '@nestjs/config';

describe('NotificationsService (NTF-01)', () => {
  let service: NotificationsService;
  let queue: QueueService;
  let prisma: PrismaService;
  let audit: AuditService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: QueueService,
          useValue: {
            enqueueEmail: vi.fn().mockResolvedValue('job-email-1'),
            enqueueSms: vi.fn().mockResolvedValue('job-sms-1'),
            enqueueWhatsapp: vi.fn().mockResolvedValue('job-wa-1'),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            notification: {
              create: vi.fn().mockResolvedValue({
                id: 'notif-test',
                userId: null,
                channel: 'EMAIL' as const,
                templateKey: 'order.confirmed',
                templateVersion: 'v1',
                recipient: 'client@brunyshop.cm',
                status: 'PENDING',
                attempts: 0,
              }),
              update: vi.fn().mockResolvedValue({}),
              findUnique: vi.fn().mockResolvedValue(null),
            },
            deadLetterJob: {
              create: vi.fn().mockResolvedValue({}),
              findMany: vi.fn().mockResolvedValue([]),
              count: vi.fn().mockResolvedValue(0),
            },
            $transaction: vi
              .fn()
              .mockImplementation(async (ops) =>
                ops.map((op) => (typeof op === 'function' ? op() : op)),
              ),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: vi.fn().mockResolvedValue(undefined),
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

    service = moduleRef.get(NotificationsService);
    queue = moduleRef.get(QueueService);
    prisma = moduleRef.get(PrismaService);
    audit = moduleRef.get(AuditService);
  });

  it('enqueueEmail crée une notification PENDING et enfile dans la queue email', async () => {
    const id = await service.enqueueEmail(
      'user-1',
      'client@brunyshop.cm',
      'order.confirmed',
      'v1',
      {
        firstName: 'Test',
        orderRef: 'BRN-001',
        total: '12000',
        orderUrl: 'https://brunyshop.cm/commandes/BRN-001',
      },
      { metadata: { orderId: 'ord-1' } },
    );

    expect(id).toBe('notif-test');
    expect(queue.enqueueEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationId: 'notif-test',
        recipient: 'client@brunyshop.cm',
        templateKey: 'order.confirmed',
        templateVersion: 'v1',
      }),
      undefined,
    );
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          channel: 'EMAIL',
          templateKey: 'order.confirmed',
          templateVersion: 'v1',
          recipient: 'client@brunyshop.cm',
          status: 'PENDING',
        }),
      }),
    );
  });

  it('recordFailure met à jour la notification en FAILED avec lastError', async () => {
    await service.recordFailure('notif-test', new Error('Connection refused'));

    expect(prisma.notification.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'notif-test' },
        data: expect.objectContaining({
          status: 'FAILED',
          lastError: 'Connection refused',
        }),
      }),
    );
  });

  it('moveToDeadLetter met à jour notification + crée DeadLetterJob + audit', async () => {
    await service.moveToDeadLetter(
      'notif-test',
      new Error('Permanent failure'),
      'notifications-email',
      'send-email',
      'job-1',
      5,
    );

    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-test' },
      data: { status: 'DEAD_LETTER' },
    });
    expect(prisma.deadLetterJob.create).toHaveBeenCalledWith(
      expect.objectContaining({
        queueName: 'notifications-email',
        jobName: 'send-email',
        jobId: 'job-1',
        attempts: 5,
        error: 'Permanent failure',
      }),
    );
    expect(audit.log).toHaveBeenCalled();
  });

  it('findDeadLetters retourne une liste paginée', async () => {
    vi.mocked(prisma.deadLetterJob.findMany).mockResolvedValueOnce([
      {
        id: 'dlq-1',
        queueName: 'notifications-email',
        jobId: 'job-1',
        jobName: 'send-email',
        payload: {},
        error: 'Permanent failure',
        attempts: 5,
        failedAt: new Date('2026-02-01T12:00:00Z'),
      },
    ]);
    vi.mocked(prisma.deadLetterJob.count).mockResolvedValueOnce(1);

    const result = await service.findDeadLetters({ page: 1, limit: 20 });

    expect(result.meta.total).toBe(1);
    expect(result.meta.page).toBe(1);
    expect(result.data).toHaveLength(1);
  });

  it('findDeadLetters filtre par queueName', async () => {
    await service.findDeadLetters({ queueName: 'notifications-email' });

    expect(prisma.deadLetterJob.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          queueName: 'notifications-email',
        }),
      }),
    );
  });
});
