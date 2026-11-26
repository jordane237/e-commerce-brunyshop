import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../infrastructure/database/database.module';
import type { AuditLogService } from '../audit/audit.service';
import type { NotificationsService } from '../notifications/notifications.service';
import { OrderConfirmationService } from './order-confirmation.service';

const ACTOR = {
  id: 'admin-1',
  email: 'a@b.c',
  phone: null,
  roles: ['ADMIN'],
  twoFactorEnabled: false,
};

function baseOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    reference: 'BRN-2611-ABCD',
    status: 'PENDING_CONFIRMATION',
    paymentMethod: 'COD',
    total: 25000,
    guestPhone: '+237612345678',
    confirmedAt: null,
    ...overrides,
  };
}

function setup(options: { order?: unknown; shipment?: unknown; threshold?: number } = {}) {
  const order = options.order === undefined ? baseOrder() : options.order;
  const shipment =
    options.shipment === undefined
      ? {
          id: 'ship-1',
          orderId: 'order-1',
          status: 'DELIVERED',
          order: { id: 'order-1', reference: 'BRN-2611-ABCD', total: 25000, paymentMethod: 'COD' },
        }
      : options.shipment;

  const prisma = {
    order: {
      findUnique: vi.fn().mockResolvedValue(order),
      update: vi
        .fn()
        .mockImplementation(async ({ data }) => ({
          ...order,
          ...data,
          id: 'order-1',
          reference: 'BRN-2611-ABCD',
          createdAt: new Date(),
          paymentStatus: 'PENDING',
          paymentMethod: 'COD',
          subtotal: 25000,
          discount: 0,
          shippingFee: 0,
          total: 25000,
        })),
    },
    setting: {
      findUnique: vi
        .fn()
        .mockResolvedValue(options.threshold === undefined ? null : { value: options.threshold }),
    },
    shipment: {
      findUnique: vi.fn().mockResolvedValue(shipment),
      update: vi
        .fn()
        .mockImplementation(async ({ data }) => ({
          id: 'ship-1',
          orderId: 'order-1',
          status: 'DELIVERED',
          codCollected: true,
          ...data,
        })),
    },
  };
  const audit = { record: vi.fn().mockResolvedValue(undefined) };
  const notifications = {
    enqueueSms: vi.fn().mockResolvedValue('n1'),
    enqueueWhatsapp: vi.fn().mockResolvedValue('n2'),
  };
  const service = new OrderConfirmationService(
    prisma as unknown as PrismaService,
    notifications as unknown as NotificationsService,
    audit as unknown as AuditLogService,
  );
  return { service, prisma, audit, notifications };
}

describe('OrderConfirmationService', () => {
  it('getCodConfirmationThreshold retourne la valeur par défaut si absente', async () => {
    const { service } = setup();
    await expect(service.getCodConfirmationThreshold()).resolves.toBe(100000);
  });

  it('getCodConfirmationThreshold lit la valeur en base', async () => {
    const { service } = setup({ threshold: 50000 });
    await expect(service.getCodConfirmationThreshold()).resolves.toBe(50000);
  });

  it('confirmOrder CALL → confirmedAt, statut CONFIRMED, audit, SMS', async () => {
    const { service, audit, notifications } = setup();
    const result = await service.confirmOrder(
      'order-1',
      { method: 'CALL', notes: 'tel' },
      ACTOR,
      {},
    );
    expect(result.status).toBe('CONFIRMED');
    expect(result.confirmedBy).toBe('admin-1');
    expect(result.confirmationMethod).toBe('CALL');
    expect(result.confirmationNotes).toBe('tel');
    expect(audit.record).toHaveBeenCalled();
    expect(notifications.enqueueSms).toHaveBeenCalled();
  });

  it('confirmOrder commande non-COD → 400 NOT_COD_ORDER', async () => {
    const { service } = setup({ order: baseOrder({ paymentMethod: 'CARD' }) });
    await expect(service.confirmOrder('order-1', { method: 'CALL' }, ACTOR, {})).rejects.toThrow(
      BadRequestException,
    );
  });

  it('confirmOrder statut ≠ PENDING_CONFIRMATION → 400 INVALID_STATUS', async () => {
    const { service } = setup({ order: baseOrder({ status: 'CONFIRMED' }) });
    await expect(service.confirmOrder('order-1', { method: 'CALL' }, ACTOR, {})).rejects.toThrow(
      BadRequestException,
    );
  });

  it('confirmOrder inexistante → 404', async () => {
    const { service } = setup({ order: null });
    await expect(service.confirmOrder('order-1', { method: 'CALL' }, ACTOR, {})).rejects.toThrow(
      NotFoundException,
    );
  });

  it('validateStatusTransition PREPARING sans confirmedAt → 400', async () => {
    const { service } = setup();
    await expect(service.validateStatusTransition('order-1', 'PREPARING')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('validateStatusTransition PREPARING avec confirmedAt → OK', async () => {
    const { service } = setup({ order: baseOrder({ confirmedAt: new Date() }) });
    await expect(service.validateStatusTransition('order-1', 'PREPARING')).resolves.toBeUndefined();
  });

  it('collectCod succès → codCollected true, audit', async () => {
    const { service, audit } = setup();
    const result = await service.collectCod('ship-1', { amount: 25000 }, ACTOR, {});
    expect(result.codCollected).toBe(true);
    expect(result.codAmount).toBe(25000);
    expect(audit.record).toHaveBeenCalled();
  });

  it('collectCod shipment non-DELIVERED → 400', async () => {
    const { service } = setup({
      shipment: {
        id: 'ship-1',
        orderId: 'order-1',
        status: 'SHIPPED',
        order: { id: 'order-1', reference: 'BRN', total: 25000, paymentMethod: 'COD' },
      },
    });
    await expect(service.collectCod('ship-1', { amount: 25000 }, ACTOR, {})).rejects.toThrow(
      BadRequestException,
    );
  });

  it('collectCod amount > total → 400', async () => {
    const { service } = setup();
    await expect(service.collectCod('ship-1', { amount: 99999 }, ACTOR, {})).rejects.toThrow(
      BadRequestException,
    );
  });
});
