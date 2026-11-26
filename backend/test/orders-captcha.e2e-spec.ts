import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PrismaService } from '../src/infrastructure/database/database.module';

if (existsSync('../.env')) process.loadEnvFile('../.env');
// Cloudflare Turnstile est remplacé par un faux siteverify local : on teste le
// contrat du guard (CAPTCHA_REQUIRED / INVALID / UNAVAILABLE) sans réseau.
process.env['TURNSTILE_ENABLED'] = 'true';
process.env['TURNSTILE_SITE_KEY'] = '1x00000000000000000000BB';
process.env['TURNSTILE_SECRET_KEY'] = '1x0000000000000000000000000000000AA';
process.env['STOCK_LOW_ALERT_ENABLED'] = 'false';
if (process.env['REDIS_URL']) {
  const redisUrl = new URL(process.env['REDIS_URL']);
  redisUrl.pathname = '/3';
  process.env['REDIS_URL'] = redisUrl.toString();
}

const PREFIX = 'e2e-ord01-captcha';
const BASE_URL = '/api/v1';
const suffix = `${Date.now()}`;
const PHONE_PREFIX = `+23768${suffix.slice(-4)}`;

describe('POST /api/v1/orders — CAPTCHA (ORD-01)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let verifyServer: Server;
  let categoryId: string;
  let brandId: string;
  let city: string;
  let counter = 0;

  function nextIp(): string {
    counter += 1;
    return `10.90.${(counter >> 8) & 255}.${(counter & 255) + 1}`;
  }

  function nextPhone(): string {
    counter += 1;
    return `${PHONE_PREFIX}${String(counter).padStart(3, '0')}`;
  }

  async function createFixture(label: string, stock: number) {
    const product = await prisma.product.create({
      data: {
        name: `ORD01 captcha ${label}`,
        slug: `${PREFIX}-${suffix}-${label}`,
        description: 'Produit e2e CAPTCHA',
        categoryId,
        brandId,
        basePrice: 20000,
        status: 'PUBLISHED',
        variants: {
          create: [{ sku: `${PREFIX}-${suffix}-${label}`, color: 'Blanc', size: '40', stock }],
        },
      },
      include: { variants: true },
    });
    return { variantId: product.variants[0].id };
  }

  function payload(variantId: string, token?: string) {
    return {
      items: [{ variantId, quantity: 1 }],
      guestName: 'Client CAPTCHA',
      guestPhone: nextPhone(),
      address: {
        recipientName: 'Client CAPTCHA',
        phone: nextPhone(),
        city,
        district: 'Akwa',
        line: 'Rue 5',
      },
      paymentMethod: 'COD',
      ...(token !== undefined ? { turnstileToken: token } : {}),
    };
  }

  function post(body: unknown, token?: string) {
    const builder = request(app.getHttpServer())
      .post(`${BASE_URL}/orders`)
      .set('Idempotency-Key', randomUUID())
      .set('X-Forwarded-For', nextIp());
    if (token !== undefined) builder.set('CF-Turnstile-Response', token);
    return builder.send(body as object);
  }

  async function cleanup(): Promise<void> {
    const productWhere = { slug: { startsWith: `${PREFIX}-${suffix}` } };
    await prisma.stockMovement.deleteMany({ where: { variant: { product: productWhere } } });
    await prisma.order.deleteMany({ where: { guestPhone: { startsWith: PHONE_PREFIX } } });
    await prisma.product.deleteMany({ where: productWhere });
    // Notifications conservées : leur mise à jour asynchrone par le worker
    // BullMQ échouerait si la ligne disparaissait pendant l'envoi.
    await prisma.deliveryZone.deleteMany({ where: { name: { startsWith: PREFIX } } });
    await prisma.category.deleteMany({ where: { slug: { startsWith: PREFIX } } });
    await prisma.brand.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  }

  beforeAll(async () => {
    if (!process.env['DATABASE_URL'] || !process.env['REDIS_URL']) {
      throw new Error('Set DATABASE_URL and REDIS_URL before running pnpm test:e2e.');
    }
    verifyServer = createServer((req, res) => {
      let raw = '';
      req.on('data', (chunk: Buffer) => {
        raw += chunk.toString();
      });
      req.on('end', () => {
        const token = new URLSearchParams(raw).get('response');
        if (token === 'boom') {
          res.writeHead(500, { 'content-type': 'text/plain' }).end('down');
          return;
        }
        const success = token === 'good';
        res
          .writeHead(200, { 'content-type': 'application/json' })
          .end(
            JSON.stringify(
              success
                ? { success: true }
                : { success: false, 'error-codes': ['invalid-input-response'] },
            ),
          );
      });
    });
    await new Promise<void>((resolve) => verifyServer.listen(0, '127.0.0.1', resolve));
    const { port } = verifyServer.address() as AddressInfo;
    process.env['TURNSTILE_VERIFY_URL'] = `http://127.0.0.1:${port}/siteverify`;

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
    city = `${PREFIX}-${suffix}`;
    await prisma.deliveryZone.create({
      data: { name: `${PREFIX}-${suffix}`, cities: [city], fee: 1000, estimatedDays: 1 },
    });
  });

  afterAll(async () => {
    if (prisma !== undefined) await cleanup();
    if (app !== undefined) await app.close();
    if (verifyServer !== undefined) {
      await new Promise<void>((resolve, reject) =>
        verifyServer.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });

  it('exige un jeton Turnstile quand le CAPTCHA est actif', async () => {
    const fixture = await createFixture('missing', 2);

    const response = await post(payload(fixture.variantId));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('CAPTCHA_REQUIRED');
  });

  it('rejette un jeton refusé par Cloudflare', async () => {
    const fixture = await createFixture('invalid', 2);

    const response = await post(payload(fixture.variantId, 'nope'));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('CAPTCHA_INVALID');
  });

  it('retourne 503 quand la vérification est indisponible', async () => {
    const fixture = await createFixture('unavailable', 2);

    const response = await post(payload(fixture.variantId, 'boom'));

    expect(response.status).toBe(503);
    expect(response.body.code).toBe('CAPTCHA_UNAVAILABLE');
  });

  it('accepte la commande avec un jeton valide transmis en en-tête', async () => {
    const fixture = await createFixture('valid', 2);

    const response = await post(payload(fixture.variantId), 'good');

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('PENDING_CONFIRMATION');
    const variant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: fixture.variantId },
    });
    expect(variant.stock).toBe(1);
  });
});
