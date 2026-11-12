import type { PinoLogger } from 'nestjs-pino';
import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../infrastructure/database/database.module';
import { CartPricingService } from './cart-pricing.service';
import { CartStockService } from './cart-stock.service';
import { CartValidationService } from './cart-validation.service';
import { CartIssueCode } from './dto/cart-validation-response.dto';

interface VariantOptions {
  id?: string;
  stock?: number;
  reservedStock?: number;
  price?: number | null;
  basePrice?: number;
  promoPrice?: number | null;
  promoStart?: Date | null;
  promoEnd?: Date | null;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  deletedAt?: Date | null;
}

function makeVariant(options: VariantOptions = {}) {
  const id = options.id ?? 'variant-1';
  return {
    id,
    sku: `SKU-${id}`,
    color: 'Noir',
    size: '42',
    price: options.price ?? null,
    stock: options.stock ?? 10,
    reservedStock: options.reservedStock ?? 0,
    product: {
      id: `product-${id}`,
      name: `Produit ${id}`,
      basePrice: options.basePrice ?? 30000,
      promoPrice: options.promoPrice ?? null,
      promoStart: options.promoStart ?? null,
      promoEnd: options.promoEnd ?? null,
      status: options.status ?? 'PUBLISHED',
      deletedAt: options.deletedAt ?? null,
    },
  };
}

function makeService() {
  const findMany = vi.fn();
  const findFirst = vi.fn();
  const prisma = {
    productVariant: { findMany },
    coupon: { findFirst },
  } as unknown as PrismaService;
  const service = new CartValidationService(
    prisma,
    new CartPricingService(),
    new CartStockService(),
    { debug: vi.fn() } as unknown as PinoLogger,
  );
  return { service, findMany, findFirst };
}

