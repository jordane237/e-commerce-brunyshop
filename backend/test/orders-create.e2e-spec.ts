import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PrismaService } from '../src/infrastructure/database/database.module';

if (existsSync('../.env')) process.loadEnvFile('../.env');
// CAPTCHA et alertes stock ont leurs propres tickets : neutralisés ici pour
// isoler le contrat ORD-01.
process.env['TURNSTILE_ENABLED'] = 'false';
process.env['STOCK_LOW_ALERT_ENABLED'] = 'false';
// Plafond abaissé pour prouver le 429 sans créer 11 commandes.
process.env['ORDER_RATE_LIMIT_PER_HOUR'] = '3';
if (process.env['REDIS_URL']) {
  const redisUrl = new URL(process.env['REDIS_URL']);
  redisUrl.pathname = '/2';
  process.env['REDIS_URL'] = redisUrl.toString();
}

const PREFIX = 'e2e-ord01';
const BASE_URL = '/api/v1';
const suffix = `${Date.now()}`;
// Les compteurs anti-abus Redis vivent une heure : chaque exécution utilise sa
// propre plage de numéros pour rester rejouable.
const runTag = suffix.slice(-4);
const PHONE_PREFIX = `+23769${runTag}`;

interface Fixture {
  productId: string;
  variantId: string;
}

