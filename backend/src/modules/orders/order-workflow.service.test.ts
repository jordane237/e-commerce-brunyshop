import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../infrastructure/database/database.module';
import type { AuditLogService } from '../audit/audit.service';
import { OrderWorkflowService } from './order-workflow.service';

const ADMIN = { userId: 'admin-1', roles: ['ADMIN'] };
const DRIVER = { userId: 'driver-1', roles: ['LIVREUR'] };

const ORDER = {
  id: 'order-1',
  reference: 'BRN-2611-ABCD',
  status: 'PENDING_CONFIRMATION',
  items: [{ variantId: 'variant-1', quantity: 2 }],
};

const HISTORY_ROW = {
  id: 'history-1',
  fromStatus: 'PENDING_CONFIRMATION',
  toStatus: 'CONFIRMED',
  reason: null,
  note: null,
  userId: 'admin-1',
  createdAt: new Date('2026-11-23T15:00:00.000Z'),
  user: { firstName: 'Ada', lastName: 'Admin' },
};

function setup(order: Record<string, unknown> | null = ORDER) {
  const tx = {
    order: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findUnique: vi.fn().mockResolvedValue({ status: 'CONFIRMED' }),
    },
    orderStatusHistory: {
      create: vi.fn().mockResolvedValue({ createdAt: new Date('2026-11-23T15:00:00.000Z') }),
      findMany: vi.fn().mockResolvedValue([HISTORY_ROW]),
    },
    stockMovement: { create: vi.fn().mockResolvedValue({ id: 'movement-1' }) },
    $queryRaw: vi.fn().mockResolvedValue([{ stock: 5 }]),
  };
  const prisma = {
    order: { findFirst: vi.fn().mockResolvedValue(order) },
    $transaction: vi.fn(async (callback: (client: unknown) => unknown) => callback(tx)),
  };
  const audit = { record: vi.fn().mockResolvedValue(undefined) };
  const service = new OrderWorkflowService(
    prisma as unknown as PrismaService,
    audit as unknown as AuditLogService,
  );
  return { service, prisma, tx, audit };
}

describe('OrderWorkflowService — transitions', () => {
  it('applique une transition autorisée, écrit l’historique et l’audit', async () => {
    const { service, tx, audit } = setup();

    const result = await service.changeStatus(
      'order-1',
      { status: 'CONFIRMED', reason: 'Validation téléphonique' },
      ADMIN,
      { ip: '10.0.0.1' },
    );

    expect(result).toMatchObject({
      id: 'order-1',
      reference: 'BRN-2611-ABCD',
      previousStatus: 'PENDING_CONFIRMATION',
      status: 'CONFIRMED',
      changedAt: '2026-11-23T15:00:00.000Z',
    });
    expect(result.history[0]).toMatchObject({
      fromStatus: 'PENDING_CONFIRMATION',
      toStatus: 'CONFIRMED',
      userName: 'Ada Admin',
    });
    expect(tx.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'order-1', status: 'PENDING_CONFIRMATION' },
      data: { status: 'CONFIRMED' },
    });
    expect(tx.orderStatusHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'order-1',
        fromStatus: 'PENDING_CONFIRMATION',
        toStatus: 'CONFIRMED',
        reason: 'Validation téléphonique',
        userId: 'admin-1',
      }),
    });
    expect(audit.record).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: 'ORDER_STATUS_CHANGED',
        entity: 'Order',
        entityId: 'order-1',
        ip: '10.0.0.1',
        before: { status: 'PENDING_CONFIRMATION' },
        after: expect.objectContaining({ status: 'CONFIRMED' }),
      }),
    );
  });

  it('refuse une transition interdite en 409 sans rien écrire', async () => {
    const { service, tx } = setup();

    await expect(
      service.changeStatus('order-1', { status: 'DELIVERED' }, ADMIN),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      service.changeStatus('order-1', { status: 'DELIVERED' }, ADMIN),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.order.updateMany).not.toHaveBeenCalled();
    expect(tx.orderStatusHistory.create).not.toHaveBeenCalled();
  });

  it('refuse une commande inexistante en 404', async () => {
    const { service } = setup(null);

    await expect(
      service.changeStatus('00000000-0000-4000-8000-000000000000', { status: 'CONFIRMED' }, ADMIN),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuse un rôle non habilité en 403', async () => {
    const { service, tx } = setup();

    await expect(
      service.changeStatus('order-1', { status: 'CONFIRMED' }, DRIVER),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.order.updateMany).not.toHaveBeenCalled();
  });

  it('laisse le livreur constater la livraison', async () => {
    const { service } = setup({ ...ORDER, status: 'SHIPPED' });

    await expect(
      service.changeStatus('order-1', { status: 'DELIVERED' }, DRIVER),
    ).resolves.toMatchObject({ status: 'DELIVERED', previousStatus: 'SHIPPED' });
  });

  it('détecte une transition concurrente (409 STALE_ORDER_STATUS)', async () => {
    const { service, tx } = setup();
    tx.order.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      service.changeStatus('order-1', { status: 'CONFIRMED' }, ADMIN),
    ).rejects.toMatchObject({ status: 409 });
    expect(tx.orderStatusHistory.create).not.toHaveBeenCalled();
  });

  it('restitue le stock et trace un mouvement CANCELLATION', async () => {
    const { service, tx } = setup({ ...ORDER, status: 'CONFIRMED' });

    await service.changeStatus(
      'order-1',
      { status: 'CANCELLED', reason: 'Client injoignable' },
      ADMIN,
    );

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.stockMovement.create).toHaveBeenCalledWith({
      data: {
        variantId: 'variant-1',
        delta: 2,
        reason: 'CANCELLATION',
        orderId: 'order-1',
        userId: 'admin-1',
        before: 3,
        after: 5,
      },
    });
  });

  it('ne touche pas au stock pour une transition non annulante', async () => {
    const { service, tx } = setup();

    await service.changeStatus('order-1', { status: 'CONFIRMED' }, ADMIN);

    expect(tx.$queryRaw).not.toHaveBeenCalled();
    expect(tx.stockMovement.create).not.toHaveBeenCalled();
  });
});
