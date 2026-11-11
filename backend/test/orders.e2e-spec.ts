import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { hash } from '@node-rs/argon2';
import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PrismaService } from '../src/infrastructure/database/database.module';

if (existsSync('../.env')) process.loadEnvFile('../.env');
process.env['TURNSTILE_ENABLED'] = 'false';
if (process.env['REDIS_URL']) {
  const redisUrl = new URL(process.env['REDIS_URL']);
  redisUrl.pathname = '/1';
  process.env['REDIS_URL'] = redisUrl.toString();
}

const PREFIX = 'e2e-stk01-orders';
const BASE_URL = '/api/v1';
const PASSWORD = 'E2eStk01!2026';
const GUEST_PHONE = '+237699100001';
const suffix = `${Date.now()}`;

interface Fixture {
  productId: string;
  variantId: string;
  sku: string;
}

describe('POST /api/v1/orders (STK-01)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let categoryId: string;
  let brandId: string;
  let zoneId: string;
  let customerId: string;
  let customerToken: string;
  let city: string;

  let ipCounter = 0;
  function nextIp(): string {
    ipCounter += 1;
    return `10.${(ipCounter >> 16) & 255}.${(ipCounter >> 8) & 255}.${(ipCounter & 255) + 1}`;
  }

  function createOrder(body: unknown, token?: string) {
    const requestBuilder = request(app.getHttpServer())
      .post(`${BASE_URL}/orders`)
      .set('X-Forwarded-For', nextIp());
    if (token !== undefined) requestBuilder.set('Authorization', `Bearer ${token}`);
    return requestBuilder.send(body as object);
  }

  function address(overrides: Record<string, unknown> = {}) {
    return {
      recipientName: 'Awa E2E',
      phone: '+237699100001',
      city,
      district: 'Bonapriso',
      line: 'Rue 12',
      ...overrides,
    };
  }

  function guestBody(fixture: Fixture, overrides: Record<string, unknown> = {}) {
    return {
      items: [{ variantId: fixture.variantId, quantity: 1 }],
      guestName: 'Client Invité',
      guestPhone: GUEST_PHONE,
      address: address(),
      paymentMethod: 'COD',
      ...overrides,
    };
  }

  function connectedBody(fixture: Fixture) {
    return {
      items: [{ variantId: fixture.variantId, quantity: 1 }],
      address: address(),
      paymentMethod: 'COD',
    };
  }

  async function createFixture(label: string, stock: number): Promise<Fixture> {
    const slug = `${PREFIX}-${suffix}-${label}`;
    const product = await prisma.product.create({
      data: {
        name: `STK01 ${label}`,
        slug,
        description: 'Produit e2e STK-01',
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
    return {
      productId: product.id,
      variantId: product.variants[0].id,
      sku: product.variants[0].sku,
    };
  }

  async function cleanup(): Promise<void> {
    const productWhere = { slug: { startsWith: `${PREFIX}-${suffix}` } };
    await prisma.stockMovement
      .deleteMany({ where: { variant: { product: productWhere } } })
      .catch(() => undefined);
    await prisma.order
      .deleteMany({
        where: {
          OR: [
            ...(customerId !== undefined ? [{ userId: customerId }] : []),
            { guestPhone: { startsWith: '+237699100' } },
          ],
        },
      })
      .catch(() => undefined);
    await prisma.product.deleteMany({ where: productWhere }).catch(() => undefined);
    await prisma.deliveryZone
      .deleteMany({ where: { name: { startsWith: PREFIX } } })
      .catch(() => undefined);
    await prisma.user
      .deleteMany({ where: { email: { startsWith: PREFIX } } })
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
    jwt = app.get(JwtService);

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
    const zone = await prisma.deliveryZone.create({
      data: {
        name: `${PREFIX}-${suffix}`,
        cities: [city],
        fee: 1500,
        estimatedDays: 2,
      },
    });
    zoneId = zone.id;

    const role = await prisma.role.findUnique({
      where: { name: 'CUSTOMER' },
      select: { id: true },
    });
    if (role === null) throw new Error('Rôle CUSTOMER introuvable : exécutez le seed.');

    const customer = await prisma.user.create({
      data: {
        email: `${PREFIX}-customer-${suffix}@brunyshop.test`,
        passwordHash: await hash(PASSWORD),
        firstName: 'E2E',
        lastName: 'STK01',
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    customerId = customer.id;
    await prisma.userRole.create({ data: { userId: customer.id, roleId: role.id } });
    customerToken = await jwt.signAsync({
      sub: customer.id,
      email: `${PREFIX}-customer-${suffix}@brunyshop.test`,
      roles: ['CUSTOMER'],
      typ: 'access',
    });
  });

  afterAll(async () => {
    if (prisma !== undefined) await cleanup();
    if (app !== undefined) await app.close();
  });

  it('crée une commande guest, décrémente le stock et trace le mouvement', async () => {
    const fixture = await createFixture('guest', 3);

    const response = await createOrder(guestBody(fixture));

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      reference: expect.stringMatching(/^BRN-\d{4}-[A-Z2-9]{4}$/),
      status: 'PENDING_CONFIRMATION',
      paymentStatus: 'PENDING',
      paymentMethod: 'COD',
      subtotal: 30000,
      discount: 0,
      shippingFee: 1500,
      total: 31500,
    });

    const order = await prisma.order.findUniqueOrThrow({
      where: { id: response.body.id },
      include: { items: true, payments: true, shipment: true },
    });
    expect(order.guestName).toBe('Client Invité');
    expect(order.userId).toBeNull();
    expect(order.items).toHaveLength(1);
    expect(order.payments[0]).toMatchObject({ provider: 'cod', amount: 31500, status: 'PENDING' });
    expect(order.shipment).toMatchObject({ zoneId, status: 'PENDING' });

    const variant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: fixture.variantId },
    });
    expect(variant.stock).toBe(2);
    expect(variant.version).toBe(2);

    const movement = await prisma.stockMovement.findFirstOrThrow({
      where: { orderId: order.id },
    });
    expect(movement).toMatchObject({
      variantId: fixture.variantId,
      delta: -1,
      before: 3,
      after: 2,
      reason: 'PURCHASE',
      userId: null,
      orderId: order.id,
    });
  });

  it('crée une commande connectée avec userId et mouvement nominatif', async () => {
    const fixture = await createFixture('auth', 1);

    const response = await createOrder(connectedBody(fixture), customerToken);

    expect(response.status).toBe(201);
    const movement = await prisma.stockMovement.findFirstOrThrow({
      where: { orderId: response.body.id },
    });
    expect(movement.userId).toBe(customerId);
    const order = await prisma.order.findUniqueOrThrow({ where: { id: response.body.id } });
    expect(order.userId).toBe(customerId);
    expect(order.guestName).toBeNull();
  });

  it('refuse tout prix fourni par le client', async () => {
    const fixture = await createFixture('price', 2);

    const response = await createOrder(
      guestBody(fixture, {
        items: [{ variantId: fixture.variantId, quantity: 1, unitPrice: 1, previousUnitPrice: 1 }],
      }),
    );

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('renvoie 409 INSUFFICIENT_STOCK avec les quantités et ne crée rien', async () => {
    const fixture = await createFixture('insufficient', 1);

    const response = await createOrder(
      guestBody(fixture, { items: [{ variantId: fixture.variantId, quantity: 2 }] }),
    );

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      code: 'INSUFFICIENT_STOCK',
      message: 'Stock insuffisant : 1 disponible(s), 2 demandé(s).',
      errors: [
        {
          field: 'items',
          variantId: fixture.variantId,
          requestedQuantity: 2,
          availableQuantity: 1,
        },
      ],
    });
    expect(await prisma.orderItem.count({ where: { variantId: fixture.variantId } })).toBe(0);
    const variant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: fixture.variantId },
    });
    expect(variant.stock).toBe(1);
  });

  it('exige nom et téléphone pour un guest', async () => {
    const fixture = await createFixture('guest-required', 1);
    const body = guestBody(fixture);
    delete (body as Record<string, unknown>)['guestName'];
    delete (body as Record<string, unknown>)['guestPhone'];

    const response = await createOrder(body);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('GUEST_INFORMATION_REQUIRED');
  });

  it('refuse les moyens de paiement indisponibles', async () => {
    const fixture = await createFixture('payment', 1);

    const response = await createOrder(guestBody(fixture, { paymentMethod: 'MOBILE_MONEY' }));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('PAYMENT_METHOD_UNAVAILABLE');
  });

  it('retourne la même commande pour une clé d’idempotence réutilisée', async () => {
    const fixture = await createFixture('idempotent', 2);
    const idempotencyKey = randomUUID();

    const first = await createOrder(guestBody(fixture, { idempotencyKey }));
    const second = await createOrder(guestBody(fixture, { idempotencyKey }));

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.id).toBe(first.body.id);
    const variant = await prisma.productVariant.findUniqueOrThrow({
      where: { id: fixture.variantId },
    });
    expect(variant.stock).toBe(1);
    expect(await prisma.stockMovement.count({ where: { variantId: fixture.variantId } })).toBe(1);
  });

  it('refuse une clé d’idempotence appartenant à un autre client', async () => {
    const fixture = await createFixture('idempotent-owner', 2);
    const idempotencyKey = randomUUID();

    await createOrder(guestBody(fixture, { idempotencyKey }));
    const response = await createOrder(
      guestBody(fixture, { idempotencyKey, guestPhone: '+237699100099' }),
    );

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('IDEMPOTENCY_CONFLICT');
  });

  it('refuse un produit archivé', async () => {
    const fixture = await createFixture('archived', 2);
    await prisma.product.update({ where: { id: fixture.productId }, data: { status: 'ARCHIVED' } });

    const response = await createOrder(guestBody(fixture));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('PRODUCT_ARCHIVED');
    expect(await prisma.orderItem.count({ where: { variantId: fixture.variantId } })).toBe(0);
  });

  it('refuse une ville sans zone de livraison', async () => {
    const fixture = await createFixture('zone', 2);

    const response = await createOrder(guestBody(fixture, { address: address({ city: 'Kribi' }) }));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('DELIVERY_ZONE_NOT_FOUND');
  });

  it('refuse une variante inexistante', async () => {
    const response = await createOrder(
      guestBody(
        { productId: 'none', variantId: randomUUID(), sku: 'none' },
        { items: [{ variantId: randomUUID(), quantity: 1 }] },
      ),
    );

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('PRODUCT_NOT_FOUND');
  });
});
