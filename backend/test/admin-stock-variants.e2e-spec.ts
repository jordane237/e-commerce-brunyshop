// admin-stock-variants.e2e-spec.ts
// E2E STK-05 : liste des variantes avec stock (filtres, recherche, pagination, RBAC).

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

const PREFIX = 'e2e-stk05';
const PASSWORD = 'E2eStk05!2026';
const BASE_URL = '/api/v1';
const suffix = `${Date.now()}`;

describe('STK-05 variantes de stock', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let stockManagerToken: string;
  let customerToken: string;
  let categoryId: string;
  let otherCategoryId: string;
  let brandId: string;
  let inStockVariantId: string;
  let lowVariantId: string;
  let outVariantId: string;

  async function cleanupDatabase(): Promise<void> {
    const productWhere = {
      OR: [{ slug: { startsWith: PREFIX } }, { name: { startsWith: 'STK05 ' } }],
    };
    await prisma.stockMovement
      .deleteMany({ where: { variant: { product: productWhere } } })
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
        lastName: 'STK05',
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
    const customerId = await createUser(`${PREFIX}-customer@brunyshop.test`, 'CUSTOMER');
    const jwt = app.get(JwtService);
    stockManagerToken = await jwt.signAsync({
      sub: stockManagerId,
      roles: ['STOCK_MANAGER'],
      typ: 'access',
    });
    customerToken = await jwt.signAsync({ sub: customerId, roles: ['CUSTOMER'], typ: 'access' });

    const category = await prisma.category.create({
      data: { name: `${PREFIX} A`, slug: `${PREFIX}-a-${suffix}` },
    });
    categoryId = category.id;
    const otherCategory = await prisma.category.create({
      data: { name: `${PREFIX} B`, slug: `${PREFIX}-b-${suffix}` },
    });
    otherCategoryId = otherCategory.id;
    const brand = await prisma.brand.create({
      data: { name: `${PREFIX} Brand`, slug: `${PREFIX}-brand-${suffix}` },
    });
    brandId = brand.id;

    const product = await prisma.product.create({
      data: {
        name: 'STK05 Air Max',
        slug: `${PREFIX}-${suffix}-air`,
        description: 'Produit e2e STK-05.',
        categoryId,
        brandId,
        basePrice: 30000,
        status: 'PUBLISHED',
        variants: {
          create: [
            {
              sku: `${PREFIX}-in-${suffix}`,
              color: 'NOIR',
              size: '42',
              stock: 10,
              lowStockThreshold: 3,
            },
            {
              sku: `${PREFIX}-low-${suffix}`,
              color: 'BLANC',
              size: '41',
              stock: 2,
              lowStockThreshold: 3,
            },
            {
              sku: `${PREFIX}-out-${suffix}`,
              color: 'ROUGE',
              size: '40',
              stock: 0,
              lowStockThreshold: 3,
            },
          ],
        },
      },
      include: { variants: true },
    });
    const bySku = (needle: string) => product.variants.find((v) => v.sku.includes(needle))!.id;
    inStockVariantId = bySku('-in-');
    lowVariantId = bySku('-low-');
    outVariantId = bySku('-out-');

    const otherProduct = await prisma.product.create({
      data: {
        name: 'STK05 Sandale',
        slug: `${PREFIX}-${suffix}-sandale`,
        description: 'Autre catégorie.',
        categoryId: otherCategoryId,
        brandId,
        basePrice: 15000,
        status: 'PUBLISHED',
        variants: {
          create: [
            {
              sku: `${PREFIX}-other-${suffix}`,
              color: 'BLEU',
              size: '38',
              stock: 5,
              lowStockThreshold: 1,
            },
          ],
        },
      },
    });
    expect(otherProduct.id).toBeTruthy();
  });

  afterAll(async () => {
    try {
      if (prisma !== undefined) await cleanupDatabase();
    } finally {
      await app?.close();
    }
  });

  it('401 sans JWT et 403 pour CUSTOMER', async () => {
    await request(app.getHttpServer()).get(`${BASE_URL}/admin/stock/variants`).expect(401);
    await request(app.getHttpServer())
      .get(`${BASE_URL}/admin/stock/variants`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);
  });

  it('200 STOCK_MANAGER avec availableStock et stockStatus calculés', async () => {
    const res = await request(app.getHttpServer())
      .get(`${BASE_URL}/admin/stock/variants`)
      .query({ search: 'STK05' })
      .set('Authorization', `Bearer ${stockManagerToken}`)
      .expect(200);

    expect(res.body.meta.total).toBe(4);
    const out = res.body.data.find((v: { variantId: string }) => v.variantId === outVariantId);
    const low = res.body.data.find((v: { variantId: string }) => v.variantId === lowVariantId);
    const ok = res.body.data.find((v: { variantId: string }) => v.variantId === inStockVariantId);
    expect(out).toMatchObject({ stockStatus: 'OUT', availableStock: 0 });
    expect(low).toMatchObject({ stockStatus: 'LOW', availableStock: 2 });
    expect(ok).toMatchObject({
      stockStatus: 'IN_STOCK',
      availableStock: 10,
      categoryName: `${PREFIX} A`,
    });
  });

  it('filtre stockStatus=out / low / in_stock', async () => {
    const out = await request(app.getHttpServer())
      .get(`${BASE_URL}/admin/stock/variants`)
      .query({ stockStatus: 'out', search: 'STK05' })
      .set('Authorization', `Bearer ${stockManagerToken}`)
      .expect(200);
    expect(out.body.data.map((v: { variantId: string }) => v.variantId)).toEqual([outVariantId]);

    const low = await request(app.getHttpServer())
      .get(`${BASE_URL}/admin/stock/variants`)
      .query({ stockStatus: 'low', search: 'STK05' })
      .set('Authorization', `Bearer ${stockManagerToken}`)
      .expect(200);
    expect(low.body.data.map((v: { variantId: string }) => v.variantId)).toEqual([lowVariantId]);

    const inStock = await request(app.getHttpServer())
      .get(`${BASE_URL}/admin/stock/variants`)
      .query({ stockStatus: 'in_stock', search: 'STK05' })
      .set('Authorization', `Bearer ${stockManagerToken}`)
      .expect(200);
    expect(
      inStock.body.data.every((v: { stockStatus: string }) => v.stockStatus === 'IN_STOCK'),
    ).toBe(true);
  });

  it('filtre catégorie et recherche SKU', async () => {
    const byCategory = await request(app.getHttpServer())
      .get(`${BASE_URL}/admin/stock/variants`)
      .query({ categoryId: otherCategoryId })
      .set('Authorization', `Bearer ${stockManagerToken}`)
      .expect(200);
    expect(byCategory.body.data).toHaveLength(1);
    expect(byCategory.body.data[0].productName).toBe('STK05 Sandale');

    const bySku = await request(app.getHttpServer())
      .get(`${BASE_URL}/admin/stock/variants`)
      .query({ search: `${PREFIX}-out-` })
      .set('Authorization', `Bearer ${stockManagerToken}`)
      .expect(200);
    expect(bySku.body.data[0].variantId).toBe(outVariantId);
  });

  it('pagination borne les résultats', async () => {
    const first = await request(app.getHttpServer())
      .get(`${BASE_URL}/admin/stock/variants`)
      .query({ search: 'STK05', page: 1, limit: 2 })
      .set('Authorization', `Bearer ${stockManagerToken}`)
      .expect(200);
    expect(first.body.data).toHaveLength(2);
    expect(first.body.meta).toMatchObject({ page: 1, limit: 2, totalPages: 2 });

    await request(app.getHttpServer())
      .get(`${BASE_URL}/admin/stock/variants`)
      .query({ limit: 101 })
      .set('Authorization', `Bearer ${stockManagerToken}`)
      .expect(400);
  });
});