describe('CartValidationService.validateCart', () => {
  it('valide un panier conforme et recalcule tous les prix côté serveur', async () => {
    const { service, findMany, findFirst } = makeService();
    findMany.mockResolvedValue([
      makeVariant({ id: 'variant-1', basePrice: 30000 }),
      makeVariant({
        id: 'variant-2',
        basePrice: 40000,
        promoPrice: 32000,
        promoStart: new Date('2026-11-01T00:00:00.000Z'),
        promoEnd: new Date('2026-12-01T00:00:00.000Z'),
      }),
    ]);
    findFirst.mockResolvedValue(null);

    const result = await service.validateCart({
      items: [
        { variantId: 'variant-1', quantity: 2 },
        { variantId: 'variant-2', quantity: 1 },
      ],
    });

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.subtotal).toBe(92000);
    expect(result.discount).toBe(0);
    expect(result.total).toBe(92000);
    expect(result.items.map((item) => item.unitPrice)).toEqual([30000, 32000]);
    expect(result.items.map((item) => item.lineTotal)).toEqual([60000, 32000]);
    expect(result.meta).toMatchObject({ itemCount: 2, totalQuantity: 3 });
    expect(result.meta.validatedAt).toEqual(expect.any(String));
  });

  it('ignore un prix client fantaisiste et signale PRICE_CHANGED', async () => {
    const { service, findMany, findFirst } = makeService();
    findMany.mockResolvedValue([makeVariant({ basePrice: 30000 })]);
    findFirst.mockResolvedValue(null);

    const result = await service.validateCart({
      items: [{ variantId: 'variant-1', quantity: 1, previousUnitPrice: 1 }],
    });

    expect(result.valid).toBe(true);
    expect(result.items[0]?.unitPrice).toBe(30000);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      code: CartIssueCode.PRICE_CHANGED,
      previousPrice: 1,
      currentPrice: 30000,
    });
  });

  it('signale PROMO_APPLIED quand la promotion est désormais active', async () => {
    const { service, findMany, findFirst } = makeService();
    findMany.mockResolvedValue([
      makeVariant({
        basePrice: 40000,
        promoPrice: 32000,
        promoStart: new Date('2026-11-01T00:00:00.000Z'),
        promoEnd: new Date('2026-12-01T00:00:00.000Z'),
      }),
    ]);
    findFirst.mockResolvedValue(null);

    const result = await service.validateCart({
      items: [{ variantId: 'variant-1', quantity: 1, previousUnitPrice: 40000 }],
    });

    expect(result.items[0]?.unitPrice).toBe(32000);
    expect(result.issues[0]?.code).toBe(CartIssueCode.PROMO_APPLIED);
    expect(result.valid).toBe(true);
  });

  it('signale PROMO_EXPIRED quand le prix revient au prix de base', async () => {
    const { service, findMany, findFirst } = makeService();
    findMany.mockResolvedValue([
      makeVariant({
        basePrice: 35000,
        promoPrice: 25000,
        promoStart: new Date('2026-09-01T00:00:00.000Z'),
        promoEnd: new Date('2026-10-01T00:00:00.000Z'),
      }),
    ]);
    findFirst.mockResolvedValue(null);

    const result = await service.validateCart({
      items: [{ variantId: 'variant-1', quantity: 1, previousUnitPrice: 25000 }],
    });

    expect(result.items[0]?.unitPrice).toBe(35000);
    expect(result.issues[0]?.code).toBe(CartIssueCode.PROMO_EXPIRED);
    expect(result.valid).toBe(true);
  });

  it('fusionne les doublons de variante et charge les variantes en une requête', async () => {
    const { service, findMany, findFirst } = makeService();
    findMany.mockResolvedValue([makeVariant({ stock: 10 })]);
    findFirst.mockResolvedValue(null);

    const result = await service.validateCart({
      items: [
        { variantId: 'variant-1', quantity: 2 },
        { variantId: 'variant-1', quantity: 3 },
      ],
    });

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany.mock.calls[0]?.[0]).toMatchObject({
      where: { id: { in: ['variant-1'] } },
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.quantity).toBe(5);
    expect(result.meta.totalQuantity).toBe(5);
  });

  it('bloque le panier et ajuste la quantité quand le stock est insuffisant', async () => {
    const { service, findMany, findFirst } = makeService();
    findMany.mockResolvedValue([makeVariant({ stock: 3, reservedStock: 0, basePrice: 30000 })]);
    findFirst.mockResolvedValue(null);

    const result = await service.validateCart({
      items: [{ variantId: 'variant-1', quantity: 5 }],
    });

    expect(result.valid).toBe(false);
    expect(result.items[0]?.quantity).toBe(3);
    expect(result.items[0]?.availableStock).toBe(3);
    expect(result.items[0]?.lineTotal).toBe(90000);
    expect(result.subtotal).toBe(90000);
    expect(result.items[0]?.issues[0]).toMatchObject({
      code: CartIssueCode.INSUFFICIENT_STOCK,
      requestedQuantity: 5,
      availableQuantity: 3,
    });
    expect(result.issues[0]?.message).toContain('Produit variant-1');
  });

  it('exclut du sous-total une ligne en rupture de stock', async () => {
    const { service, findMany, findFirst } = makeService();
    findMany.mockResolvedValue([makeVariant({ stock: 0, basePrice: 30000 })]);
    findFirst.mockResolvedValue(null);

    const result = await service.validateCart({
      items: [{ variantId: 'variant-1', quantity: 2 }],
    });

    expect(result.valid).toBe(false);
    expect(result.items[0]?.quantity).toBe(0);
    expect(result.items[0]?.lineTotal).toBe(0);
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
    expect(result.items[0]?.issues[0]?.code).toBe(CartIssueCode.OUT_OF_STOCK);
  });

  it('exclut du sous-total un produit archivé', async () => {
    const { service, findMany, findFirst } = makeService();
    findMany.mockResolvedValue([makeVariant({ status: 'ARCHIVED', basePrice: 30000 })]);
    findFirst.mockResolvedValue(null);

    const result = await service.validateCart({
      items: [{ variantId: 'variant-1', quantity: 1 }],
    });

    expect(result.valid).toBe(false);
    expect(result.items[0]?.quantity).toBe(0);
    expect(result.subtotal).toBe(0);
    expect(result.issues[0]?.code).toBe(CartIssueCode.PRODUCT_ARCHIVED);
  });

  it('exclut du sous-total un produit supprimé logiquement', async () => {
    const { service, findMany, findFirst } = makeService();
    findMany.mockResolvedValue([makeVariant({ deletedAt: new Date(), basePrice: 30000 })]);
    findFirst.mockResolvedValue(null);

    const result = await service.validateCart({
      items: [{ variantId: 'variant-1', quantity: 1 }],
    });

    expect(result.valid).toBe(false);
    expect(result.subtotal).toBe(0);
    expect(result.issues[0]?.code).toBe(CartIssueCode.PRODUCT_NOT_FOUND);
  });

  it('signale une variante inconnue sans produire de ligne', async () => {
    const { service, findMany, findFirst } = makeService();
    findMany.mockResolvedValue([]);
    findFirst.mockResolvedValue(null);

    const result = await service.validateCart({
      items: [{ variantId: '8c2c5c1e-0000-4000-8000-000000000000', quantity: 1 }],
    });

    expect(result.valid).toBe(false);
    expect(result.items).toEqual([]);
    expect(result.issues[0]?.code).toBe(CartIssueCode.VARIANT_NOT_FOUND);
  });

  it('signale QUANTITY_EXCEEDED au-delà de 100 unités fusionnées', async () => {
    const { service, findMany, findFirst } = makeService();
    findMany.mockResolvedValue([makeVariant({ stock: 500 })]);
    findFirst.mockResolvedValue(null);

    const result = await service.validateCart({
      items: [
        { variantId: 'variant-1', quantity: 60 },
        { variantId: 'variant-1', quantity: 60 },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.items[0]?.quantity).toBe(100);
    expect(result.issues[0]).toMatchObject({
      code: CartIssueCode.QUANTITY_EXCEEDED,
      requestedQuantity: 120,
      maxQuantity: 100,
    });
  });

  it('applique un coupon en pourcentage valide', async () => {
    const { service, findMany, findFirst } = makeService();
    findMany.mockResolvedValue([makeVariant({ basePrice: 30000 })]);
    findFirst.mockResolvedValue({
      code: 'WELCOME10',
      type: 'PERCENTAGE',
      value: 10,
      minAmount: 20000,
      startsAt: null,
      endsAt: null,
      maxUses: null,
      usedCount: 0,
    });

    const result = await service.validateCart({
      items: [{ variantId: 'variant-1', quantity: 2 }],
      couponCode: 'welcome10',
    });

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { code: { equals: 'welcome10', mode: 'insensitive' } },
      }),
    );
    expect(result.discount).toBe(6000);
    expect(result.total).toBe(54000);
    expect(result.valid).toBe(true);
  });

  it('bloque le panier avec un coupon invalide', async () => {
    const { service, findMany, findFirst } = makeService();
    findMany.mockResolvedValue([makeVariant({ basePrice: 30000 })]);
    findFirst.mockResolvedValue(null);

    const result = await service.validateCart({
      items: [{ variantId: 'variant-1', quantity: 1 }],
      couponCode: 'INCONNU',
    });

    expect(result.valid).toBe(false);
    expect(result.discount).toBe(0);
    expect(result.issues[0]?.code).toBe(CartIssueCode.COUPON_INVALID);
  });

  it('laisse le panier valide quand le montant minimum du coupon n’est pas atteint', async () => {
    const { service, findMany, findFirst } = makeService();
    findMany.mockResolvedValue([makeVariant({ basePrice: 30000 })]);
    findFirst.mockResolvedValue({
      code: 'WELCOME10',
      type: 'PERCENTAGE',
      value: 10,
      minAmount: 100000,
      startsAt: null,
      endsAt: null,
      maxUses: null,
      usedCount: 0,
    });

    const result = await service.validateCart({
      items: [{ variantId: 'variant-1', quantity: 1 }],
      couponCode: 'WELCOME10',
    });

    expect(result.valid).toBe(true);
    expect(result.discount).toBe(0);
    expect(result.issues[0]?.code).toBe(CartIssueCode.COUPON_MIN_AMOUNT_NOT_REACHED);
  });

  it('traite tout le stock réservé comme une rupture', async () => {
    const { service, findMany, findFirst } = makeService();
    findMany.mockResolvedValue([makeVariant({ stock: 5, reservedStock: 5 })]);
    findFirst.mockResolvedValue(null);

    const result = await service.validateCart({
      items: [{ variantId: 'variant-1', quantity: 1 }],
    });

    expect(result.valid).toBe(false);
    expect(result.items[0]?.availableStock).toBe(0);
    expect(result.issues[0]?.code).toBe(CartIssueCode.OUT_OF_STOCK);
  });
});
