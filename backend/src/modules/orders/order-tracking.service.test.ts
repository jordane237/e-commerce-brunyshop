import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../infrastructure/database/database.module';
import type { AuditLogService } from '../audit/audit.service';

import { OrderTrackingService } from './order-tracking.service';
import type { OrderAttemptService } from './order-attempt.service';
import type { TrackOrderDto } from './dto/track-order.dto';

const DTO: TrackOrderDto = {
  reference: 'BRN-2611-7K3F',
  phone: '+237612345678',
};

function orderRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    reference: 'BRN-2611-7K3F',
    status: 'PENDING_CONFIRMATION',
    subtotal: 52500,
    discount: 0,
    shippingFee: 0,
    total: 52500,
    createdAt: new Date('2026-11-10T14:32:00.000Z'),
    addressSnapshot: { recipientName: 'Jean-Paul', phone: '+237612345678', line: 'Rue 1' },
    guestPhone: '+237612345678',
    guestName: 'Jean-Paul',
    userId: 'user-1',
    idempotencyKey: 'idemp-1',
    items: [
      {
        id: 'item-1',
        nameSnapshot: 'Mocassin',
        sizeSnapshot: '41',
        colorSnapshot: 'Noir',
        unitPrice: 24500,
        quantity: 1,
        createdAt: new Date('2026-11-10T14:32:00.000Z'),
      },
    ],
    shipment: {
      status: 'PENDING',
      deliveredAt: null,
      zone: { name: 'Douala', estimatedDays: 1 },
    },
    user: { phone: '+237612345678', email: 'client@example.cm' },
    ...overrides,
  };
}

function setup(options: { found?: boolean; rateLimited?: boolean } = {}) {
  const prisma = {
    order: {
      findFirst: vi.fn().mockResolvedValue(options.found === false ? null : orderRecord()),
    },
  };
  const audit = { record: vi.fn().mockResolvedValue(undefined) };
  const attempts = {
    isTrackingRateLimited: vi.fn().mockResolvedValue(options.rateLimited === true),
    recordTrackingAttempt: vi.fn().mockResolvedValue(undefined),
  };
  const service = new OrderTrackingService(
    prisma as unknown as PrismaService,
    audit as unknown as AuditLogService,
    attempts as unknown as OrderAttemptService,
  );
  return { service, prisma, audit, attempts };
}

describe('OrderTrackingService', () => {
  it('retourne found:true et la commande sans PII', async () => {
    const { service } = setup();
    const result = await service.track(DTO, { ipAddress: '127.0.0.1' });

    expect(result.found).toBe(true);
    expect(result.order?.reference).toBe('BRN-2611-7K3F');
    expect(result.order?.items).toHaveLength(1);
    expect(result.order?.items[0]).toMatchObject({ name: 'Mocassin', size: '41', color: 'Noir' });
    expect(result.order?.shippingCity).toBe('Douala');

    const json = JSON.stringify(result);
    for (const forbidden of [
      'email',
      'phone',
      'addressSnapshot',
      'guestName',
      'userId',
      'idempotencyKey',
      'source',
      'providerRef',
      'userAgent',
      'ipAddress',
    ]) {
      expect(json).not.toContain(forbidden);
    }
  });

  it('retourne found:false et la même structure en cas d’échec', async () => {
    const { service } = setup({ found: false });
    const result = await service.track(DTO);

    expect(result).toEqual({ found: false });
    expect(result.order).toBeUndefined();
  });

  it('jette 429 si le couple est rate-limited', async () => {
    const { service } = setup({ rateLimited: true });
    await expect(service.track(DTO)).rejects.toBeInstanceOf(HttpException);
    await expect(service.track(DTO)).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
  });

  it('audite ORDER_TRACKED en succès et ORDER_TRACK_ATTEMPT en échec', async () => {
    const success = setup();
    await success.service.track(DTO, { ipAddress: '127.0.0.1', userAgent: 'jest' });
    expect(success.audit.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: 'ORDER_TRACKED' }),
    );

    const failure = setup({ found: false });
    await failure.service.track(DTO, { ipAddress: '127.0.0.1', userAgent: 'jest' });
    expect(failure.audit.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: 'ORDER_TRACK_ATTEMPT' }),
    );
  });

  it('masque le téléphone dans l’audit', async () => {
    const { service, audit } = setup();
    await service.track(DTO, { ipAddress: '127.0.0.1' });
    const call = audit.record.mock.calls[0][1] as { after: { phoneMasked: string } };
    expect(call.after.phoneMasked).toBe('***5678');
  });
});
