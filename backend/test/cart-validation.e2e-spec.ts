import { existsSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';

import type { PrismaService } from '../src/infrastructure/database/database.module';

if (existsSync('../.env')) process.loadEnvFile('../.env');

const BASE_URL = '/api/v1';
const suffix = `${Date.now()}`;

interface Fixture {
  productId: string;
  variantId: string;
  name: string;
}

interface ValidationBody {
  valid: boolean;
  items: Array<{
    variantId: string;
    productId: string;
    productName: string;
    variantSku: string;
    size: string;
    color: string;
    quantity: number;
    availableStock: number;
    unitPrice: number;
    lineTotal: number;
    issues: Array<{ code: string; requestedQuantity?: number; availableQuantity?: number }>;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  issues: Array<{
    code: string;
    message: string;
    variantId?: string;
    requestedQuantity?: number;
    availableQuantity?: number;
    maxQuantity?: number;
    minAmount?: number;
  }>;
  meta: { validatedAt: string; itemCount: number; totalQuantity: number };
}

interface FixtureOptions {
  label: string;
  basePrice: number;
  stock?: number;
  reservedStock?: number;
  variantPrice?: number | null;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  deletedAt?: Date | null;
  promoPrice?: number | null;
  promoStart?: Date | null;
  promoEnd?: Date | null;
}

describe('POST /api/v1/cart/validate (CRT-01)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let categoryId: string;
  let brandId: string;

  const productIds: string[] = [];
  const couponIds: string[] = [];

  let standard: Fixture;
  let promo: Fixture;
  let expiredPromo: Fixture;
  let shortStock: Fixture;
  let outOfStock: Fixture;
  let archived: Fixture;
  let deleted: Fixture;
  let override: Fixture;

  let percentageCoupon: string;
  let fixedCoupon: string;
  let minAmountCoupon: string;
  let expiredCoupon: string;
  let maxedCoupon: string;

  // Each request gets its own forwarded IP so the 30/min throttle bucket of
  // one test never leaks into another (rate-limit test uses a fixed IP).
  let ipCounter = 0;
  function nextIp(): string {
    ipCounter += 1;
    const a = (ipCounter >> 16) & 255;
    const b = (ipCounter >> 8) & 255;
    const c = ipCounter & 255;
    return `10.${a}.${b}.${c + 1}`;
  }

  function validate(body: unknown, ip: string = nextIp()) {
    return request(app.getHttpServer())
      .post(`${BASE_URL}/cart/validate`)
      .set('X-Forwarded-For', ip)
      .send(body as object);
  }

  async function createFixture(options: FixtureOptions): Promise<Fixture> {
    const slug = `crt01-${suffix}-${options.label}`;
    const product = await prisma.product.create({
      data: {
        name: `CRT01 ${options.label}`,
        slug,
        description: 'Produit de test CRT-01',
        categoryId,
        brandId,
        basePrice: options.basePrice,
        promoPrice: options.promoPrice ?? null,
        promoStart: options.promoStart ?? null,
        promoEnd: options.promoEnd ?? null,
        status: options.status ?? 'PUBLISHED',
        deletedAt: options.deletedAt ?? null,
        variants: {
          create: [
            {
              sku: `CRT01-${suffix}-${options.label}`,
              color: 'Noir',
              size: '42',
              price: options.variantPrice ?? null,
              stock: options.stock ?? 10,
              reservedStock: options.reservedStock ?? 0,
            },
          ],
        },
      },
      include: { variants: true },
    });
    productIds.push(product.id);
    return {
      productId: product.id,
      variantId: product.variants[0].id,
      name: product.name,
    };
  }

  async function createCoupon(data: {
    code: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    minAmount?: number | null;
    startsAt?: Date | null;
    endsAt?: Date | null;
    maxUses?: number | null;
    usedCount?: number;
  }): Promise<string> {
    const coupon = await prisma.coupon.create({
      data: {
        code: data.code,
        type: data.type,
        value: data.value,
        minAmount: data.minAmount ?? null,
        startsAt: data.startsAt ?? null,
        endsAt: data.endsAt ?? null,
        maxUses: data.maxUses ?? null,
        usedCount: data.usedCount ?? 0,
      },
    });
    couponIds.push(coupon.id);
    return coupon.code;
  }

  beforeAll(async () => {
    if (!process.env['DATABASE_URL'] || !process.env['REDIS_URL']) {
      throw new Error('Set DATABASE_URL and REDIS_URL before running pnpm test:e2e.');
    }
    const { AppModule } = await import('../src/app.module');
    const { AllExceptionsFilter } = await import('../src/common/filters/all-exceptions.filter');
    const { validationExceptionFactory } = await import(
      '../src/common/pipes/validation-exception.factory'
    );

    const instance = await NestFactory.create(AppModule, { logger: false });
    // Trust exactly one proxy so X-Forwarded-For drives the throttle bucket.
    instance.getHttpAdapter().getInstance().set('trust proxy', 1);
    instance.setGlobalPrefix('api');
    instance.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    instance.use(cookieParser());
    instance.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        exceptionFactory: validationExceptionFactory,
      }),
    );
    instance.useGlobalFilters(new AllExceptionsFilter(instance.get(ConfigService)));
    await instance.init();
    app = instance;
    prisma = app.get<PrismaService>(
      (await import('../src/infrastructure/database/database.module')).PrismaService,
    );

    const category = await prisma.category.create({
      data: { name: `CRT01 ${suffix}`, slug: `crt01-cat-${suffix}` },
    });
    categoryId = category.id;
    const brand = await prisma.brand.create({
      data: { name: `CRT01 ${suffix}`, slug: `crt01-brand-${suffix}` },
    });
    brandId = brand.id;

    const now = Date.now();
    standard = await createFixture({ label: 'standard', basePrice: 30000 });
    promo = await createFixture({
      label: 'promo',
      basePrice: 40000,
      promoPrice: 32000,
      promoStart: new Date(now - 60 * 60 * 1000),
      promoEnd: new Date(now + 60 * 60 * 1000),
      stock: 5,
    });
    expiredPromo = await createFixture({
      label: 'promo-expiree',
      basePrice: 35000,
      promoPrice: 25000,
      promoStart: new Date(now - 48 * 60 * 60 * 1000),
      promoEnd: new Date(now - 24 * 60 * 60 * 1000),
      stock: 5,
    });
    shortStock = await createFixture({
      label: 'stock-court',
      basePrice: 20000,
      stock: 2,
      reservedStock: 1,
    });
    outOfStock = await createFixture({ label: 'rupture', basePrice: 20000, stock: 0 });
    archived = await createFixture({
      label: 'archive',
      basePrice: 20000,
      status: 'ARCHIVED',
      stock: 5,
    });
    deleted = await createFixture({
      label: 'supprime',
      basePrice: 20000,
      deletedAt: new Date(),
      stock: 5,
    });
    override = await createFixture({
      label: 'override',
      basePrice: 50000,
      variantPrice: 45000,
      stock: 3,
    });

    percentageCoupon = await createCoupon({
      code: `CRT01PCT${suffix}`,
      type: 'PERCENTAGE',
      value: 10,
    });
    fixedCoupon = await createCoupon({
      code: `CRT01FIX${suffix}`,
      type: 'FIXED_AMOUNT',
      value: 5000,
    });
    minAmountCoupon = await createCoupon({
      code: `CRT01MIN${suffix}`,
      type: 'PERCENTAGE',
      value: 10,
      minAmount: 100000,
    });
    expiredCoupon = await createCoupon({
      code: `CRT01EXP${suffix}`,
      type: 'PERCENTAGE',
      value: 10,
      endsAt: new Date(now - 24 * 60 * 60 * 1000),
    });
    maxedCoupon = await createCoupon({
      code: `CRT01MAX${suffix}`,
      type: 'FIXED_AMOUNT',
      value: 1000,
      maxUses: 1,
      usedCount: 1,
    });
  });

  afterAll(async () => {
    if (prisma) {
      // Products cascade their variants and any cart line.
      await prisma.product.deleteMany({ where: { id: { in: productIds } } });
      await prisma.coupon.deleteMany({ where: { id: { in: couponIds } } });
      if (brandId) await prisma.brand.deleteMany({ where: { id: brandId } });
      if (categoryId) await prisma.category.deleteMany({ where: { id: categoryId } });
    }
    await app?.close();
  });

  it('valide un panier conforme et recalcule les prix côté serveur', async () => {
    const response = await validate({
      items: [
        { variantId: standard.variantId, quantity: 2 },
        { variantId: promo.variantId, quantity: 1 },
      ],
    }).expect(200);

    const body = response.body as ValidationBody;
    expect(body.valid).toBe(true);
    expect(body.issues).toEqual([]);
    expect(body.subtotal).toBe(92000);
    expect(body.discount).toBe(0);
    expect(body.total).toBe(92000);
    expect(body.items[0]).toMatchObject({ unitPrice: 30000, lineTotal: 60000, quantity: 2 });
    expect(body.items[1]).toMatchObject({ unitPrice: 32000, lineTotal: 32000 });
    expect(body.meta).toMatchObject({ itemCount: 2, totalQuantity: 3 });
    expect(Date.parse(body.meta.validatedAt)).not.toBeNaN();
  });

  it('applique la promotion active et signale PROMO_APPLIED', async () => {
    const response = await validate({
      items: [{ variantId: promo.variantId, quantity: 1, previousUnitPrice: 40000 }],
    }).expect(200);

    const body = response.body as ValidationBody;
    expect(body.valid).toBe(true);
    expect(body.items[0]?.unitPrice).toBe(32000);
    expect(body.issues[0]).toMatchObject({ code: 'PROMO_APPLIED' });
  });

  it('signale PROMO_EXPIRED et revient au prix de base', async () => {
    const response = await validate({
      items: [{ variantId: expiredPromo.variantId, quantity: 1, previousUnitPrice: 25000 }],
    }).expect(200);

    const body = response.body as ValidationBody;
    expect(body.valid).toBe(true);
    expect(body.items[0]?.unitPrice).toBe(35000);
    expect(body.issues[0]?.code).toBe('PROMO_EXPIRED');
  });

  it('ignore totalement un previousUnitPrice fantaisiste (prix serveur)', async () => {
    const response = await validate({
      items: [{ variantId: standard.variantId, quantity: 1, previousUnitPrice: 1 }],
    }).expect(200);

    const body = response.body as ValidationBody;
    expect(body.valid).toBe(true);
    expect(body.items[0]?.unitPrice).toBe(30000);
    expect(body.items[0]?.lineTotal).toBe(30000);
    expect(body.issues[0]?.code).toBe('PRICE_CHANGED');
  });

  it('applique le prix override de la variante', async () => {
    const response = await validate({
      items: [{ variantId: override.variantId, quantity: 1 }],
    }).expect(200);

    const body = response.body as ValidationBody;
    expect(body.items[0]?.unitPrice).toBe(45000);
  });

  it('bloque et ajuste au stock disponible (stock réservé déduit)', async () => {
    const response = await validate({
      items: [{ variantId: shortStock.variantId, quantity: 5 }],
    }).expect(200);

    const body = response.body as ValidationBody;
    expect(body.valid).toBe(false);
    expect(body.items[0]).toMatchObject({
      quantity: 1,
      availableStock: 1,
      unitPrice: 20000,
      lineTotal: 20000,
    });
    expect(body.subtotal).toBe(20000);
    expect(body.items[0]?.issues[0]).toMatchObject({
      code: 'INSUFFICIENT_STOCK',
      requestedQuantity: 5,
      availableQuantity: 1,
    });
    expect(body.issues[0]?.message).toContain(shortStock.name);
  });

  it('exclut du sous-total une rupture de stock', async () => {
    const response = await validate({
      items: [{ variantId: outOfStock.variantId, quantity: 2 }],
    }).expect(200);

    const body = response.body as ValidationBody;
    expect(body.valid).toBe(false);
    expect(body.items[0]).toMatchObject({ quantity: 0, lineTotal: 0, availableStock: 0 });
    expect(body.subtotal).toBe(0);
    expect(body.issues[0]?.code).toBe('OUT_OF_STOCK');
  });

  it('exclut du sous-total un produit archivé', async () => {
    const response = await validate({
      items: [{ variantId: archived.variantId, quantity: 1 }],
    }).expect(200);

    const body = response.body as ValidationBody;
    expect(body.valid).toBe(false);
    expect(body.items[0]?.quantity).toBe(0);
    expect(body.subtotal).toBe(0);
    expect(body.issues[0]?.code).toBe('PRODUCT_ARCHIVED');
  });

  it('exclut du sous-total un produit supprimé logiquement', async () => {
    const response = await validate({
      items: [{ variantId: deleted.variantId, quantity: 1 }],
    }).expect(200);

    const body = response.body as ValidationBody;
    expect(body.valid).toBe(false);
    expect(body.subtotal).toBe(0);
    expect(body.issues[0]?.code).toBe('PRODUCT_NOT_FOUND');
  });

  it('signale une variante inconnue sans ligne associée', async () => {
    const response = await validate({
      items: [{ variantId: '8c2c5c1e-0000-4000-8000-000000000000', quantity: 1 }],
    }).expect(200);

    const body = response.body as ValidationBody;
    expect(body.valid).toBe(false);
    expect(body.items).toEqual([]);
    expect(body.issues[0]?.code).toBe('VARIANT_NOT_FOUND');
  });

  it('fusionne les doublons de variante', async () => {
    const response = await validate({
      items: [
        { variantId: standard.variantId, quantity: 2 },
        { variantId: standard.variantId, quantity: 3 },
      ],
    }).expect(200);

    const body = response.body as ValidationBody;
    expect(body.items).toHaveLength(1);
    expect(body.items[0]?.quantity).toBe(5);
    expect(body.subtotal).toBe(150000);
  });

  it('applique un coupon en pourcentage', async () => {
    const response = await validate({
      items: [{ variantId: standard.variantId, quantity: 2 }],
      couponCode: percentageCoupon,
    }).expect(200);

    const body = response.body as ValidationBody;
    expect(body.subtotal).toBe(60000);
    expect(body.discount).toBe(6000);
    expect(body.total).toBe(54000);
    expect(body.valid).toBe(true);
  });

  it('applique un coupon à montant fixe', async () => {
    const response = await validate({
      items: [{ variantId: standard.variantId, quantity: 2 }],
      couponCode: fixedCoupon,
    }).expect(200);

    const body = response.body as ValidationBody;
    expect(body.discount).toBe(5000);
    expect(body.total).toBe(55000);
  });

  it('rejette un coupon inconnu', async () => {
    const response = await validate({
      items: [{ variantId: standard.variantId, quantity: 1 }],
      couponCode: `INCONNU${suffix}`,
    }).expect(200);

    const body = response.body as ValidationBody;
    expect(body.valid).toBe(false);
    expect(body.discount).toBe(0);
    expect(body.issues[0]?.code).toBe('COUPON_INVALID');
  });

  it('rejette un coupon expiré', async () => {
    const response = await validate({
      items: [{ variantId: standard.variantId, quantity: 1 }],
      couponCode: expiredCoupon,
    }).expect(200);

    const body = response.body as ValidationBody;
    expect(body.issues[0]?.code).toBe('COUPON_INVALID');
    expect(body.discount).toBe(0);
  });

  it('rejette un coupon épuisé', async () => {
    const response = await validate({
      items: [{ variantId: standard.variantId, quantity: 1 }],
      couponCode: maxedCoupon,
    }).expect(200);

    const body = response.body as ValidationBody;
    expect(body.issues[0]?.code).toBe('COUPON_INVALID');
  });

  it('signale un montant minimum non atteint sans invalider le panier', async () => {
    const response = await validate({
      items: [{ variantId: standard.variantId, quantity: 1 }],
      couponCode: minAmountCoupon,
    }).expect(200);

    const body = response.body as ValidationBody;
    expect(body.valid).toBe(true);
    expect(body.discount).toBe(0);
    expect(body.issues[0]).toMatchObject({
      code: 'COUPON_MIN_AMOUNT_NOT_REACHED',
      minAmount: 100000,
    });
  });

  it('rejette tout prix fourni par le client (unitPrice)', async () => {
    const response = await validate({
      items: [{ variantId: standard.variantId, quantity: 1, unitPrice: 1 }],
    }).expect(400);

    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(response.body.errors[0]?.field).toContain('unitPrice');
  });

  it('rejette un total fourni par le client', async () => {
    const response = await validate({
      items: [{ variantId: standard.variantId, quantity: 1 }],
      total: 1,
    }).expect(400);

    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejette un body vide ou une liste vide', async () => {
    await validate({}).expect(400);
    await validate({ items: [] }).expect(400);
  });

  it('rejette plus de 50 lignes', async () => {
    const items = Array.from({ length: 51 }, () => ({
      variantId: standard.variantId,
      quantity: 1,
    }));
    const response = await validate({ items }).expect(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejette les quantités hors bornes (0 et 101)', async () => {
    await validate({ items: [{ variantId: standard.variantId, quantity: 0 }] }).expect(400);
    await validate({ items: [{ variantId: standard.variantId, quantity: 101 }] }).expect(400);
  });

  it('limite à 30 requêtes par minute et par IP', async () => {
    const ip = '203.0.113.77';
    const body = { items: [{ variantId: standard.variantId, quantity: 1 }] };

    for (let attempt = 1; attempt <= 30; attempt += 1) {
      await validate(body, ip).expect(200);
    }
    await validate(body, ip).expect(429);
  });
});