describe('POST /api/v1/orders (ORD-01)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let categoryId: string;
  let brandId: string;
  let zoneId: string;
  let city: string;
  let otherCity: string;
  let startedAt: Date;
  let ipCounter = 0;
  let phoneCounter = 0;

  function nextIp(): string {
    ipCounter += 1;
    return `10.${(ipCounter >> 16) & 255}.${(ipCounter >> 8) & 255}.${(ipCounter & 255) + 1}`;
  }

  function nextPhone(): string {
    phoneCounter += 1;
    return `${PHONE_PREFIX}${String(phoneCounter).padStart(3, '0')}`;
  }

  function post(body: unknown, key: string | null = randomUUID()) {
    const builder = request(app.getHttpServer())
      .post(`${BASE_URL}/orders`)
      .set('X-Forwarded-For', nextIp());
    if (key !== null) builder.set('Idempotency-Key', key);
    return builder.send(body as object);
  }

  function body(fixture: Fixture, overrides: Record<string, unknown> = {}, phone?: string) {
    return {
      items: [{ variantId: fixture.variantId, quantity: 1 }],
      guestName: 'Client ORD-01',
      guestPhone: phone ?? nextPhone(),
      address: {
        recipientName: 'Client ORD-01',
        phone: nextPhone(),
        city,
        district: 'Bonapriso',
        line: 'Rue 12',
        slot: 'afternoon',
        callBeforeDelivery: true,
      },
      paymentMethod: 'COD',
      ...overrides,
    };
  }

  async function createFixture(label: string, stock: number): Promise<Fixture> {
    const product = await prisma.product.create({
      data: {
        name: `ORD01 ${label}`,
        slug: `${PREFIX}-${suffix}-${label}`,
        description: 'Produit e2e ORD-01',
        categoryId,
        brandId,
        basePrice: 30000,
        status: 'PUBLISHED',
        variants: {
          create: [
            {
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

  function ordersFor(variantId: string) {
    return prisma.order.count({ where: { items: { some: { variantId } } } });
  }

  async function waitFor<T>(probe: () => Promise<T | null>, timeoutMs = 5_000): Promise<T | null> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const value = await probe();
      if (value !== null) return value;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return null;
  }

  async function cleanup(): Promise<void> {
    const productWhere = { slug: { startsWith: `${PREFIX}-${suffix}` } };
    await prisma.stockMovement.deleteMany({ where: { variant: { product: productWhere } } });
    await prisma.order.deleteMany({
      where: { guestPhone: { startsWith: PHONE_PREFIX } },
    });
    await prisma.product.deleteMany({ where: productWhere });
    await prisma.coupon.deleteMany({ where: { code: { startsWith: PREFIX } } });
    // Les notifications sont laissées en place : le worker BullMQ les met à
    // jour en asynchrone et les supprimer pendant l'envoi provoquerait P2025.
    await prisma.deliveryZone.deleteMany({ where: { name: { startsWith: PREFIX } } });
    await prisma.category.deleteMany({ where: { slug: { startsWith: PREFIX } } });
    await prisma.brand.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  }

  beforeAll(async () => {
    if (!process.env['DATABASE_URL'] || !process.env['REDIS_URL']) {
      throw new Error('Set DATABASE_URL and REDIS_URL before running pnpm test:e2e.');
    }
    startedAt = new Date();

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

    const category = await prisma.category.create({
      data: { name: `${PREFIX} ${suffix}`, slug: `${PREFIX}-${suffix}` },
    });
    categoryId = category.id;
    const brand = await prisma.brand.create({
      data: { name: `${PREFIX} ${suffix}`, slug: `${PREFIX}-${suffix}` },
    });
    brandId = brand.id;

    city = `${PREFIX}-${suffix}-ville`;
    otherCity = `${PREFIX}-${suffix}-autre`;
    const zone = await prisma.deliveryZone.create({
      data: {
        name: `${PREFIX}-${suffix}`,
        cities: [city],
        fee: 1500,
        estimatedDays: 2,
      },
    });
    zoneId = zone.id;
  });

  afterAll(async () => {
    if (prisma !== undefined) await cleanup();
    if (app !== undefined) await app.close();
  });

  it('refuse une requête sans Idempotency-Key', async () => {
    const fixture = await createFixture('no-key', 2);

    const response = await post(body(fixture), null);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('IDEMPOTENCY_KEY_REQUIRED');
  });

  it('refuse une Idempotency-Key qui n’est pas un UUID v4', async () => {
    const fixture = await createFixture('bad-key', 2);

    const response = await post(body(fixture), 'pas-un-uuid');

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('INVALID_IDEMPOTENCY_KEY');
  });

  it('crée une commande complète, auditée et notifiée', async () => {
    const fixture = await createFixture('nominal', 3);
    const key = randomUUID();
    const phone = nextPhone();

    const response = await post(body(fixture, {}, phone), key);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      reference: expect.stringMatching(/^BRN-\d{4}-[A-Z2-9]{4}$/),
      status: 'PENDING_CONFIRMATION',
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      subtotal: 30000,
      discount: 0,
      shippingFee: 1500,
      total: 31500,
    });

    const order = await prisma.order.findUniqueOrThrow({
      where: { id: response.body.id },
      include: { items: true, payments: true, shipment: true },
    });
    expect(order.idempotencyKey).toBe(key);
    expect(order.idempotencyRequestHash).toMatch(/^[a-f0-9]{64}$/);
    expect(order.addressSnapshot).toMatchObject({ slot: 'afternoon', callBeforeDelivery: true });
    expect(order.items[0]).toMatchObject({
      nameSnapshot: 'ORD01 nominal',
      sizeSnapshot: '42',
      colorSnapshot: 'Noir',
      quantity: 1,
      unitPrice: 30000,
    });
    expect(order.payments[0]).toMatchObject({ provider: 'cod', amount: 31500, status: 'PENDING' });
    expect(order.shipment).toMatchObject({ zoneId, status: 'PENDING', codCollected: false });

    const variant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: fixture.variantId },
    });
    expect(variant.stock).toBe(2);

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'ORDER_CREATED', entity: 'Order', entityId: order.id },
    });
    expect(audit).not.toBeNull();

    const notification = await waitFor(() =>
      prisma.notification.findFirst({
        where: { templateKey: 'order.created', recipient: phone },
        select: { id: true },
      }),
    );
    expect(notification).not.toBeNull();
  });

  it('enregistre le contexte UTM dans Order.source sans perdre les métadonnées techniques', async () => {
    const fixture = await createFixture('source', 2);
    const phone = nextPhone();

    const response = await post(
      body(
        fixture,
        {
          source: {
            source: 'facebook',
            medium: 'cpc',
            campaign: 'soldes-2026',
            fbclid: 'fb-123',
            capturedAt: '2026-11-18T10:00:00.000Z',
          },
        },
        phone,
      ),
      randomUUID(),
    );

    expect(response.status).toBe(201);
    const order = await prisma.order.findUniqueOrThrow({ where: { id: response.body.id } });
    expect(order.source).toMatchObject({
      source: 'facebook',
      medium: 'cpc',
      campaign: 'soldes-2026',
      fbclid: 'fb-123',
      capturedAt: '2026-11-18T10:00:00.000Z',
      ipAddress: expect.any(String),
    });
  });

  it('rejoue la même clé avec un autre contexte UTM sans conflit ni doublon', async () => {
    const fixture = await createFixture('source-replay', 2);
    const key = randomUUID();
    const phone = nextPhone();
    const first = body(fixture, { source: { source: 'facebook' } }, phone);
    const second = { ...first, source: { source: 'google' } };

    const firstResponse = await post(first, key);
    const secondResponse = await post(second, key);

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(201);
    expect(secondResponse.body.id).toBe(firstResponse.body.id);
    expect(await ordersFor(fixture.variantId)).toBe(1);

    const order = await prisma.order.findUniqueOrThrow({ where: { id: firstResponse.body.id } });
    expect(order.source).toMatchObject({ source: 'facebook' });
  });

  it('rejoue la même clé sans créer de doublon', async () => {
    const fixture = await createFixture('replay', 3);
    const key = randomUUID();
    const payload = body(fixture);

    const first = await post(payload, key);
    const second = await post(payload, key);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.id).toBe(first.body.id);
    expect(second.body.reference).toBe(first.body.reference);
    expect(await ordersFor(fixture.variantId)).toBe(1);
    expect(await prisma.stockMovement.count({ where: { variantId: fixture.variantId } })).toBe(1);
    const variant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: fixture.variantId },
    });
    expect(variant.stock).toBe(2);
  });

  it('refuse la même clé avec un corps différent', async () => {
    const fixture = await createFixture('conflict', 3);
    const key = randomUUID();

    await post(body(fixture), key);
    const response = await post(
      body(fixture, { items: [{ variantId: fixture.variantId, quantity: 2 }] }),
      key,
    );

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('IDEMPOTENCY_CONFLICT');
    expect(await ordersFor(fixture.variantId)).toBe(1);
  });

  it('rejette tout montant fourni par le client', async () => {
    const fixture = await createFixture('price', 2);

    const response = await post(
      body(fixture, {
        items: [{ variantId: fixture.variantId, quantity: 1, unitPrice: 1, total: 1 }],
      }),
    );

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(await ordersFor(fixture.variantId)).toBe(0);
  });

  it('rejette un honeypot rempli', async () => {
    const fixture = await createFixture('honeypot', 2);

    const response = await post(body(fixture, { _honey: 'bot' }));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('annule toute la transaction quand une ligne est en rupture', async () => {
    const available = await createFixture('rollback-ok', 2);
    const missing = await createFixture('rollback-ko', 0);

    const response = await post(
      body(available, {
        items: [
          { variantId: available.variantId, quantity: 1 },
          { variantId: missing.variantId, quantity: 1 },
        ],
      }),
    );

    expect(response.status).toBe(409);
    // Stock 0 → OUT_OF_STOCK, stock partiel → INSUFFICIENT_STOCK : les deux
    // codes sont des ruptures bloquantes.
    expect(['INSUFFICIENT_STOCK', 'OUT_OF_STOCK']).toContain(response.body.code);
    expect(await ordersFor(available.variantId)).toBe(0);
    expect(await ordersFor(missing.variantId)).toBe(0);
    const untouched = await prisma.productVariant.findUniqueOrThrow({
      where: { id: available.variantId },
    });
    expect(untouched.stock).toBe(2);
    expect(await prisma.stockMovement.count({ where: { variantId: available.variantId } })).toBe(0);
  });

  it('applique un coupon et incrémente son compteur d’usage', async () => {
    const fixture = await createFixture('coupon', 2);
    const coupon = await prisma.coupon.create({
      data: {
        code: `${PREFIX}-${suffix}-10`,
        type: 'PERCENTAGE',
        value: 10,
        minAmount: 1000,
      },
    });

    const response = await post(body(fixture, { couponCode: coupon.code }));

    expect(response.status).toBe(201);
    expect(response.body.discount).toBe(3000);
    expect(response.body.total).toBe(30000 - 3000 + 1500);
    const refreshed = await prisma.coupon.findUniqueOrThrow({ where: { id: coupon.id } });
    expect(refreshed.usedCount).toBe(1);
    expect(
      await prisma.orderCoupon.count({ where: { orderId: response.body.id, couponId: coupon.id } }),
    ).toBe(1);
  });

  it('refuse une ville incohérente avec la zone choisie', async () => {
    const fixture = await createFixture('zone-mismatch', 2);

    const response = await post(
      body(fixture, {
        deliveryZoneId: zoneId,
        address: {
          recipientName: 'Client ORD-01',
          phone: nextPhone(),
          city: otherCity,
          district: 'Bonapriso',
          line: 'Rue 12',
        },
      }),
    );

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('DELIVERY_ZONE_MISMATCH');
  });

  it('limite les commandes par numéro de téléphone', async () => {
    const fixture = await createFixture('rate-limit', 5);
    const phone = nextPhone();

    for (let index = 0; index < 3; index += 1) {
      const created = await post(body(fixture, {}, phone));
      expect(created.status).toBe(201);
    }

    const blocked = await post(body(fixture, {}, phone));

    expect(blocked.status).toBe(429);
    expect(blocked.body.code).toBe('ORDER_RATE_LIMIT_EXCEEDED');
    expect(await ordersFor(fixture.variantId)).toBe(3);
  });

  it('ne crée qu’une commande quand deux clients achètent la dernière paire', async () => {
    const fixture = await createFixture('concurrency', 1);

    const [first, second] = await Promise.all([post(body(fixture)), post(body(fixture))]);

    const statuses = [first.status, second.status].sort((a, b) => a - b);
    expect(statuses).toEqual([201, 409]);
    expect(
      [first.body.code, second.body.code].includes('INSUFFICIENT_STOCK') ||
        [first.body.code, second.body.code].includes('OUT_OF_STOCK'),
    ).toBe(true);

    const variant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: fixture.variantId },
    });
    expect(variant.stock).toBe(0);
    expect(await ordersFor(fixture.variantId)).toBe(1);
    expect(await prisma.stockMovement.count({ where: { variantId: fixture.variantId } })).toBe(1);
  });

  it('n’expose aucune donnée personnelle dans l’audit ORDER_CREATED', async () => {
    const audits = await prisma.auditLog.findMany({
      where: { action: 'ORDER_CREATED', createdAt: { gte: startedAt } },
      select: { after: true },
    });

    expect(audits.length).toBeGreaterThan(0);
    for (const audit of audits) {
      expect(JSON.stringify(audit.after)).not.toContain('+237');
      expect(JSON.stringify(audit.after)).not.toContain('@');
    }
  });
});
