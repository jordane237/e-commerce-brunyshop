// order-status.e2e-spec.ts
// E2E ORD-02 : PATCH /api/v1/admin/orders/:id/status — machine à états,
// RBAC, historique, audit, restitution du stock et concurrence.

import { existsSync } from 'node:fs';
import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NestFactory } from '@nestjs/core';
import { hash } from '@node-rs/argon2';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { OrderStatus } from '../src/generated/prisma/client';
import { PrismaService } from '../src/infrastructure/database/database.module';

if (existsSync('../.env')) process.loadEnvFile('../.env');
process.env['TURNSTILE_ENABLED'] = 'false';

const PREFIX = 'e2e-ord02';
const PASSWORD = 'E2eOrd02!2026';
const BASE_URL = '/api/v1';
const suffix = `${Date.now()}`;

describe('ORD-02 machine à états des commandes', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let orderManagerToken: string;
  let driverToken: string;
  let adminToken: string;
  let customerToken: string;
  let categoryId: string;
  let brandId: string;
  let variantId: string;
  let orderCounter = 0;

  function nextReference(): string {
    orderCounter += 1;
    return `${PREFIX}-${suffix}-${String(orderCounter).padStart(3, '0')}`;
  }

  async function createOrder(status: OrderStatus, quantity = 1): Promise<string> {
    const order = await prisma.order.create({
      data: {
        reference: nextReference(),
        status,
        subtotal: 30000,
        shippingFee: 1500,
        total: 31500,
        paymentMethod: 'COD',
        guestName: 'Client ORD-02',
        guestPhone: '+237699000002',
        items: {
          create: [
            {
              variantId,
              nameSnapshot: 'ORD02 Baskets',
              sizeSnapshot: '42',
              colorSnapshot: 'NOIR',
              unitPrice: 30000,
              quantity,
            },
          ],
        },
      },
      select: { id: true },
    });
    return order.id;
  }

  async function createUser(email: string, roleName: string): Promise<string> {
    const role = await prisma.role.findFirst({ where: { name: roleName }, select: { id: true } });
    if (!role) throw new Error(`Rôle ${roleName} introuvable : exécutez le seed.`);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hash(PASSWORD),
        firstName: 'E2E',
        lastName: 'ORD02',
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
    return user.id;
  }

  function patch(orderId: string, body: unknown, token: string) {
    return request(app.getHttpServer())
      .patch(`${BASE_URL}/admin/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send(body as object);
  }

  async function cleanupDatabase(): Promise<void> {
    await prisma.stockMovement
      .deleteMany({ where: { variant: { product: { slug: { startsWith: PREFIX } } } } })
      .catch(() => undefined);
    await prisma.order.deleteMany({ where: { reference: { startsWith: PREFIX } } });
    await prisma.product
      .deleteMany({ where: { slug: { startsWith: PREFIX } } })
      .catch(() => undefined);
    await prisma.category.deleteMany({ where: { slug: { startsWith: PREFIX } } });
    await prisma.brand.deleteMany({ where: { slug: { startsWith: PREFIX } } });
    await prisma.userRole.deleteMany({ where: { user: { email: { startsWith: PREFIX } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
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
    await cleanupDatabase().catch(() => undefined);

    const orderManagerId = await createUser(`${PREFIX}-manager@brunyshop.test`, 'ORDER_MANAGER');
    const driverId = await createUser(`${PREFIX}-driver@brunyshop.test`, 'LIVREUR');
    const adminId = await createUser(`${PREFIX}-admin@brunyshop.test`, 'ADMIN');
    const customerId = await createUser(`${PREFIX}-customer@brunyshop.test`, 'CUSTOMER');

    const jwt = app.get(JwtService);
    orderManagerToken = await jwt.signAsync({
      sub: orderManagerId,
      roles: ['ORDER_MANAGER'],
      typ: 'access',
    });
    driverToken = await jwt.signAsync({ sub: driverId, roles: ['LIVREUR'], typ: 'access' });
    adminToken = await jwt.signAsync({ sub: adminId, roles: ['ADMIN'], typ: 'access' });
    customerToken = await jwt.signAsync({ sub: customerId, roles: ['CUSTOMER'], typ: 'access' });

    const category = await prisma.category.create({
      data: { name: `${PREFIX} ${suffix}`, slug: `${PREFIX}-${suffix}` },
    });
    categoryId = category.id;
    const brand = await prisma.brand.create({
      data: { name: `${PREFIX} ${suffix}`, slug: `${PREFIX}-brand-${suffix}` },
    });
    brandId = brand.id;
    const product = await prisma.product.create({
      data: {
        name: 'ORD02 Baskets',
        slug: `${PREFIX}-${suffix}`,
        description: 'Produit e2e ORD-02.',
        categoryId,
        brandId,
        basePrice: 30000,
        status: 'PUBLISHED',
        variants: {
          create: [{ sku: `${PREFIX}-${suffix}`, color: 'NOIR', size: '42', stock: 3 }],
        },
      },
      include: { variants: true },
    });
    variantId = product.variants[0].id;
  });

  afterAll(async () => {
    try {
      if (prisma !== undefined) await cleanupDatabase();
    } finally {
      await app?.close();
    }
  });

  it('401 sans JWT et 403 pour CUSTOMER', async () => {
    const orderId = await createOrder('PENDING_CONFIRMATION');
    await request(app.getHttpServer())
      .patch(`${BASE_URL}/admin/orders/${orderId}/status`)
      .send({ status: 'CONFIRMED' })
      .expect(401);
    await patch(orderId, { status: 'CONFIRMED' }, customerToken).expect(403);
  });

  it('400 pour un statut cible inconnu et pour un identifiant non UUID', async () => {
    const orderId = await createOrder('PENDING_CONFIRMATION');
    const invalidStatus = await patch(orderId, { status: 'ARCHIVED' }, adminToken).expect(400);
    expect(invalidStatus.body.code).toBe('VALIDATION_ERROR');

    await request(app.getHttpServer())
      .patch(`${BASE_URL}/admin/orders/pas-un-uuid/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CONFIRMED' })
      .expect(400);
  });

  it('404 pour une commande inexistante', async () => {
    const response = await patch(
      '00000000-0000-4000-8000-000000000000',
      { status: 'CONFIRMED' },
      adminToken,
    ).expect(404);
    expect(response.body.code).toBe('ORDER_NOT_FOUND');
  });

  it('409 pour une transition interdite (PENDING_CONFIRMATION → DELIVERED)', async () => {
    const orderId = await createOrder('PENDING_CONFIRMATION');
    const response = await patch(orderId, { status: 'DELIVERED' }, adminToken).expect(409);

    expect(response.body.code).toBe('INVALID_STATUS_TRANSITION');
    expect(response.body.errors[0]).toMatchObject({
      currentStatus: 'PENDING_CONFIRMATION',
      targetStatus: 'DELIVERED',
    });
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order.status).toBe('PENDING_CONFIRMATION');
    expect(await prisma.orderStatusHistory.count({ where: { orderId } })).toBe(0);
  });

  it('applique une transition valide avec historique et audit', async () => {
    const orderId = await createOrder('PENDING_CONFIRMATION');
    const response = await patch(
      orderId,
      { status: 'CONFIRMED', reason: 'Validation téléphonique' },
      orderManagerToken,
    ).expect(200);

    expect(response.body).toMatchObject({
      id: orderId,
      previousStatus: 'PENDING_CONFIRMATION',
      status: 'CONFIRMED',
    });
    expect(response.body.history[0]).toMatchObject({
      fromStatus: 'PENDING_CONFIRMATION',
      toStatus: 'CONFIRMED',
      reason: 'Validation téléphonique',
      userName: 'E2E ORD02',
    });

    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order.status).toBe('CONFIRMED');

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'ORDER_STATUS_CHANGED', entity: 'Order', entityId: orderId },
    });
    expect(audit).not.toBeNull();
    expect(audit?.before).toMatchObject({ status: 'PENDING_CONFIRMATION' });
    expect(audit?.after).toMatchObject({ status: 'CONFIRMED' });
  });

  it('limite le livreur aux constats de livraison', async () => {
    const confirmed = await createOrder('CONFIRMED');
    const forbidden = await patch(confirmed, { status: 'PREPARING' }, driverToken).expect(403);
    expect(forbidden.body.code).toBe('FORBIDDEN_STATUS_TRANSITION');

    const shipped = await createOrder('SHIPPED');
    const delivered = await patch(shipped, { status: 'DELIVERED' }, driverToken).expect(200);
    expect(delivered.body.status).toBe('DELIVERED');

    const failedOrder = await createOrder('SHIPPED');
    await patch(failedOrder, { status: 'DELIVERY_FAILED' }, driverToken).expect(200);
    await patch(failedOrder, { status: 'CANCELLED' }, driverToken).expect(403);
  });

  it('réserve le remboursement aux administrateurs', async () => {
    const returned = await createOrder('RETURNED');
    const denied = await patch(returned, { status: 'REFUNDED' }, orderManagerToken).expect(403);
    expect(denied.body.code).toBe('FORBIDDEN_STATUS_TRANSITION');

    const refunded = await patch(returned, { status: 'REFUNDED' }, adminToken).expect(200);
    expect(refunded.body.status).toBe('REFUNDED');
  });

  it('restitue le stock à l’annulation avec un mouvement CANCELLATION', async () => {
    await prisma.productVariant.update({ where: { id: variantId }, data: { stock: 3 } });
    const orderId = await createOrder('CONFIRMED', 2);
    // Simule le décrément effectué par ORD-01 à la création.
    await prisma.productVariant.update({ where: { id: variantId }, data: { stock: 1 } });

    await patch(orderId, { status: 'CANCELLED', reason: 'Rupture de stock' }, adminToken).expect(
      200,
    );

    const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    expect(variant.stock).toBe(3);
    const movement = await prisma.stockMovement.findFirstOrThrow({
      where: { orderId, reason: 'CANCELLATION' },
    });
    expect(movement).toMatchObject({ delta: 2, before: 1, after: 3 });
  });

  it('n’accepte qu’une seule transition concurrente', async () => {
    const orderId = await createOrder('PENDING_CONFIRMATION');

    const [first, second] = await Promise.all([
      patch(orderId, { status: 'CONFIRMED' }, adminToken),
      patch(orderId, { status: 'CONFIRMED' }, adminToken),
    ]);

    expect([first.status, second.status].sort()).toEqual([200, 409]);
    expect(await prisma.orderStatusHistory.count({ where: { orderId } })).toBe(1);
    expect(
      await prisma.auditLog.count({ where: { action: 'ORDER_STATUS_CHANGED', entityId: orderId } }),
    ).toBe(1);
  });
});
