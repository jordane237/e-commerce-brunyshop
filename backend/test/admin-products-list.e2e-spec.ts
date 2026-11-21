// admin-products-list.e2e-spec.ts
// E2E BO-03 : liste admin des produits (RBAC + pagination meta).

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

const PREFIX = 'e2e-bo03';
const PASSWORD = 'E2eBo03!2026';
const ADMIN_EMAIL = `${PREFIX}-admin@brunyshop.test`;
const CUSTOMER_EMAIL = `${PREFIX}-customer@brunyshop.test`;
const BASE_URL = '/api/v1';

describe('Admin products list (BO-03)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let customerToken: string;
  let adminUserId: string;
  let customerUserId: string;
  let categoryId: string;
  let brandId: string;
  let productId: string;

  async function cleanup(): Promise<void> {
    const productWhere = {
      OR: [{ slug: { startsWith: PREFIX } }, { name: { startsWith: PREFIX } }],
    };
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
    await prisma.refreshToken
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
        lastName: 'BO03',
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

    await cleanup().catch(() => undefined);
    adminUserId = await createUser(ADMIN_EMAIL, 'ADMIN');
    customerUserId = await createUser(CUSTOMER_EMAIL, 'CUSTOMER');

    const jwt = app.get(JwtService);
    adminToken = await jwt.signAsync({ sub: adminUserId, roles: ['ADMIN'], typ: 'access' });
    customerToken = await jwt.signAsync({
      sub: customerUserId,
      roles: ['CUSTOMER'],
      typ: 'access',
    });

    const category = await prisma.category.create({
      data: { name: `${PREFIX} catégorie`, slug: `${PREFIX}-cat` },
    });
    categoryId = category.id;
    const brand = await prisma.brand.create({
      data: { name: `${PREFIX} marque`, slug: `${PREFIX}-brand` },
    });
    brandId = brand.id;

    const product = await prisma.product.create({
      data: {
        name: `${PREFIX} Produit`,
        slug: `${PREFIX}-produit`,
        description: 'Produit e2e BO-03',
        categoryId,
        brandId,
        basePrice: 25000,
        status: 'DRAFT',
        variants: {
          create: [
            { sku: `${PREFIX}-sku`, color: 'NOIR', size: '42', stock: 5, lowStockThreshold: 2 },
          ],
        },
      },
    });
    productId = product.id;
  });

  afterAll(async () => {
    try {
      if (prisma !== undefined) await cleanup();
    } finally {
      await app?.close();
    }
  });

  it('renvoie 401 sans jeton', async () => {
    await request(app.getHttpServer()).get(`${BASE_URL}/admin/products`).expect(401);
  });

  it('renvoie 403 pour un client', async () => {
    await request(app.getHttpServer())
      .get(`${BASE_URL}/admin/products`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);
  });

  it('renvoie 200 avec la liste et les métadonnées pour un admin', async () => {
    const res = await request(app.getHttpServer())
      .get(`${BASE_URL}/admin/products`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 20 });
    expect(res.body.items.some((p: { id: string }) => p.id === productId)).toBe(true);
  });
});
