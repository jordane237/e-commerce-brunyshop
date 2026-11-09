// admin-products.e2e-spec.ts
// E2E CAT-04 : mutations admin du catalogue (création, mise à jour, archivage,
// remplacement des variantes, duplication) + RBAC + audit + invalidation cache.

import { existsSync } from 'node:fs';
import { hash } from '@node-rs/argon2';
import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import type Redis from 'ioredis';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { RedisService } from '../src/infrastructure/cache/cache.module';
import { PrismaService } from '../src/infrastructure/database/database.module';

if (existsSync('../.env')) process.loadEnvFile('../.env');

// Isolation BullMQ/Rate-limit : db Redis dédiée au test.
if (process.env.REDIS_URL) {
  const redisUrl = new URL(process.env.REDIS_URL);
  redisUrl.pathname = '/1';
  process.env.REDIS_URL = redisUrl.toString();
}

const PREFIX = 'e2e-cat04';
const ADMIN_EMAIL = `${PREFIX}-admin@brunyshop.test`;
const CUSTOMER_EMAIL = `${PREFIX}-customer@brunyshop.test`;
const STOCK_MANAGER_EMAIL = `${PREFIX}-stock@brunyshop.test`;
const SUPER_ADMIN_EMAIL = `${PREFIX}-superadmin@brunyshop.test`;
const PASSWORD = 'E2eCat04!2026';
const BASE_URL = '/api/v1';

