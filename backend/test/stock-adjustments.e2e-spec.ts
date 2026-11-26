// stock-adjustments.e2e-spec.ts
// E2E STK-02 : ajustements manuels de stock avec motif, historique et audit.

import { existsSync } from 'node:fs';
import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NestFactory } from '@nestjs/core';
import { hash } from '@node-rs/argon2';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PrismaService } from '../src/infrastructure/database/database.module';

if (existsSync('../.env')) process.loadEnvFile('../.env');
process.env['TURNSTILE_ENABLED'] = 'false';

const PREFIX = 'e2e-stk02';
const PASSWORD = 'E2eStk02!2026';
const BASE_URL = '/api/v1';
const suffix = `${Date.now()}`;

describe('STK-02 ajustements manuels de stock', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let stockManagerToken: string;
  let adminToken: string;
  let superAdminToken: string;
  let customerToken: string;
  let orderManagerToken: string;
  let livreurToken: string;
  let variantId: string;
  let categoryId: string;
  let brandId: string;

  async function cleanupDatabase(): Promise<void> {
    const productWhere = {
      OR: [{ slug: { startsWith: PREFIX } }, { name: { startsWith: 'STK02 ' } }],
    };
    await prisma.stockMovement
      .deleteMany({ where: { variant: { product: productWhere } } })
      .catch(() => undefined);
    await prisma.auditLog
      .deleteMany({ where: { action: 'PRODUCT_STOCK_ADJUSTED' } })
      .catch(() => undefined);
    await prisma.product.deleteMany({ where: productWhere }).catch(() => undefined);
    await prisma.category
      .deleteMany({ where: { slug: { startsWith: PREFIX } } })
      .catch(() => undefined);
    await prisma.brand
      .deleteMany({ where: { slug: { startsWith: PREFIX } } })
      .catch(() => undefined);
    await prisma.userRole
      .deleteMany({ where: { user: { email: { startsWith: PREFIX } } } })
      .catch(() => undefined);
    await prisma.user
      .deleteMany({ where: { email: { startsWith: PREFIX } } })
      .catch(() => undefined);
  }

  async function createUser(email: string, roleName: string): Promise<string> {
    const role = await prisma.role.findFirst({ where: { name: roleName }, select: { id: true } });
    if (!role) throw new Error(`Rôle ${roleName} introuvable : exécutez le seed.`);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hash(PASSWORD),
        firstName: 'E2E',
        lastName: 'STK02',
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
    return user.id;
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

    const stockManagerId = await createUser(`${PREFIX}-stock@brunyshop.test`, 'STOCK_MANAGER');
    const adminId = await createUser(`${PREFIX}-admin@brunyshop.test`, 'ADMIN');
    const superAdminId = await createUser(`${PREFIX}-super@brunyshop.test`, 'SUPER_ADMIN');
    const customerId = await createUser(`${PREFIX}-customer@brunyshop.test`, 'CUSTOMER');
    const orderManagerId = await createUser(`${PREFIX}-order@brunyshop.test`, 'ORDER_MANAGER');
    const livreurId = await createUser(`${PREFIX}-livreur@brunyshop.test`, 'LIVREUR');

    const jwt = app.get(JwtService);
    stockManagerToken = await jwt.signAsync({
      sub: stockManagerId,
      roles: ['STOCK_MANAGER'],
      typ: 'access',
    });
    adminToken = await jwt.signAsync({ sub: adminId, roles: ['ADMIN'], typ: 'access' });
    superAdminToken = await jwt.signAsync({
      sub: superAdminId,
      roles: ['SUPER_ADMIN'],
      typ: 'access',
    });
    customerToken = await jwt.signAsync({ sub: customerId, roles: ['CUSTOMER'], typ: 'access' });
    orderManagerToken = await jwt.signAsync({
      sub: orderManagerId,
      roles: ['ORDER_MANAGER'],
      typ: 'access',
    });
    livreurToken = await jwt.signAsync({ sub: livreurId, roles: ['LIVREUR'], typ: 'access' });

    const category = await prisma.category.create({
      data: { name: `${PREFIX} ${suffix}`, slug: `${PREFIX}-${suffix}` },
    });
    categoryId = category.id;
    const brand = await prisma.brand.create({
      data: { name: `${PREFIX} ${suffix}`, slug: `${PREFIX}-${suffix}` },
    });
    brandId = brand.id;

    const product = await prisma.product.create({
      data: {
        name: 'STK02 Variante test',
        slug: `${PREFIX}-${suffix}-product`,
        description: 'Produit e2e STK-02.',
        categoryId,
        brandId,
        basePrice: 30000,
        status: 'PUBLISHED',
        variants: {
          create: [{ sku: `${PREFIX}-${suffix}-variant`, color: 'NOIR', size: '42', stock: 5 }],
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

  it('refuse sans JWT (401) et par rôle insuffisant (403)', async () => {
    await request(app.getHttpServer())
      .post(`${BASE_URL}/admin/variants/${variantId}/stock-adjust`)
      .send({ newStock: 7, motif: 'RECEPTION' })
      .expect(401);

    for (const token of [customerToken, orderManagerToken, livreurToken]) {
      await request(app.getHttpServer())
        .post(`${BASE_URL}/admin/variants/${variantId}/stock-adjust`)
        .set('Authorization', `Bearer ${token}`)
        .send({ newStock: 7, motif: 'RECEPTION' })
        .expect(403);
    }
  });

  it('autorise STOCK_MANAGER, ADMIN, SUPER_ADMIN (200)', async () => {
    for (const token of [stockManagerToken, adminToken, superAdminToken]) {
      const res = await request(app.getHttpServer())
        .post(`${BASE_URL}/admin/variants/${variantId}/stock-adjust`)
        .set('Authorization', `Bearer ${token}`)
        .send({ newStock: 5, motif: 'INVENTAIRE', notes: 'test' })
        .expect(200);
      expect(res.body).toMatchObject({ variantId, before: 5, after: 5, delta: 0 });
    }
  });

  it('ajuste le stock et crée un StockMovement + audit (CA #1/#2/#4)', async () => {
    const res = await request(app.getHttpServer())
      .post(`${BASE_URL}/admin/variants/${variantId}/stock-adjust`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ newStock: 10, motif: 'RECEPTION', notes: 'Réception fournisseur' })
      .expect(200);

    expect(res.body).toMatchObject({
      variantId,
      before: 5,
      after: 10,
      delta: 5,
      motif: 'RECEPTION',
    });
    expect(res.body.movementId).toBeTruthy();

    const movement = await prisma.stockMovement.findUnique({ where: { id: res.body.movementId } });
    expect(movement).toMatchObject({
      variantId,
      delta: 5,
      reason: 'ADJUSTMENT',
      motif: 'RECEPTION',
      notes: 'Réception fournisseur',
      before: 5,
      after: 10,
      userId: expect.any(String),
      orderId: null,
    });

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'PRODUCT_STOCK_ADJUSTED', entityId: variantId },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit).toBeTruthy();
    expect(audit?.before).toMatchObject({ stock: 5 });
    expect(audit?.after).toMatchObject({ stock: 10, motif: 'RECEPTION', delta: 5 });
  });

  it('valide newStock >= 0 (400) et motif requis/invalide (400)', async () => {
    await request(app.getHttpServer())
      .post(`${BASE_URL}/admin/variants/${variantId}/stock-adjust`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ newStock: -1, motif: 'RECEPTION' })
      .expect(400);

    await request(app.getHttpServer())
      .post(`${BASE_URL}/admin/variants/${variantId}/stock-adjust`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ newStock: 7 })
      .expect(400);

    await request(app.getHttpServer())
      .post(`${BASE_URL}/admin/variants/${variantId}/stock-adjust`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ newStock: 7, motif: 'INVALID' })
      .expect(400);
  });

  it('404 si variante inexistante', async () => {
    await request(app.getHttpServer())
      .post(`${BASE_URL}/admin/variants/00000000-0000-0000-0000-000000000000/stock-adjust`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ newStock: 7, motif: 'RECEPTION' })
      .expect(404);
  });

  it('GET stock-movements : auth/roles, filtres et pagination (CA #3)', async () => {
    await request(app.getHttpServer()).get(`${BASE_URL}/admin/stock-movements`).expect(401);
    await request(app.getHttpServer())
      .get(`${BASE_URL}/admin/stock-movements`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);

    const res = await request(app.getHttpServer())
      .get(`${BASE_URL}/admin/stock-movements`)
      .query({ variantId, motif: 'RECEPTION', page: 1, limit: 10 })
      .set('Authorization', `Bearer ${stockManagerToken}`)
      .expect(200);

    expect(res.body.meta).toMatchObject({ page: 1, limit: 10 });
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toMatchObject({ variantId, motif: 'RECEPTION' });

    const from = new Date(Date.now() - 86400000).toISOString();
    const to = new Date(Date.now() + 86400000).toISOString();
    await request(app.getHttpServer())
      .get(`${BASE_URL}/admin/stock-movements`)
      .query({ variantId, from, to })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`${BASE_URL}/admin/stock-movements`)
      .query({ from: to, to: from })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
  });
});
