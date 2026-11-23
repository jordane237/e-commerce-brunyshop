import { BadRequestException, ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { EventEmitter2 } from '@nestjs/event-emitter';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { PrismaService } from '../../infrastructure/database/database.module';
import type { AuditLogService } from '../audit/audit.service';
import type { CartPricingService } from '../cart/cart-pricing.service';
import type { CartValidationService } from '../cart/cart-validation.service';
import { CartIssueCode } from '../cart/dto/cart-validation-response.dto';
import type { InventoryService } from '../inventory/inventory.service';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { OrderAttemptService } from './order-attempt.service';
import { ORDER_CREATED_EVENT } from './events/order-created.event';
import { OrdersService } from './orders.service';
import type { OrderReferenceGenerator } from './reference/order-reference.generator';

const IDEMPOTENCY_KEY = '6f1c2b9e-3d4a-4c5b-9e8f-0a1b2c3d4e5f';

const ACTOR: AuthenticatedUser = {
  id: 'user-1',
  email: 'client@brunyshop.test',
  phone: null,
  roles: ['CUSTOMER'],
  twoFactorEnabled: false,
};

const DTO: CreateOrderDto = {
  items: [{ variantId: 'variant-1', quantity: 1 }],
  address: {
    recipientName: 'Awa',
    phone: '+237699000001',
    city: 'Douala',
    district: 'Bonapriso',
    line: 'Rue 12',
  },
  paymentMethod: 'COD',
};

const VALID_CART = {
  valid: true,
  items: [],
  subtotal: 30000,
  discount: 0,
  total: 30000,
  issues: [],
  meta: { validatedAt: new Date().toISOString(), itemCount: 1, totalQuantity: 1 },
};

function orderRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    reference: 'BRN-2611-ABCD',
    status: 'PENDING_CONFIRMATION',
    paymentStatus: 'PENDING',
    paymentMethod: 'COD',
    subtotal: 30000,
    discount: 0,
    shippingFee: 1500,
    total: 31500,
    addressSnapshot: { recipientName: 'Awa' },
    idempotencyRequestHash: null,
    createdAt: new Date('2026-11-11T10:00:00.000Z'),
    ...overrides,
  };
}

function setup(options: { valid?: boolean; issue?: unknown } = {}) {
  const transaction = {
    productVariant: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'variant-1',
          sku: 'SKU-1',
          color: 'Noir',
          size: '42',
          price: null,
          stock: 5,
          reservedStock: 0,
          product: {
            id: 'product-1',
            name: 'Baskets',
            basePrice: 30000,
            promoPrice: null,
            promoStart: null,
            promoEnd: null,
            status: 'PUBLISHED',
            deletedAt: null,
          },
        },
      ]),
    },
    coupon: { findFirst: vi.fn().mockResolvedValue(null), update: vi.fn() },
    deliveryZone: {
      findMany: vi.fn().mockResolvedValue([{ id: 'zone-1', fee: 1500, cities: ['Douala'] }]),
      findUnique: vi.fn().mockResolvedValue({ id: 'zone-1', fee: 1500, cities: ['Douala'] }),
    },
    order: { create: vi.fn().mockResolvedValue(orderRecord()) },
    payment: { create: vi.fn().mockResolvedValue({ id: 'payment-1' }) },
    orderStatusHistory: { create: vi.fn().mockResolvedValue({ id: 'history-1' }) },
    shipment: { create: vi.fn().mockResolvedValue({ id: 'shipment-1' }) },
  };

  const prisma = {
    order: { findUnique: vi.fn().mockResolvedValue(null) },
    $transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback(transaction)),
  };
  const pricing = {
    calculatePrice: vi.fn().mockReturnValue({ unitPrice: 30000, listPrice: 30000 }),
    evaluateCoupon: vi.fn(),
  };
  const cartValidation = {
    validateCart: vi
      .fn()
      .mockResolvedValue(
        options.valid === false
          ? { ...VALID_CART, valid: false, issues: [options.issue] }
          : VALID_CART,
      ),
  };
  const inventory = {
    decrementStockAtomically: vi.fn().mockResolvedValue({}),
    emitLowStockEvents: vi.fn().mockResolvedValue(undefined),
  };
  const references = { generate: vi.fn().mockResolvedValue('BRN-2611-ABCD') };
  const attempts = { assertWithinLimit: vi.fn().mockResolvedValue(undefined) };
  const auditLog = { record: vi.fn().mockResolvedValue(undefined) };
  const events = { emit: vi.fn() };

  const service = new OrdersService(
    prisma as unknown as PrismaService,
    pricing as unknown as CartPricingService,
    cartValidation as unknown as CartValidationService,
    inventory as unknown as InventoryService,
    references as unknown as OrderReferenceGenerator,
    attempts as unknown as OrderAttemptService,
    auditLog as unknown as AuditLogService,
    events as unknown as EventEmitter2,
  );

  return {
    service,
    prisma,
    transaction,
    pricing,
    cartValidation,
    inventory,
    references,
    attempts,
    auditLog,
    events,
  };
}

