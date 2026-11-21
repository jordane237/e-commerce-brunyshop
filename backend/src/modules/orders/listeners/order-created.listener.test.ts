import { describe, expect, it, vi } from 'vitest';

import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../../../infrastructure/database/database.module';
import { formatXaf } from '../../cart/cart.utils';
import type { NotificationsService } from '../../notifications/notifications.service';
import { OrderCreatedEvent } from '../events/order-created.event';
import { OrderCreatedListener } from './order-created.listener';

function setup(
  options: { admins?: Array<{ id: string; email: string | null }>; fail?: boolean } = {},
) {
  const prisma = {
    user: { findMany: vi.fn().mockResolvedValue(options.admins ?? []) },
  };
  const notifications = {
    enqueueSms: vi.fn(async () => {
      if (options.fail === true) throw new Error('sms down');
      return 'notification-sms';
    }),
    enqueueEmail: vi.fn().mockResolvedValue('notification-email'),
  };
  const config = {
    get: vi.fn(() => ({ publicAppUrl: 'https://brunyshop.cm' })),
  };
  const listener = new OrderCreatedListener(
    prisma as unknown as PrismaService,
    notifications as unknown as NotificationsService,
    config as unknown as ConfigService,
  );
  return { listener, prisma, notifications };
}

const EVENT = new OrderCreatedEvent(
  'order-1',
  'BRN-2611-7K3F',
  null,
  'Awa',
  '+237699000001',
  null,
  31500,
  [{ productName: 'Baskets', size: '42', color: 'Noir', quantity: 1, unitPrice: 30000 }],
  new Date('2026-11-17T10:00:00.000Z'),
);

describe('OrderCreatedListener', () => {
  it('envoie le SMS de confirmation au client invité', async () => {
    const { listener, notifications } = setup();

    await listener.handle(EVENT);

    expect(notifications.enqueueSms).toHaveBeenCalledWith(
      null,
      '+237699000001',
      'order.created',
      'v1',
      {
        customerName: 'Awa',
        reference: 'BRN-2611-7K3F',
        total: formatXaf(31500),
        supportUrl: 'https://brunyshop.cm/contact',
      },
      { metadata: { orderId: 'order-1' } },
    );
  });

  it('notifie chaque administrateur actif', async () => {
    const { listener, notifications } = setup({
      admins: [{ id: 'admin-1', email: 'admin@brunyshop.cm' }],
    });

    await listener.handle(EVENT);

    expect(notifications.enqueueEmail).toHaveBeenCalledWith(
      'admin-1',
      'admin@brunyshop.cm',
      'order.created.admin',
      'v1',
      {
        reference: 'BRN-2611-7K3F',
        customerName: 'Awa',
        customerPhone: '+237699000001',
        total: formatXaf(31500),
        itemCount: 1,
        itemsSummary: `Baskets · 42 · Noir × 1 — ${formatXaf(30000)}`,
        createdAt: '2026-11-17T10:00:00.000Z',
      },
      { metadata: { orderId: 'order-1' } },
    );
  });

  it('n’échoue jamais la commande si une notification plante', async () => {
    const { listener, notifications } = setup({
      fail: true,
      admins: [{ id: 'admin-1', email: 'admin@brunyshop.cm' }],
    });

    await expect(listener.handle(EVENT)).resolves.toBeUndefined();
    expect(notifications.enqueueEmail).not.toHaveBeenCalled();
  });
});