describe('Admin products & variants (CAT-04)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: Redis | undefined;
  let baseUrl: string;
  let adminToken: string;
  let superAdminToken: string;
  let stockManagerToken: string;
  let customerToken: string;
  let adminUserId: string;

  let sourceProductId: string;
  let sourceVariantId: string;
  let categoryId: string;
  let brandId: string;
  const createdProductIds: string[] = [];
  const createdCategoryIds: string[] = [];
  const createdBrandIds: string[] = [];

  async function clearThrottleCounters(): Promise<void> {
    if (!redis) return;
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', '*:default}:*', 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== '0');
  }

  async function cleanupDatabase(): Promise<void> {
    const testProductWhere = {
      OR: [
        { slug: { startsWith: PREFIX } },
        { category: { slug: { startsWith: PREFIX } } },
        { brand: { slug: { startsWith: PREFIX } } },
      ],
    };
    const testVariantWhere = {
      OR: [{ sku: { startsWith: PREFIX } }, { product: testProductWhere }],
    };
    await prisma.orderItem
      .deleteMany({
        where: {
          OR: [{ order: { reference: { startsWith: PREFIX } } }, { variant: testVariantWhere }],
        },
      })
      .catch(() => {});
    await prisma.order
      .deleteMany({
        where: {
          OR: [{ reference: { startsWith: PREFIX } }, { user: { email: { startsWith: PREFIX } } }],
        },
      })
      .catch(() => {});
    await prisma.auditLog
      .deleteMany({
        where: {
          OR: [{ user: { email: { startsWith: PREFIX } } }, { entityId: { startsWith: PREFIX } }],
        },
      })
      .catch(() => {});
    await prisma.stockMovement
      .deleteMany({
        where: {
          OR: [{ user: { email: { startsWith: PREFIX } } }, { variant: testVariantWhere }],
        },
      })
      .catch(() => {});
    await prisma.cartItem.deleteMany({ where: { variant: testVariantWhere } }).catch(() => {});
    await prisma.review
      ?.deleteMany?.({ where: { product: testProductWhere } } as never)
      .catch?.(() => {});
    await prisma.wishlist
      ?.deleteMany?.({ where: { product: testProductWhere } } as never)
      .catch?.(() => {});
    await prisma.productImage.deleteMany({ where: { product: testProductWhere } }).catch(() => {});
    await prisma.productVariant.deleteMany({ where: testVariantWhere }).catch(() => {});
    await prisma.product.deleteMany({ where: testProductWhere }).catch(() => {});
    await prisma.userRole
      .deleteMany({ where: { user: { email: { startsWith: PREFIX } } } })
      .catch(() => {});
    await prisma.refreshToken
      .deleteMany({ where: { user: { email: { startsWith: PREFIX } } } })
      .catch(() => {});
    await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } }).catch(() => {});
    await prisma.category.deleteMany({ where: { slug: { startsWith: PREFIX } } }).catch(() => {});
    await prisma.brand.deleteMany({ where: { slug: { startsWith: PREFIX } } }).catch(() => {});
  }

  async function createUser(email: string, roleName: string): Promise<string> {
    const role = await prisma.role.findFirst({ where: { name: roleName }, select: { id: true } });
    if (!role) throw new Error(`Rôle ${roleName} introuvable : exécutez le seed.`);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hash(PASSWORD),
        firstName: 'E2E',
        lastName: roleName,
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
    return user.id;
  }

  async function login(identifier: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post(`${baseUrl}/auth/login`)
      .send({ identifier, password: PASSWORD })
      .expect(200);
    expect(response.body.accessToken).toEqual(expect.any(String));
    return response.body.accessToken as string;
  }

  function adminRequest(method: 'post' | 'patch' | 'put' | 'delete', path: string, token?: string) {
    const req = request(app.getHttpServer())[method](`${baseUrl}${path}`);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  }

  async function makeCategory(slugSuffix: string, position: number): Promise<string> {
    const category = await prisma.category.create({
      data: { name: `CAT04 ${slugSuffix}`, slug: `${PREFIX}-cat-${slugSuffix}`, position },
      select: { id: true },
    });
    createdCategoryIds.push(category.id);
    return category.id;
  }

  async function makeBrand(slugSuffix: string): Promise<string> {
    const brand = await prisma.brand.create({
      data: { name: `CAT04 Brand ${slugSuffix}`, slug: `${PREFIX}-brand-${slugSuffix}` },
      select: { id: true },
    });
    createdBrandIds.push(brand.id);
    return brand.id;
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

    // Stockage throttle en mémoire pour la stabilité des tests e2e.
    const hits = new Map<string, { totalHits: number; expiresAt: number }>();
    const memoryStorage = {
      increment: async (
        key: string,
        ttl: number,
        limit: number,
        blockDuration: number,
        _throttlerName: string,
      ) => {
        const now = Date.now();
        const current = hits.get(key);
        const entry =
          !current || current.expiresAt <= now ? { totalHits: 0, expiresAt: now + ttl } : current;
        entry.totalHits += 1;
        hits.set(key, entry);
        const isBlocked = entry.totalHits > limit;
        return {
          totalHits: entry.totalHits,
          timeToExpire: Math.max(0, entry.expiresAt - now),
          isBlocked,
          timeToBlockExpire: isBlocked ? blockDuration : 0,
        };
      },
      onApplicationShutdown: async () => undefined,
    };
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ThrottlerStorage)
      .useValue(memoryStorage)
      .compile();

    const instance = moduleRef.createNestApplication({ logger: false });
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
    baseUrl = BASE_URL;

    prisma = app.get(PrismaService);
    redis = app.get(RedisService).redis;
    await cleanupDatabase().catch(() => {});
    await clearThrottleCounters();

    adminUserId = await createUser(ADMIN_EMAIL, 'ADMIN');
    const superAdminId = await createUser(SUPER_ADMIN_EMAIL, 'SUPER_ADMIN');
    await createUser(STOCK_MANAGER_EMAIL, 'STOCK_MANAGER');
    await createUser(CUSTOMER_EMAIL, 'CUSTOMER');

    const jwt = app.get(JwtService);
    adminToken = await jwt.signAsync({ sub: adminUserId, roles: ['ADMIN'], typ: 'access' });
    superAdminToken = await jwt.signAsync({
      sub: superAdminId,
      roles: ['SUPER_ADMIN'],
      typ: 'access',
    });
    stockManagerToken = await login(STOCK_MANAGER_EMAIL);
    customerToken = await login(CUSTOMER_EMAIL);

    categoryId = await makeCategory('source', 99);
    brandId = await makeBrand('source');
    const product = await prisma.product.create({
      data: {
        name: 'Produit source CAT04',
        slug: `${PREFIX}-source`,
        description: 'Description source suffisamment longue.',
        categoryId,
        brandId,
        basePrice: 30000,
        status: 'PUBLISHED',
      },
      select: { id: true },
    });
    sourceProductId = product.id;
    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: `${PREFIX}-source-sku`,
        color: 'NOIR',
        size: '42',
        stock: 10,
        reservedStock: 0,
        lowStockThreshold: 5,
        version: 1,
      },
      select: { id: true },
    });
    sourceVariantId = variant.id;
    await clearThrottleCounters();
  });

  afterAll(async () => {
    try {
      if (prisma) await cleanupDatabase();
      await clearThrottleCounters();
    } finally {
      await app?.close();
    }
  });

  // --------------------------------------------------------- RBAC
  it('rejette la création sans token (401)', async () => {
    await request(app.getHttpServer())
      .post(`${baseUrl}/admin/products`)
      .send({
        name: 'Produit CAT04',
        description: 'Description CAT04 suffisamment longue.',
        categoryId,
        brandId,
        basePrice: 30000,
        variants: [{ color: 'NOIR', size: '42', stock: 10 }],
      })
      .expect(401);
  });

  it('rejette la création avec le rôle CUSTOMER (403)', async () => {
    await adminRequest('post', '/admin/products', customerToken)
      .send({
        name: 'Produit CAT04',
        description: 'Description CAT04 suffisamment longue.',
        categoryId,
        brandId,
        basePrice: 30000,
        variants: [{ color: 'NOIR', size: '42', stock: 10 }],
      })
      .expect(403);
  });

  it('accepte la création avec le rôle STOCK_MANAGER (201)', async () => {
    const c = await makeCategory('sm', 100);
    const b = await makeBrand('sm');
    const response = await adminRequest('post', '/admin/products', stockManagerToken)
      .send({
        name: 'Produit CAT04 Stock Manager',
        description: 'Description CAT04 créée par stock manager.',
        categoryId: c,
        brandId: b,
        basePrice: 30000,
        variants: [{ color: 'NOIR', size: '42', stock: 10 }],
      })
      .expect(201);
    expect(response.body.status).toBe('DRAFT');
    expect(response.body.variants).toHaveLength(1);
    expect(response.body.variants[0].sku).toEqual(expect.any(String));
    createdProductIds.push(response.body.id);
  });

  it('accepte la création avec le rôle ADMIN (201)', async () => {
    const c = await makeCategory('admin', 101);
    const b = await makeBrand('admin');
    const response = await adminRequest('post', '/admin/products', adminToken)
      .send({
        name: 'Produit CAT04 Admin Role',
        description: 'Description CAT04 créée par admin.',
        categoryId: c,
        brandId: b,
        basePrice: 45000,
        variants: [{ color: 'BLANC', size: '40', stock: 5 }],
      })
      .expect(201);
    expect(response.body.name).toBe('Produit CAT04 Admin Role');
    createdProductIds.push(response.body.id);
  });

  it('accepte la création avec le rôle SUPER_ADMIN (201)', async () => {
    const c = await makeCategory('sa', 102);
    const b = await makeBrand('sa');
    const response = await adminRequest('post', '/admin/products', superAdminToken)
      .send({
        name: 'Produit CAT04 Super Admin',
        description: 'Description CAT04 créée par super admin.',
        categoryId: c,
        brandId: b,
        basePrice: 50000,
        variants: [{ color: 'ROUGE', size: '42', stock: 20 }],
      })
      .expect(201);
    expect(response.body.name).toBe('Produit CAT04 Super Admin');
    createdProductIds.push(response.body.id);
  });

  // --------------------------------------------------------- création
  it('crée un produit avec variants explicites et SKU générés (201)', async () => {
    const c = await makeCategory('explicit', 103);
    const b = await makeBrand('explicit');
    const response = await adminRequest('post', '/admin/products', adminToken)
      .send({
        name: 'Air Max 90 CAT04 Explicite',
        description: 'Description Air Max 90 CAT04 explicite.',
        categoryId: c,
        brandId: b,
        basePrice: 45000,
        variants: [
          { color: 'NOIR', size: '40', stock: 5 },
          { color: 'BLANC', size: '42', stock: 10 },
        ],
      })
      .expect(201);
    expect(response.body.basePrice).toBe(45000);
    expect(response.body.status).toBe('DRAFT');
    expect(response.body.variants).toHaveLength(2);
    expect(new Set(response.body.variants.map((v: { sku: string }) => v.sku)).size).toBe(2);
    createdProductIds.push(response.body.id);
  });

  it('crée un produit avec génération cartésienne colors×sizes (201)', async () => {
    const c = await makeCategory('cart', 104);
    const b = await makeBrand('cart');
    const response = await adminRequest('post', '/admin/products', adminToken)
      .send({
        name: 'Produit Cartésien CAT04',
        description: 'Produit généré par produit cartésien.',
        categoryId: c,
        brandId: b,
        basePrice: 25000,
        colors: ['NOIR', 'BLANC'],
        sizes: ['40', '41'],
      })
      .expect(201);
    expect(response.body.variants).toHaveLength(4);
    expect(response.body.variants.every((v: { stock: number }) => v.stock === 0)).toBe(true);
    createdProductIds.push(response.body.id);
  });

  it('utilise le slug fourni et vérifie son unicité (201 + 409)', async () => {
    const c = await makeCategory('slug', 105);
    const b = await makeBrand('slug');
    const slug = `${PREFIX}-mon-slug-unique`;
    const created = await adminRequest('post', '/admin/products', adminToken)
      .send({
        name: 'Produit Avec Slug CAT04',
        slug,
        description: 'Description slug suffisamment longue.',
        categoryId: c,
        brandId: b,
        basePrice: 15000,
        variants: [{ color: 'NOIR', size: '42', stock: 5 }],
      })
      .expect(201);
    expect(created.body.slug).toBe(slug);
    createdProductIds.push(created.body.id);

    await adminRequest('post', '/admin/products', adminToken)
      .send({
        name: 'Autre Produit CAT04',
        slug,
        description: 'Description suffisamment longue.',
        categoryId: c,
        brandId: b,
        basePrice: 10000,
        variants: [{ color: 'BLANC', size: '40', stock: 1 }],
      })
      .expect(409);
  });

  it('rejette la création avec une catégorie inexistante (400)', async () => {
    await adminRequest('post', '/admin/products', adminToken)
      .send({
        name: 'Produit CAT04',
        description: 'Description suffisamment longue.',
        categoryId: '00000000-0000-4000-8000-000000000099',
        brandId,
        basePrice: 30000,
        variants: [{ color: 'NOIR', size: '42', stock: 10 }],
      })
      .expect(400);
  });

  it('rejette la création avec promoPrice >= basePrice (400)', async () => {
    await adminRequest('post', '/admin/products', adminToken)
      .send({
        name: 'Produit Promo CAT04',
        description: 'Description promo suffisamment longue.',
        categoryId,
        brandId,
        basePrice: 30000,
        promoPrice: 30000,
        variants: [{ color: 'NOIR', size: '42', stock: 10 }],
      })
      .expect(400);
  });

  it('rejette la création publiée sans stock (400)', async () => {
    await adminRequest('post', '/admin/products', adminToken)
      .send({
        name: 'Produit Pub Sans Stock CAT04',
        description: 'Description suffisamment longue.',
        categoryId,
        brandId,
        basePrice: 20000,
        status: 'PUBLISHED',
        variants: [{ color: 'NOIR', size: '42', stock: 0 }],
      })
      .expect(400);
  });

  it('rejette la création avec un doublon de couleur+pointure (400)', async () => {
    await adminRequest('post', '/admin/products', adminToken)
      .send({
        name: 'Produit Doublon CAT04',
        description: 'Description suffisamment longue.',
        categoryId,
        brandId,
        basePrice: 30000,
        variants: [
          { color: 'NOIR', size: '42', stock: 10 },
          { color: 'NOIR', size: '42', stock: 5 },
        ],
      })
      .expect(400);
  });

  // --------------------------------------------------- mise à jour (PATCH)
  it('met à jour le prix de base et émet un audit (200 + audit en DB)', async () => {
    const response = await adminRequest('patch', `/admin/products/${sourceProductId}`, adminToken)
      .send({ basePrice: 35000 })
      .expect(200);
    expect(response.body.basePrice).toBe(35000);

    const auditLogs = await prisma.auditLog.findMany({
      where: { entityId: sourceProductId, action: 'PRODUCT_PRICE_UPDATED' },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].before).toMatchObject({ basePrice: 30000 });
    expect(auditLogs[0].after).toMatchObject({ basePrice: 35000 });
    await prisma.product.update({ where: { id: sourceProductId }, data: { basePrice: 30000 } });
  });

  it('met à jour le promoPrice et émet un audit (200 + audit en DB)', async () => {
    const response = await adminRequest('patch', `/admin/products/${sourceProductId}`, adminToken)
      .send({ promoPrice: 25000 })
      .expect(200);
    expect(response.body.promoPrice).toBe(25000);
    const auditLogs = await prisma.auditLog.findMany({
      where: { entityId: sourceProductId, action: 'PRODUCT_PRICE_UPDATED' },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    expect(auditLogs[0].before).toMatchObject({ promoPrice: null });
    expect(auditLogs[0].after).toMatchObject({ promoPrice: 25000 });
    await prisma.product.update({ where: { id: sourceProductId }, data: { promoPrice: null } });
  });

  it("ne crée pas d'audit prix si aucun champ pertinent n'est fourni (200)", async () => {
    const before = await prisma.auditLog.count({ where: { entityId: sourceProductId } });
    await adminRequest('patch', `/admin/products/${sourceProductId}`, adminToken)
      .send({})
      .expect(200);
    const after = await prisma.auditLog.count({ where: { entityId: sourceProductId } });
    expect(after).toBe(before);
  });

  it('met à jour le statut et émet un audit (200)', async () => {
    await adminRequest('patch', `/admin/products/${sourceProductId}`, adminToken)
      .send({ status: 'DRAFT' })
      .expect(200);
    const auditLogs = await prisma.auditLog.findMany({
      where: { entityId: sourceProductId, action: 'PRODUCT_STATUS_UPDATED' },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    expect(auditLogs[0].before).toMatchObject({ status: 'PUBLISHED' });
    expect(auditLogs[0].after).toMatchObject({ status: 'DRAFT' });
    await prisma.product.update({ where: { id: sourceProductId }, data: { status: 'PUBLISHED' } });
  });

  it('rejette la mise à jour avec un slug déjà utilisé (409)', async () => {
    const other = await prisma.product.create({
      data: {
        name: 'Autre Produit Slug CAT04',
        slug: `${PREFIX}-other-slug`,
        description: 'Description suffisamment longue.',
        categoryId,
        brandId,
        basePrice: 10000,
        status: 'DRAFT',
      },
      select: { id: true },
    });
    await adminRequest('patch', `/admin/products/${sourceProductId}`, adminToken)
      .send({ slug: `${PREFIX}-other-slug` })
      .expect(409);
    await prisma.product.delete({ where: { id: other.id } });
  });

  it("rejette la mise à jour d'un produit inexistant (404)", async () => {
    await adminRequest('patch', '/admin/products/00000000-0000-4000-8000-000000000000', adminToken)
      .send({ basePrice: 30000 })
      .expect(404);
  });

  // ------------------------------------------------------ archivage (DELETE)
  it('archive un produit existant (204 + status ARCHIVED en DB)', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'Produit à Archiver CAT04',
        slug: `${PREFIX}-to-archive`,
        description: 'Description suffisamment longue.',
        categoryId,
        brandId,
        basePrice: 5000,
        status: 'DRAFT',
      },
      select: { id: true },
    });
    await adminRequest('delete', `/admin/products/${product.id}`, adminToken).expect(204);
    const archived = await prisma.product.findUnique({
      where: { id: product.id },
      select: { status: true },
    });
    expect(archived?.status).toBe('ARCHIVED');
    await prisma.product.delete({ where: { id: product.id } });
  });

  it('ne fait rien sur un produit déjà ARCHIVED (204)', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'Produit Déjà Archivé CAT04',
        slug: `${PREFIX}-already-archived`,
        description: 'Description suffisamment longue.',
        categoryId,
        brandId,
        basePrice: 5000,
        status: 'ARCHIVED',
      },
      select: { id: true },
    });
    await adminRequest('delete', `/admin/products/${product.id}`, adminToken).expect(204);
    await prisma.product.delete({ where: { id: product.id } });
  });

  it("rejette l'archivage d'un produit inexistant (404)", async () => {
    await adminRequest(
      'delete',
      '/admin/products/00000000-0000-4000-8000-000000000001',
      adminToken,
    ).expect(404);
  });

  // ------------------------------------------- remplacement des variantes
  it('ajoute une nouvelle variante avec SKU généré (200)', async () => {
    const response = await adminRequest(
      'put',
      `/admin/products/${sourceProductId}/variants`,
      adminToken,
    )
      .send({
        variants: [
          { id: sourceVariantId, color: 'NOIR', size: '42', stock: 10 },
          { color: 'BLANC', size: '42', stock: 5 },
        ],
      })
      .expect(200);
    expect(response.body.variants).toHaveLength(2);
    const blanc = response.body.variants.find((v: { color: string }) => v.color === 'BLANC');
    expect(blanc?.sku).toEqual(expect.any(String));
    await prisma.productVariant.deleteMany({
      where: { productId: sourceProductId, id: { not: sourceVariantId } },
    });
  });

  it("met à jour le stock d'une variante et émet un audit STOCK (200)", async () => {
    await adminRequest('put', `/admin/products/${sourceProductId}/variants`, adminToken)
      .send({ variants: [{ id: sourceVariantId, color: 'NOIR', size: '42', stock: 15 }] })
      .expect(200);
    const auditLogs = await prisma.auditLog.findMany({
      where: { entityId: sourceVariantId, action: 'PRODUCT_STOCK_UPDATED' },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    expect(auditLogs[0].before).toMatchObject({ stock: 10 });
    expect(auditLogs[0].after).toMatchObject({ stock: 15 });
    const movements = await prisma.stockMovement.findMany({
      where: { variantId: sourceVariantId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    expect(movements[0]).toMatchObject({ delta: 5, reason: 'ADJUSTMENT', before: 10, after: 15 });
    await prisma.stockMovement.deleteMany({ where: { variantId: sourceVariantId } });
    await prisma.productVariant.update({ where: { id: sourceVariantId }, data: { stock: 10 } });
  });

  it("met à jour le prix d'une variante et émet un audit PRICE (200)", async () => {
    await adminRequest('put', `/admin/products/${sourceProductId}/variants`, adminToken)
      .send({
        variants: [{ id: sourceVariantId, color: 'NOIR', size: '42', stock: 10, price: 5000 }],
      })
      .expect(200);
    const auditLogs = await prisma.auditLog.findMany({
      where: { entityId: sourceVariantId, action: 'PRODUCT_PRICE_UPDATED' },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    expect(auditLogs[0].after).toMatchObject({ price: 5000 });
    await prisma.productVariant.update({ where: { id: sourceVariantId }, data: { price: null } });
  });

  it('supprime une variante sans commande (200)', async () => {
    const toDelete = await prisma.productVariant.create({
      data: {
        productId: sourceProductId,
        sku: `${PREFIX}-to-delete-sku`,
        color: 'ROUGE',
        size: '43',
        stock: 0,
        reservedStock: 0,
        lowStockThreshold: 5,
        version: 1,
      },
      select: { id: true },
    });
    await adminRequest('put', `/admin/products/${sourceProductId}/variants`, adminToken)
      .send({ variants: [{ id: sourceVariantId, color: 'NOIR', size: '42', stock: 10 }] })
      .expect(200);
    expect(await prisma.productVariant.findUnique({ where: { id: toDelete.id } })).toBeNull();
  });

  it("rejette la suppression d'une variante liée à une commande (409 VARIANT_HAS_ORDERS)", async () => {
    const variantWithOrder = await prisma.productVariant.create({
      data: {
        productId: sourceProductId,
        sku: `${PREFIX}-with-order-sku`,
        color: 'VERT',
        size: '44',
        stock: 5,
        reservedStock: 0,
        lowStockThreshold: 5,
        version: 1,
      },
      select: { id: true },
    });
    const order = await prisma.order.create({
      data: {
        reference: `${PREFIX}-ORD-1`,
        userId: adminUserId,
        status: 'PENDING_CONFIRMATION',
        subtotal: 5000,
        discount: 0,
        shippingFee: 0,
        total: 5000,
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
      },
      select: { id: true },
    });
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        variantId: variantWithOrder.id,
        nameSnapshot: 'Produit source CAT04',
        sizeSnapshot: '44',
        colorSnapshot: 'VERT',
        unitPrice: 5000,
        quantity: 1,
      },
    });

    const response = await adminRequest(
      'put',
      `/admin/products/${sourceProductId}/variants`,
      adminToken,
    )
      .send({ variants: [{ id: sourceVariantId, color: 'NOIR', size: '42', stock: 10 }] })
      .expect(409);
    expect(
      response.body.code ?? response.body.error?.code ?? JSON.stringify(response.body),
    ).toContain('VARIANT_HAS_ORDERS');
    expect(
      await prisma.productVariant.findUnique({ where: { id: variantWithOrder.id } }),
    ).not.toBeNull();

    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.productVariant.delete({ where: { id: variantWithOrder.id } });
  });

  it("rejette la mise à jour d'une variante appartenant à un autre produit (400)", async () => {
    const otherProduct = await prisma.product.create({
      data: {
        name: 'Autre Produit Variante CAT04',
        slug: `${PREFIX}-other-variant-product`,
        description: 'Description suffisamment longue.',
        categoryId,
        brandId,
        basePrice: 10000,
        status: 'DRAFT',
      },
      select: { id: true },
    });
    const otherVariant = await prisma.productVariant.create({
      data: {
        productId: otherProduct.id,
        sku: `${PREFIX}-other-variant-sku`,
        color: 'NOIR',
        size: '42',
        stock: 5,
        reservedStock: 0,
        lowStockThreshold: 5,
        version: 1,
      },
      select: { id: true },
    });
    await adminRequest('put', `/admin/products/${sourceProductId}/variants`, adminToken)
      .send({ variants: [{ id: otherVariant.id, color: 'NOIR', size: '42', stock: 10 }] })
      .expect(400);
    await prisma.productVariant.delete({ where: { id: otherVariant.id } });
    await prisma.product.delete({ where: { id: otherProduct.id } });
  });

  it("rejette la mise à jour d'un produit inexistant (404)", async () => {
    await adminRequest(
      'put',
      '/admin/products/00000000-0000-4000-8000-000000000002/variants',
      adminToken,
    )
      .send({ variants: [{ color: 'NOIR', size: '42', stock: 10 }] })
      .expect(404);
  });

  // ------------------------------------------------------- duplication
  it('duplique un produit en DRAFT avec nouveaux SKU (201)', async () => {
    const sourceVariant = await prisma.productVariant.findUnique({
      where: { id: sourceVariantId },
      select: { sku: true },
    });
    const response = await adminRequest(
      'post',
      `/admin/products/${sourceProductId}/duplicate`,
      adminToken,
    )
      .send({ name: 'Produit Source CAT04 (copie)' })
      .expect(201);
    expect(response.body.status).toBe('DRAFT');
    expect(response.body.variants).toHaveLength(1);
    expect(response.body.variants[0].sku).not.toBe(sourceVariant?.sku);
    createdProductIds.push(response.body.id);
  });

  it('duplique avec resetStock=true (stocks à 0)', async () => {
    const response = await adminRequest(
      'post',
      `/admin/products/${sourceProductId}/duplicate`,
      adminToken,
    )
      .send({ name: 'Produit Source CAT04 (copie reset)', resetStock: true })
      .expect(201);
    expect(response.body.variants.every((v: { stock: number }) => v.stock === 0)).toBe(true);
    createdProductIds.push(response.body.id);
  });

  it('duplique sans copier les variantes quand copyVariants=false (201)', async () => {
    const response = await adminRequest(
      'post',
      `/admin/products/${sourceProductId}/duplicate`,
      adminToken,
    )
      .send({ name: 'Produit Source CAT04 (sans variantes)', copyVariants: false })
      .expect(201);
    expect(response.body.variants).toHaveLength(0);
    createdProductIds.push(response.body.id);
  });

  it('refuse une duplication demandée en PUBLISHED (400, copie toujours DRAFT)', async () => {
    await adminRequest('post', `/admin/products/${sourceProductId}/duplicate`, adminToken)
      .send({ name: 'Produit Source CAT04 (force published)', status: 'PUBLISHED' })
      .expect(400);
  });

  it("rejette la duplication d'un produit inexistant (404)", async () => {
    await adminRequest(
      'post',
      '/admin/products/00000000-0000-4000-8000-000000000003/duplicate',
      adminToken,
    )
      .send({ name: 'Dupliqué Inexistant' })
      .expect(404);
  });

  // --------------------------------------------------------- validation
  it('rejette la création avec body vide (400)', async () => {
    await adminRequest('post', '/admin/products', adminToken).send({}).expect(400);
  });

  it('rejette la création avec un status invalide (400)', async () => {
    await adminRequest('post', '/admin/products', adminToken)
      .send({
        name: 'Produit CAT04',
        description: 'Description suffisamment longue.',
        categoryId,
        brandId,
        basePrice: 30000,
        status: 'INVALID_STATUS',
        variants: [{ color: 'NOIR', size: '42', stock: 10 }],
      })
      .expect(400);
  });

  it('rejette la création avec une image URL invalide (400)', async () => {
    await adminRequest('post', '/admin/products', adminToken)
      .send({
        name: 'Produit Image CAT04',
        description: 'Description suffisamment longue.',
        categoryId,
        brandId,
        basePrice: 30000,
        images: [{ url: 'pas-une-url' }],
        variants: [{ color: 'NOIR', size: '42', stock: 10 }],
      })
      .expect(400);
  });

  it('rejette la création avec un stock négatif (400)', async () => {
    await adminRequest('post', '/admin/products', adminToken)
      .send({
        name: 'Produit Stock CAT04',
        description: 'Description suffisamment longue.',
        categoryId,
        brandId,
        basePrice: 30000,
        variants: [{ color: 'NOIR', size: '42', stock: -1 }],
      })
      .expect(400);
  });

  it('rejette une requête contenant reservedStock (400, whitelist)', async () => {
    await adminRequest('put', `/admin/products/${sourceProductId}/variants`, adminToken)
      .send({
        variants: [{ id: sourceVariantId, color: 'NOIR', size: '42', stock: 10, reservedStock: 1 }],
      })
      .expect(400);
  });

  // ------------------------------------------------------- rate limit
  it('applique le rate limiting admin (429 après dépassement)', async () => {
    await clearThrottleCounters();
    let got429 = false;
    // Boucle séquentielle pour éviter la surcharge DB/concurrence ; on s'arrête au 429.
    for (let index = 0; index < 65 && !got429; index += 1) {
      const res = await adminRequest('post', '/admin/products', adminToken).send({
        name: `Produit Rate Limit CAT04 ${index}`,
        description: 'Description rate limit suffisamment longue.',
        categoryId,
        brandId,
        basePrice: 1000 + index,
        variants: [{ color: 'NOIR', size: String(30 + (index % 20)), stock: 1 }],
      });
      if (res.status === 429) got429 = true;
      if (res.body?.id) createdProductIds.push(res.body.id);
    }
    expect(got429).toBe(true);
    await clearThrottleCounters();
  });

  // ------------------------------------------------ cache invalidation
  it('invalide le cache public après une mise à jour (GET détail reflète le changement)', async () => {
    await adminRequest('patch', `/admin/products/${sourceProductId}`, adminToken)
      .send({ basePrice: 36000 })
      .expect(200);
    const detailResponse = await request(app.getHttpServer())
      .get(`${baseUrl}/products/${PREFIX}-source`)
      .expect(200);
    expect(detailResponse.body.basePrice).toBe(36000);
    await prisma.product.update({ where: { id: sourceProductId }, data: { basePrice: 30000 } });
  });

  it('invalide le cache public après archivage (détail public → 404)', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'Produit Cache Archive CAT04',
        slug: `${PREFIX}-cache-archive`,
        description: 'Description suffisamment longue.',
        categoryId,
        brandId,
        basePrice: 12000,
        status: 'PUBLISHED',
      },
      select: { id: true, slug: true },
    });
    // Prime cache.
    await request(app.getHttpServer()).get(`${baseUrl}/products/${product.slug}`).expect(200);
    await adminRequest('delete', `/admin/products/${product.id}`, adminToken).expect(204);
    await request(app.getHttpServer()).get(`${baseUrl}/products/${product.slug}`).expect(404);
    await prisma.product.delete({ where: { id: product.id } });
  });
});