describe('OrdersService (ORD-01)', () => {
  it('exige les coordonnées guest quand aucun utilisateur n’est authentifié', async () => {
    const { service, prisma } = setup();

    await expect(service.createOrder(DTO, IDEMPOTENCY_KEY, null)).rejects.toMatchObject({
      response: { code: 'GUEST_INFORMATION_REQUIRED' },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('refuse un moyen de paiement autre que COD dans le MVP', async () => {
    const { service } = setup();

    await expect(
      service.createOrder({ ...DTO, paymentMethod: 'MOBILE_MONEY' }, IDEMPOTENCY_KEY, ACTOR),
    ).rejects.toMatchObject({ response: { code: 'PAYMENT_METHOD_UNAVAILABLE' } });
  });

  it('mappe une insuffisance de stock du pré-check en 409 avec détails', async () => {
    const issue = {
      code: CartIssueCode.INSUFFICIENT_STOCK,
      message: 'Stock insuffisant : 1 disponible(s), 2 demandé(s).',
      variantId: 'variant-1',
      requestedQuantity: 2,
      availableQuantity: 1,
    };
    const { service, inventory } = setup({ valid: false, issue });

    let error: unknown;
    try {
      await service.createOrder(
        { ...DTO, items: [{ variantId: 'variant-1', quantity: 2 }] },
        IDEMPOTENCY_KEY,
        ACTOR,
      );
    } catch (caught: unknown) {
      error = caught;
    }

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).getResponse()).toMatchObject({
      code: 'INSUFFICIENT_STOCK',
      errors: [{ variantId: 'variant-1', requestedQuantity: 2, availableQuantity: 1 }],
    });
    expect(inventory.decrementStockAtomically).not.toHaveBeenCalled();
  });

  it('retourne la commande existante pour une clé d’idempotence déjà utilisée', async () => {
    const { service, prisma } = setup();
    prisma.order.findUnique.mockResolvedValue(orderRecord({ userId: ACTOR.id }));

    const response = await service.createOrder(DTO, IDEMPOTENCY_KEY, ACTOR);

    expect(response.reference).toBe('BRN-2611-ABCD');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('refuse la même clé avec un corps différent (409)', async () => {
    const { service, prisma } = setup();
    prisma.order.findUnique.mockResolvedValue(
      orderRecord({ userId: ACTOR.id, idempotencyRequestHash: 'empreinte-differente' }),
    );

    await expect(service.createOrder(DTO, IDEMPOTENCY_KEY, ACTOR)).rejects.toMatchObject({
      response: { code: 'IDEMPOTENCY_CONFLICT' },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('interdit de réutiliser la clé d’idempotence d’un autre client', async () => {
    const { service, prisma } = setup();
    prisma.order.findUnique.mockResolvedValue(orderRecord({ userId: 'other-user' }));

    await expect(service.createOrder(DTO, IDEMPOTENCY_KEY, ACTOR)).rejects.toMatchObject({
      response: { code: 'IDEMPOTENCY_CONFLICT' },
    });
  });

  it('refuse la commande au-delà de la limite par téléphone (429) et l’audite', async () => {
    const { service, attempts, auditLog } = setup();
    attempts.assertWithinLimit.mockRejectedValue(
      new HttpException({ code: 'ORDER_RATE_LIMIT_EXCEEDED' }, HttpStatus.TOO_MANY_REQUESTS),
    );

    await expect(
      service.createOrder(
        { ...DTO, guestName: 'Awa', guestPhone: '+237699000001' },
        IDEMPOTENCY_KEY,
        null,
      ),
    ).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: 'ORDER_RATE_LIMITED' }),
    );
  });

  it('crée commande, paiement, expédition, mouvement et audit dans la même transaction', async () => {
    const { service, transaction, inventory, auditLog, events } = setup();

    const response = await service.createOrder(DTO, IDEMPOTENCY_KEY, ACTOR);

    expect(transaction.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: ACTOR.id,
          subtotal: 30000,
          shippingFee: 1500,
          total: 31500,
          paymentMethod: 'COD',
          idempotencyKey: IDEMPOTENCY_KEY,
          idempotencyRequestHash: expect.any(String),
        }),
      }),
    );
    expect(transaction.payment.create).toHaveBeenCalledWith({
      data: { orderId: 'order-1', provider: 'cod', amount: 31500, status: 'PENDING' },
    });
    expect(transaction.shipment.create).toHaveBeenCalledWith({
      data: { orderId: 'order-1', zoneId: 'zone-1', status: 'PENDING' },
    });
    expect(inventory.decrementStockAtomically).toHaveBeenCalledWith(
      transaction,
      'variant-1',
      1,
      'order-1',
      ACTOR.id,
      'PURCHASE',
    );
    expect(auditLog.record).toHaveBeenCalledWith(
      transaction,
      expect.objectContaining({
        action: 'ORDER_CREATED',
        entity: 'Order',
        entityId: 'order-1',
        after: expect.objectContaining({ reference: 'BRN-2611-ABCD', total: 31500 }),
      }),
    );
    expect(events.emit).toHaveBeenCalledWith(ORDER_CREATED_EVENT, expect.anything());
    expect(response).toMatchObject({ reference: 'BRN-2611-ABCD', total: 31500 });
  });

  it('annule la commande si le décrément de stock échoue', async () => {
    const { service, inventory, events } = setup();
    inventory.decrementStockAtomically.mockRejectedValue(
      new ConflictException({ code: 'INSUFFICIENT_STOCK', message: 'Stock insuffisant' }),
    );

    await expect(service.createOrder(DTO, IDEMPOTENCY_KEY, ACTOR)).rejects.toMatchObject({
      response: { code: 'INSUFFICIENT_STOCK' },
    });
    expect(events.emit).not.toHaveBeenCalled();
  });

  it('rejette une ville sans zone de livraison', async () => {
    const { service, transaction } = setup();
    transaction.deliveryZone.findMany.mockResolvedValue([
      { id: 'zone-1', fee: 1500, cities: ['Yaoundé'] },
    ]);

    await expect(
      service.createOrder(
        { ...DTO, address: { ...DTO.address, city: 'Kribi' } },
        IDEMPOTENCY_KEY,
        ACTOR,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejette une ville incohérente avec la zone choisie', async () => {
    const { service, transaction } = setup();
    transaction.deliveryZone.findUnique.mockResolvedValue({
      id: 'zone-1',
      fee: 1500,
      cities: ['Yaoundé'],
    });

    await expect(
      service.createOrder(
        { ...DTO, deliveryZoneId: '35b0f8a0-7f2f-4a3e-9d1c-2b3c4d5e6f70' },
        IDEMPOTENCY_KEY,
        ACTOR,
      ),
    ).rejects.toMatchObject({ response: { code: 'DELIVERY_ZONE_MISMATCH' } });
  });

  it('recalcule le prix depuis le catalogue sans aucun montant client', async () => {
    const { service, transaction, pricing } = setup();

    await service.createOrder(DTO, IDEMPOTENCY_KEY, ACTOR);

    expect(pricing.calculatePrice).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'product-1', basePrice: 30000 }),
      expect.objectContaining({ id: 'variant-1' }),
      expect.any(Date),
    );
    expect(transaction.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: 30000,
          items: {
            create: [
              expect.objectContaining({
                unitPrice: 30000,
                nameSnapshot: 'Baskets',
                sizeSnapshot: '42',
                colorSnapshot: 'Noir',
              }),
            ],
          },
        }),
      }),
    );
  });

  it('fige le créneau et l’appel avant livraison dans l’instantané d’adresse', async () => {
    const { service, transaction } = setup();

    await service.createOrder(
      {
        ...DTO,
        address: { ...DTO.address, slot: 'afternoon', callBeforeDelivery: true },
      },
      IDEMPOTENCY_KEY,
      ACTOR,
    );

    expect(transaction.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          addressSnapshot: expect.objectContaining({
            slot: 'afternoon',
            callBeforeDelivery: true,
          }),
        }),
      }),
    );
  });
});
