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
process.env['TURNSTILE_ENABLED'] = 'false';
process.env['STOCK_LOW_ALERT_ENABLED'] = 'false';
if (process.env['REDIS_URL']) {
  const redisUrl = new URL(process.env['REDIS_URL']);
  redisUrl.pathname = '/3';
  process.env['REDIS_URL'] = redisUrl.toString();
}

const PREFIX = 'e2e-ord05';
const BASE_URL = '/api/v1';
const suffix = `${Date.now()}`;

describe('POST /api/v1/orders/track (ORD-05)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let categoryId: string;
  let brandId: string;
  let _zoneId: string;
  let city: string;
  let fixtureVariantId: string;
  let orderReference: string;
  let orderPhone: string;
  let ipCounter = 0;
  // Le throttler Redis survit entre deux exécutions : chaque run utilise donc
  // sa propre plage d'IP pour rester rejouable dans la minute.
  const runOctet = Number(String(Date.now()).slice(-3)) % 200;

  function nextIp(): string {
    ipCounter += 1;
    return `10.${runOctet}.${(ipCounter >> 8) & 255}.${(ipCounter & 255) + 1}`;
  }

  async function createFixture(): Promise<string> {
    const product = await prisma.product.create({
      data: {
        name: `ORD05 ${suffix}`,
        slug: `${PREFIX}-${suffix}`,
        description: 'Produit e2e ORD-05',
        categoryId,
        brandId,
        basePrice: 30000,
        status: 'PUBLISHED',
        variants: {
          create: [{ sku: `${PREFIX}-${suffix}`, color: 'Noir', size: '42', stock: 10 }],
        },
      },
      include: { variants: true },
    });
    return product.variants[0].id;
  }

  async function createOrder(variantId: string, phone: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post(`${BASE_URL}/orders`)
      .set('Idempotency-Key', randomUUID())
      .set('X-Forwarded-For', nextIp())
      .send({
        items: [{ variantId, quantity: 1 }],
        guestName: 'Client ORD-05',
        guestPhone: phone,
        address: {
          recipientName: 'Client ORD-05',
          phone,
          city,
          district: 'Bonapriso',
          line: 'Rue 12',
        },
        paymentMethod: 'COD',
      });
    expect(response.status).toBe(201);
    return response.body.reference as string;
  }

  async function cleanup(): Promise<void> {
    const productWhere = { slug: { startsWith: PREFIX } };
    await prisma.stockMovement
      .deleteMany({ where: { variant: { product: productWhere } } })
      .catch(() => undefined);
    await prisma.order
      .deleteMany({ where: { guestPhone: { startsWith: '+23769' } } })
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

    const category = await prisma.category.create({
      data: { name: `${PREFIX} ${suffix}`, slug: `${PREFIX}-${suffix}` },
    });
    categoryId = category.id;
    const brand = await prisma.brand.create({
      data: { name: `${PREFIX} ${suffix}`, slug: `${PREFIX}-${suffix}` },
    });
    brandId = brand.id;
    const zone = await prisma.deliveryZone.create({
      data: { name: `${PREFIX} ${suffix}`, cities: ['Douala'], fee: 1500, estimatedDays: 1 },
    });
    _zoneId = zone.id;
    city = 'Douala';

    const variantId = await createFixture();
    fixtureVariantId = variantId;
    orderPhone = `+23769${String(Date.now()).slice(-7)}`;
    orderReference = await createOrder(variantId, orderPhone);
  });

  afterAll(async () => {
    await cleanup();
    await app?.close();
  });

  it('succès : found:true, articles, total, timeline, shippingCity', async () => {
    const response = await request(app.getHttpServer())
      .post(`${BASE_URL}/orders/track`)
      .set('X-Forwarded-For', nextIp())
      .send({ reference: orderReference, phone: orderPhone });

    expect(response.status).toBe(200);
    expect(response.body.found).toBe(true);
    expect(response.body.order.reference).toBe(orderReference);
    expect(response.body.order.items).toHaveLength(1);
    expect(response.body.order.total).toBeGreaterThan(0);
    expect(response.body.order.timeline).toHaveLength(5);
    expect(typeof response.body.order.shippingCity).toBe('string');

    const json = JSON.stringify(response.body);
    for (const forbidden of [
      'email',
      'phone',
      'addressSnapshot',
      'guestName',
      'userId',
      'idempotencyKey',
      'source',
      'providerRef',
      'userAgent',
      'ipAddress',
    ]) {
      expect(json).not.toContain(forbidden);
    }
  });

  it('CA #2 : référence inexistante → found:false', async () => {
    const response = await request(app.getHttpServer())
      .post(`${BASE_URL}/orders/track`)
      .set('X-Forwarded-For', nextIp())
      .send({ reference: 'BRN-9999-XXXX', phone: orderPhone });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ found: false });
  });

  it('CA #2 : téléphone incorrect → found:false, body identique', async () => {
    const response = await request(app.getHttpServer())
      .post(`${BASE_URL}/orders/track`)
      .set('X-Forwarded-For', nextIp())
      .send({ reference: orderReference, phone: '+237699999999' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ found: false });
  });

  it('format référence invalide → 400', async () => {
    const response = await request(app.getHttpServer())
      .post(`${BASE_URL}/orders/track`)
      .set('X-Forwarded-For', nextIp())
      .send({ reference: 'ABC', phone: orderPhone });

    expect(response.status).toBe(400);
  });

  it('format téléphone invalide → 400', async () => {
    const response = await request(app.getHttpServer())
      .post(`${BASE_URL}/orders/track`)
      .set('X-Forwarded-For', nextIp())
      .send({ reference: orderReference, phone: '0612345678' });

    expect(response.status).toBe(400);
  });

  it('champs manquants → 400', async () => {
    const response = await request(app.getHttpServer())
      .post(`${BASE_URL}/orders/track`)
      .set('X-Forwarded-For', nextIp())
      .send({});

    expect(response.status).toBe(400);
  });

  it('CA #3 : 6e requête même IP → 429', async () => {
    const ip = nextIp();
    for (let i = 0; i < 5; i += 1) {
      const r = await request(app.getHttpServer())
        .post(`${BASE_URL}/orders/track`)
        .set('X-Forwarded-For', ip)
        .send({ reference: orderReference, phone: orderPhone });
      expect(r.status).toBe(200);
    }
    const blocked = await request(app.getHttpServer())
      .post(`${BASE_URL}/orders/track`)
      .set('X-Forwarded-For', ip)
      .send({ reference: orderReference, phone: orderPhone });
    expect(blocked.status).toBe(429);
  });

  it('CA #3 : 11e requête même couple → 429', async () => {
    const phone = `+23769${String(Date.now() + 1).slice(-7)}`;
    // créer une commande dédiée pour ce couple
    const variantId = fixtureVariantId;
    const dedicatedPhone = phone;
    const dedicatedRef = await createOrder(variantId, dedicatedPhone);

    for (let i = 0; i < 10; i += 1) {
      const r = await request(app.getHttpServer())
        .post(`${BASE_URL}/orders/track`)
        .set('X-Forwarded-For', nextIp())
        .send({ reference: dedicatedRef, phone: dedicatedPhone });
      expect(r.status).toBe(200);
    }
    const blocked = await request(app.getHttpServer())
      .post(`${BASE_URL}/orders/track`)
      .set('X-Forwarded-For', nextIp())
      .send({ reference: dedicatedRef, phone: dedicatedPhone });
    expect(blocked.status).toBe(429);
  });
});
