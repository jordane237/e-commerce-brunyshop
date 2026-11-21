import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../../infrastructure/database/database.module';
import { StockLowEvent } from '../events/stock-low.event';
import { StockLowListener } from './stock-low.listener';

const EVENT = new StockLowEvent({
  variantId: 'variant-1',
  productId: 'product-1',
  productName: 'Baskets',
  sku: 'SKU-1',
  size: '42',
  color: 'NOIR',
  currentStock: 5,
  reservedStock: 0,
  availableStock: 5,
  threshold: 5,
  occurredAt: '2026-11-16T10:00:00.000Z',
});

function setup(options: { enabled?: boolean; claimed?: number; stock?: number } = {}) {
  const prisma = {
    productVariant: {
      findUnique: vi.fn().mockResolvedValue({
        stock: options.stock ?? 5,
        reservedStock: 0,
        lowStockThreshold: 5,
        product: { deletedAt: null },
      }),
      updateMany: vi.fn().mockResolvedValue({ count: options.claimed ?? 1 }),
    },
    user: {
      findMany: vi.fn().mockResolvedValue([{ id: 'admin-1', email: 'admin@brunyshop.test' }]),
    },
  };
  const notifications = {
    enqueueInApp: vi.fn().mockResolvedValue('notif-in-app'),
    enqueueEmail: vi.fn().mockResolvedValue('notif-email'),
  };
  const audit = { record: vi.fn().mockResolvedValue(undefined) };
  const config = {
    get: vi.fn((key: string) => {
      if (key === 'app.stock.lowAlertEnabled') return options.enabled ?? true;
      if (key === 'app.publicAdminUrl') return 'http://localhost:4300';
      return undefined;
    }),
  };

  const listener = new StockLowListener(
    prisma as unknown as PrismaService,
    notifications as never,
    audit as never,
    config as never,
  );
  return { listener, prisma, notifications, audit };
}

describe('StockLowListener (STK-03)', () => {
  it('réclame l’alerte, notifie chaque admin et écrit l’audit système', async () => {
    const { listener, prisma, notifications, audit } = setup();

    await listener.handle(EVENT);

    expect(prisma.productVariant.updateMany).toHaveBeenCalledWith({
      where: { id: 'variant-1', lowStockAlertSentAt: null },
      data: { lowStockAlertSentAt: expect.any(Date) },
    });
    expect(notifications.enqueueInApp).toHaveBeenCalledTimes(1);
    expect(notifications.enqueueEmail).toHaveBeenCalledWith(
      'admin-1',
      'admin@brunyshop.test',
      'stock.low',
      'v1',
      expect.objectContaining({ availableStock: 5, threshold: 5 }),
      expect.any(Object),
    );
    expect(audit.record).toHaveBeenCalledWith(
      prisma,
      expect.objectContaining({
        userId: null,
        action: 'STOCK_LOW_ALERT_SENT',
        entityId: 'variant-1',
      }),
    );
  });

  it('ne renvoie rien quand le flag a déjà été réclamé', async () => {
    const { listener, notifications, audit } = setup({ claimed: 0 });

    await listener.handle(EVENT);

    expect(notifications.enqueueInApp).not.toHaveBeenCalled();
    expect(notifications.enqueueEmail).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('ne fait rien quand les notifications sont désactivées', async () => {
    const { listener, prisma, notifications } = setup({ enabled: false });

    await listener.handle(EVENT);

    expect(prisma.productVariant.findUnique).not.toHaveBeenCalled();
    expect(notifications.enqueueInApp).not.toHaveBeenCalled();
  });

  it('ne fait rien si la variante est repassée au-dessus du seuil', async () => {
    const { listener, prisma, notifications } = setup({ stock: 6 });

    await listener.handle(EVENT);

    expect(prisma.productVariant.updateMany).not.toHaveBeenCalled();
    expect(notifications.enqueueInApp).not.toHaveBeenCalled();
  });
});
