import { BadRequestException, ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { PrismaService } from '../../infrastructure/database/database.module';
import type { CartPricingService } from '../cart/cart-pricing.service';
import type { CartValidationService } from '../cart/cart-validation.service';
import { CartIssueCode } from '../cart/dto/cart-validation-response.dto';
import type { InventoryService } from '../inventory/inventory.service';
import type { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

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
    },
    order: { create: vi.fn().mockResolvedValue(orderRecord()) },
    payment: { create: vi.fn().mockResolvedValue({ id: 'payment-1' }) },
    shipment: { create: vi.fn().mockResolvedValue({ id: 'shipment-1' }) },
  };

  const prisma = {
    order: { findUnique: vi.fn() },
    $transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback(transaction)),
  };
  const pricing = {
    calculatePrice: vi.fn().mockReturnValue({ unitPrice: 30000, listPrice: 30000 }),
    evaluateCoupon: vi.fn(),
  };
  const cartValidation = {
    validateCart: vi.fn().mockResolvedValue(
      options.valid === false
        ? {
            ...VALID_CART,
            valid: false,
            issues: [options.issue],
          }
        : VALID_CART,
    ),
  };
  const inventory = { decrementStockAtomically: vi.fn().mockResolvedValue({}) };

  const service = new OrdersService(
    prisma as unknown as PrismaService,
    pricing as unknown as CartPricingService,
    cartValidation as unknown as CartValidationService,
    inventory as unknown as InventoryService,
  );

  return { service, prisma, transaction, pricing, cartValidation, inventory };
}

describe('OrdersService (STK-01)', () => {
  it('exige les coordonnées guest quand aucun utilisateur n’est authentifié', async () => {
    const { service, prisma } = setup();

    await expect(service.createOrder(DTO, null)).rejects.toMatchObject({
      response: { code: 'GUEST_INFORMATION_REQUIRED' },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('refuse un moyen de paiement autre que COD dans le MVP', async () => {
    const { service } = setup();

    await expect(
      service.createOrder({ ...DTO, paymentMethod: 'MOBILE_MONEY' }, ACTOR),
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

    const response = await service.createOrder({ ...DTO, idempotencyKey: 'key-1' }, ACTOR);

    expect(response.reference).toBe('BRN-2611-ABCD');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('interdit de réutiliser la clé d’idempotence d’un autre client', async () => {
    const { service, prisma } = setup();
    prisma.order.findUnique.mockResolvedValue(orderRecord({ userId: 'other-user' }));

    await expect(
      service.createOrder({ ...DTO, idempotencyKey: 'key-1' }, ACTOR),
    ).rejects.toMatchObject({ response: { code: 'IDEMPOTENCY_CONFLICT' } });
  });

  it('crée commande, paiement, expédition et mouvement dans la même transaction', async () => {
    const { service, transaction, inventory } = setup();

    const response = await service.createOrder(DTO, ACTOR);

    expect(transaction.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: ACTOR.id,
          subtotal: 30000,
          shippingFee: 1500,
          total: 31500,
          paymentMethod: 'COD',
        }),
      }),
    );
    expect(transaction.payment.create).toHaveBeenCalled();
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
    expect(response).toMatchObject({ reference: 'BRN-2611-ABCD', total: 31500 });
  });

  it('annule la commande si le décrément de stock échoue', async () => {
    const { service, inventory } = setup();
    inventory.decrementStockAtomically.mockRejectedValue(
      new ConflictException({ code: 'INSUFFICIENT_STOCK', message: 'Stock insuffisant' }),
    );

    await expect(service.createOrder(DTO, ACTOR)).rejects.toMatchObject({
      response: { code: 'INSUFFICIENT_STOCK' },
    });
  });

  it('rejette une ville sans zone de livraison', async () => {
    const { service, transaction } = setup();
    transaction.deliveryZone.findMany.mockResolvedValue([
      { id: 'zone-1', fee: 1500, cities: ['Yaoundé'] },
    ]);

    await expect(
      service.createOrder({ ...DTO, address: { ...DTO.address, city: 'Kribi' } }, ACTOR),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('recalcule le prix depuis le catalogue sans aucun montant client', async () => {
    const { service, transaction, pricing } = setup();

    await service.createOrder(DTO, ACTOR);

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
              }),
            ],
          },
        }),
      }),
    );
  });
});
