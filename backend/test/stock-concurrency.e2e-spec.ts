import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { CartValidationService } from '../src/modules/cart/cart-validation.service';
import { PrismaService } from '../src/infrastructure/database/database.module';

if (existsSync('../.env')) process.loadEnvFile('../.env');
process.env['TURNSTILE_ENABLED'] = 'false';
if (process.env['REDIS_URL']) {
  const redisUrl = new URL(process.env['REDIS_URL']);
  redisUrl.pathname = '/1';
  process.env['REDIS_URL'] = redisUrl.toString();
}

const PREFIX = 'e2e-stk01-concurrency';
const BASE_URL = '/api/v1';
const GUEST_PHONE = '+237699200001';
const suffix = `${Date.now()}`;

interface Fixture {
  productId: string;
  variantId: string;
}

describe('STK-01 concurrence stock', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let categoryId: string;
  let brandId: string;
  let city: string;

  let ipCounter = 0;
  function nextIp(): string {
    ipCounter += 1;
    return `10.${(ipCounter >> 16) & 255}.${(ipCounter >> 8) & 255}.${(ipCounter & 255) + 1}`;
  }

  function createOrder(body: unknown) {
    return request(app.getHttpServer())
      .post(`${BASE_URL}/orders`)
      .set('X-Forwarded-For', nextIp())
      .send(body as object);
  }

  function address() {
    return {
      recipientName: 'Concurrence E2E',
      phone: GUEST_PHONE,
      city,
      district: 'Bonapriso',
      line: 'Rue 12',
    };
  }

  function body(items: Array<{ variantId: string; quantity: number }>, extra: object = {}) {
    return {
      items,
      guestName: 'Concurrence E2E',
      guestPhone: GUEST_PHONE,
      address: address(),
      paymentMethod: 'COD',
      ...extra,
    };
  }

  async function createFixture(label: string, stock: number, id?: string): Promise<Fixture> {
    const slug = `${PREFIX}-${suffix}-${label}`;
    const product = await prisma.product.create({
      data: {
        name: `STK01 concurrency ${label}`,
        slug,
        description: 'Produit e2e concurrence STK-01',
        categoryId,
        brandId,
        basePrice: 30000,
        status: 'PUBLISHED',
        variants: {
          create: [
            {
              ...(id !== undefined ? { id } : {}),
              sku: `${PREFIX}-${suffix}-${label}`,
              color: 'Noir',
              size: '42',
              stock,
            },
          ],
        },
      },
      include: { variants: true },
    });
    return { productId: product.id, variantId: product.variants[0].id };
  }

  async function cleanup(): Promise<void> {
    const productWhere = { slug: { startsWith: `${PREFIX}-${suffix}` } };
    await prisma.stockMovement
      .deleteMany({ where: { variant: { product: productWhere } } })
      .catch(() => undefined);
    await prisma.order
      .deleteMany({ where: { guestPhone: { startsWith: '+237699200' } } })
      .catch(() => undefined);
    await prisma.product.deleteMany({ where: productWhere }).catch(() => undefined);
    await prisma.deliveryZone
      .deleteMany({ where: { name: { startsWith: PREFIX } } })
      .catch(() => undefined);
    await prisma.category
      .deleteMany({ where: { slug: { startsWith: PREFIX } } })
      .catch(() => undefined);
    await prisma.brand
      .deleteMany({ where: { slug: { startsWith: PREFIX } } })
      .catch(() => undefined);
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
    prisma = app.get(PrismaService);
    await cleanup();

    const category = await prisma.category.create({
      data: { name: `${PREFIX} ${suffix}`, slug: `${PREFIX}-${suffix}` },
    });
    categoryId = category.id;
    const brand = await prisma.brand.create({
      data: { name: `${PREFIX} ${suffix}`, slug: `${PREFIX}-${suffix}` },
    });
    brandId = brand.id;
    city = `${PREFIX}-${suffix}-ville`;
    await prisma.deliveryZone.create({
      data: {
        name: `${PREFIX}-${suffix}`,
        cities: [city],
        fee: 1500,
        estimatedDays: 2,
      },
    });
  });

  afterAll(async () => {
    if (prisma !== undefined) await cleanup();
    if (app !== undefined) await app.close();
  });

  it('deux commandes simultanées pour la dernière paire : 1 succès, 1 conflit, stock 0', async () => {
    const fixture = await createFixture('last-pair', 1);

    const responses = await Promise.all([
      createOrder(body([{ variantId: fixture.variantId, quantity: 1 }])),
      createOrder(body([{ variantId: fixture.variantId, quantity: 1 }])),
    ]);
    const statuses = responses.map((response) => response.status).sort();

    expect(statuses).toEqual([201, 409]);
    const conflict = responses.find((response) => response.status === 409);
    expect(conflict?.body.code).toBe('INSUFFICIENT_STOCK');
    expect(conflict?.body.errors[0]).toMatchObject({
      variantId: fixture.variantId,
      requestedQuantity: 1,
      availableQuantity: 0,
    });

    const variant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: fixture.variantId },
    });
    expect(variant.stock).toBe(0);
    expect(await prisma.orderItem.count({ where: { variantId: fixture.variantId } })).toBe(1);
    expect(await prisma.stockMovement.count({ where: { variantId: fixture.variantId } })).toBe(1);
  });

  it('dix requêtes simultanées sur une seule paire : une seule commande', async () => {
    const fixture = await createFixture('ten-buyers', 1);

    const responses = await Promise.all(
      Array.from({ length: 10 }, () =>
        createOrder(body([{ variantId: fixture.variantId, quantity: 1 }])),
      ),
    );
    expect(responses.filter((response) => response.status === 201)).toHaveLength(1);
    expect(responses.filter((response) => response.status === 409)).toHaveLength(9);

    const variant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: fixture.variantId },
    });
    expect(variant.stock).toBe(0);
    expect(variant.stock).toBeGreaterThanOrEqual(0);
    expect(await prisma.orderItem.count({ where: { variantId: fixture.variantId } })).toBe(1);
    expect(await prisma.stockMovement.count({ where: { variantId: fixture.variantId } })).toBe(1);
  });

  it('deux commandes simultanées de 1 unité sur un stock de 2 réussissent toutes les deux', async () => {
    const fixture = await createFixture('two-units', 2);

    const responses = await Promise.all([
      createOrder(body([{ variantId: fixture.variantId, quantity: 1 }])),
      createOrder(body([{ variantId: fixture.variantId, quantity: 1 }])),
    ]);

    expect(responses.map((response) => response.status)).toEqual([201, 201]);
    const variant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: fixture.variantId },
    });
    expect(variant.stock).toBe(0);
    expect(await prisma.stockMovement.count({ where: { variantId: fixture.variantId } })).toBe(2);
  });

  it('une commande de 2 unités sur stock 2 réussit et laisse zéro', async () => {
    const fixture = await createFixture('two-at-once', 2);

    const response = await createOrder(body([{ variantId: fixture.variantId, quantity: 2 }]));

    expect(response.status).toBe(201);
    const variant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: fixture.variantId },
    });
    expect(variant.stock).toBe(0);
  });

  it('deux requêtes avec la même clé d’idempotence renvoient la même commande', async () => {
    const fixture = await createFixture('same-key', 2);
    const idempotencyKey = randomUUID();
    const payload = body([{ variantId: fixture.variantId, quantity: 1 }], { idempotencyKey });

    const responses = await Promise.all([createOrder(payload), createOrder(payload)]);

    expect(responses.map((response) => response.status)).toEqual([201, 201]);
    expect(responses[0].body.id).toBe(responses[1].body.id);
    const variant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: fixture.variantId },
    });
    expect(variant.stock).toBe(1);
    expect(await prisma.orderItem.count({ where: { variantId: fixture.variantId } })).toBe(1);
    expect(await prisma.stockMovement.count({ where: { variantId: fixture.variantId } })).toBe(1);
  });

  it('annule le premier décrément si un second article est en rupture', async () => {
    // IDs choisis pour que le tri anti-deadlock traite `a-...` avant `z-...`.
    const first = await createFixture('rollback-first', 1, `a-${suffix}-first`);
    const second = await createFixture('rollback-second', 0, `z-${suffix}-second`);
    const validation = app.get(CartValidationService);
    // Simule un stock devenu indisponible après le pré-check du panier.
    vi.spyOn(validation, 'validateCart').mockResolvedValueOnce({ valid: true } as never);

    const response = await createOrder(
      body([
        { variantId: first.variantId, quantity: 1 },
        { variantId: second.variantId, quantity: 1 },
      ]),
    );

    expect(response.status).toBe(409);
    expect(await prisma.orderItem.count({ where: { variantId: first.variantId } })).toBe(0);
    expect(await prisma.stockMovement.count({ where: { variantId: first.variantId } })).toBe(0);
    const firstVariant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: first.variantId },
    });
    expect(firstVariant.stock).toBe(1);
  });

  it('ne laisse aucun stock négatif après les scénarios concurrents', async () => {
    const negative = await prisma.productVariant.count({
      where: {
        stock: { lt: 0 },
        product: { slug: { startsWith: `${PREFIX}-${suffix}` } },
      },
    });
    expect(negative).toBe(0);
  });
});
