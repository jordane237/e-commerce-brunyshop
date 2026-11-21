// rbac.e2e-spec.ts
// AUT-05 : default-deny, 401/403/200 par rôle, routes publiques non cassées
// et isolation des ressources personnelles (IDOR) sur GET /me.
//
// Les jetons ADMIN/SUPER_ADMIN sont signés via JwtService pour contourner le
// 2FA obligatoire du login ; le guard recharge les rôles en base, donc le
// test vérifie bien l'autorisation réelle et non le contenu du JWT.

import { existsSync } from 'node:fs';
import { hash } from '@node-rs/argon2';
import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import type Redis from 'ioredis';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { RedisService } from '../src/infrastructure/cache/cache.module';
import { PrismaService } from '../src/infrastructure/database/database.module';

if (existsSync('../.env')) process.loadEnvFile('../.env');
process.env['TURNSTILE_ENABLED'] = 'false';

// Isolation du rate-limit et de BullMQ : db Redis dédiée aux e2e.
if (process.env.REDIS_URL) {
  const redisUrl = new URL(process.env.REDIS_URL);
  redisUrl.pathname = '/1';
  process.env.REDIS_URL = redisUrl.toString();
}

const PREFIX = 'e2e-aut05';
const PASSWORD = 'E2eAut05!2026';
const BASE_URL = '/api/v1';

type RoleName =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'ORDER_MANAGER'
  | 'STOCK_MANAGER'
  | 'LIVREUR'
  | 'CUSTOMER';

const ROLE_EMAILS: Record<RoleName, string> = {
  SUPER_ADMIN: `${PREFIX}-superadmin@brunyshop.test`,
  ADMIN: `${PREFIX}-admin@brunyshop.test`,
  ORDER_MANAGER: `${PREFIX}-order@brunyshop.test`,
  STOCK_MANAGER: `${PREFIX}-stock@brunyshop.test`,
  LIVREUR: `${PREFIX}-driver@brunyshop.test`,
  CUSTOMER: `${PREFIX}-customer@brunyshop.test`,
};

describe('RBAC AUT-05 (default-deny, rôles, IDOR)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: Redis | undefined;
  let baseUrl: string;
  let jwt: JwtService;

  const userIds: Partial<Record<RoleName, string>> = {};
  const tokens: Partial<Record<RoleName, string>> = {};
  let customerBId: string;
  let customerBToken: string;
  let fakeSuperAdminToken: string;
  let expiredToken: string;

  let categoryId: string;
  let brandId: string;
  let sizeGuideId: string;
  let productSlug: string;

  async function cleanupDatabase(): Promise<void> {
    const productWhere = {
      OR: [{ slug: { startsWith: PREFIX } }, { category: { slug: { startsWith: PREFIX } } }],
    };
    const variantWhere = { product: productWhere };
    await prisma.orderItem.deleteMany({ where: { variant: variantWhere } }).catch(() => {});
    await prisma.stockMovement.deleteMany({ where: { variant: variantWhere } }).catch(() => {});
    await prisma.productVariant.deleteMany({ where: { product: productWhere } }).catch(() => {});
    await prisma.product.deleteMany({ where: productWhere }).catch(() => {});
    await prisma.sizeGuide.deleteMany({ where: { slug: { startsWith: PREFIX } } }).catch(() => {});
    await prisma.category.deleteMany({ where: { slug: { startsWith: PREFIX } } }).catch(() => {});
    await prisma.brand.deleteMany({ where: { slug: { startsWith: PREFIX } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } }).catch(() => {});
  }

  async function clearThrottleCounters(): Promise<void> {
    if (!redis) return;
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', '*:default}:*', 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== '0');
  }

  async function createUser(email: string, roleName: RoleName): Promise<string> {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
      select: { id: true },
    });
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

  async function signAccess(
    userId: string,
    roles: RoleName[],
    expiresIn?: number,
  ): Promise<string> {
    const payload = {
      sub: userId,
      email: 'e2e@brunyshop.test',
      roles,
      typ: 'access',
    };
    return jwt.signAsync(payload, expiresIn === undefined ? undefined : { expiresIn });
  }

  function productPayload(name: string): Record<string, unknown> {
    return {
      name,
      description: 'Produit de test RBAC suffisamment long.',
      categoryId,
      brandId,
      basePrice: 30000,
      variants: [{ color: 'NOIR', size: '42', stock: 5 }],
    };
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
    baseUrl = BASE_URL;
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
    redis = app.get(RedisService).redis;

    await redis.flushdb();
    await cleanupDatabase();

    for (const role of Object.keys(ROLE_EMAILS) as RoleName[]) {
      userIds[role] = await createUser(ROLE_EMAILS[role], role);
      tokens[role] = await signAccess(userIds[role] as string, [role]);
    }

    customerBId = await createUser(`${PREFIX}-customer-b@brunyshop.test`, 'CUSTOMER');
    customerBToken = await signAccess(customerBId, ['CUSTOMER']);

    // Un client ne doit jamais devenir admin parce que son JWT prétend l'être :
    // le guard recharge les rôles en base et ignore ce tableau.
    fakeSuperAdminToken = await signAccess(userIds.CUSTOMER as string, ['SUPER_ADMIN']);
    expiredToken = await signAccess(userIds.CUSTOMER as string, ['CUSTOMER'], -1);

    const suffix = Date.now().toString(36);
    const category = await prisma.category.create({
      data: { name: `AUT05 Category ${suffix}`, slug: `${PREFIX}-cat-${suffix}` },
      select: { id: true },
    });
    categoryId = category.id;
    const brand = await prisma.brand.create({
      data: { name: `AUT05 Brand ${suffix}`, slug: `${PREFIX}-brand-${suffix}` },
      select: { id: true },
    });
    brandId = brand.id;

    const sizeGuide = await prisma.sizeGuide.create({
      data: {
        name: 'AUT05 Guide',
        slug: `${PREFIX}-guide-${suffix}`,
        table: { men: [{ eu: 42, us: 9, uk: 8, cm: 27 }] },
      },
      select: { id: true },
    });
    sizeGuideId = sizeGuide.id;

    const product = await prisma.product.create({
      data: {
        name: 'AUT05 Media Product',
        slug: `${PREFIX}-media-${suffix}`,
        description: 'Produit de support pour le presign média.',
        categoryId,
        brandId,
        basePrice: 20000,
        status: 'DRAFT',
      },
      select: { slug: true },
    });
    productSlug = product.slug;

    await clearThrottleCounters();
  });

  afterAll(async () => {
    try {
      if (prisma) await cleanupDatabase();
      await clearThrottleCounters();
      if (redis) await redis.flushdb();
    } finally {
      await app?.close();
    }
  });

  // ------------------------------------------------------------------ public

  describe('routes publiques — aucune régression 401', () => {
    it('GET /health/live répond 200 sans JWT', async () => {
      await request(app.getHttpServer()).get(`${baseUrl}/health/live`).expect(200);
    });

    it('GET /health/ready répond 200 sans JWT', async () => {
      await request(app.getHttpServer()).get(`${baseUrl}/health/ready`).expect(200);
    });

    it('GET /products répond 200 sans JWT', async () => {
      await request(app.getHttpServer()).get(`${baseUrl}/products`).expect(200);
    });

    it('GET /products/:slug inconnu répond 404, pas 401', async () => {
      const response = await request(app.getHttpServer())
        .get(`${baseUrl}/products/${PREFIX}-absent`)
        .expect(404);
      expect(response.body.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('GET /categories répond 200 sans JWT', async () => {
      await request(app.getHttpServer()).get(`${baseUrl}/categories`).expect(200);
    });

    it('GET /size-guides/:id inconnu répond 404, pas 401', async () => {
      await request(app.getHttpServer())
        .get(`${baseUrl}/size-guides/00000000-0000-4000-8000-000000000000`)
        .expect(404);
    });

    it('GET /media/files sans clé répond 404, pas 401', async () => {
      await request(app.getHttpServer()).get(`${baseUrl}/media/files`).expect(404);
    });

    it('POST /auth/register invalide répond 400, pas 401', async () => {
      await request(app.getHttpServer()).post(`${baseUrl}/auth/register`).send({}).expect(400);
    });

    it('POST /auth/login invalide répond 401 INVALID_CREDENTIALS, pas le guard', async () => {
      const response = await request(app.getHttpServer())
        .post(`${baseUrl}/auth/login`)
        .send({ identifier: `${PREFIX}-unknown@brunyshop.test`, password: 'WrongPassword!123' })
        .expect(401);
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('POST /auth/refresh sans cookie répond 401 NO_SESSION, pas le guard', async () => {
      const response = await request(app.getHttpServer())
        .post(`${baseUrl}/auth/refresh`)
        .expect(401);
      expect(response.body.code).toBe('NO_SESSION');
    });

    it('POST /cart/validate invalide répond 400, pas 401', async () => {
      await request(app.getHttpServer()).post(`${baseUrl}/cart/validate`).send({}).expect(400);
    });
  });

  // --------------------------------------------------------------------- 401

  describe('default-deny — 401 sans jeton', () => {
    const protectedRequests: Array<[string, string, string]> = [
      ['get', '/me', 'UNAUTHORIZED'],
      ['post', '/admin/products', 'UNAUTHORIZED'],
      ['post', '/admin/media/presign', 'UNAUTHORIZED'],
      ['get', '/admin/notifications/dead-letters', 'UNAUTHORIZED'],
      ['put', `/admin/size-guides/${'00000000-0000-4000-8000-000000000000'}`, 'UNAUTHORIZED'],
    ];

    it.each(protectedRequests)('%s %s → 401 %s', async (method, path, code) => {
      const http = request(app.getHttpServer());
      const call = http[method as 'get' | 'post' | 'put'].bind(http);
      const response = await call(`${baseUrl}${path}`).send({}).expect(401);
      expect(response.body.code).toBe(code);
    });

    it('rejette une signature invalide avec INVALID_TOKEN', async () => {
      const response = await request(app.getHttpServer())
        .get(`${baseUrl}/me`)
        .set('Authorization', 'Bearer not-a-valid-jwt')
        .expect(401);
      expect(response.body.code).toBe('INVALID_TOKEN');
    });

    it('distingue un jeton expiré avec TOKEN_EXPIRED', async () => {
      const response = await request(app.getHttpServer())
        .get(`${baseUrl}/me`)
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
      expect(response.body.code).toBe('TOKEN_EXPIRED');
    });
  });

  // --------------------------------------------------------------------- 403

  describe('RBAC — 403 avec un rôle insuffisant', () => {
    it('CUSTOMER ne peut pas créer de produit', async () => {
      const response = await request(app.getHttpServer())
        .post(`${baseUrl}/admin/products`)
        .set('Authorization', `Bearer ${tokens.CUSTOMER}`)
        .send(productPayload('AUT05 Customer Product'))
        .expect(403);
      expect(response.body.code).toBe('FORBIDDEN');
    });

    it('LIVREUR ne peut pas créer de produit', async () => {
      const response = await request(app.getHttpServer())
        .post(`${baseUrl}/admin/products`)
        .set('Authorization', `Bearer ${tokens.LIVREUR}`)
        .send(productPayload('AUT05 Driver Product'))
        .expect(403);
      expect(response.body.code).toBe('FORBIDDEN');
    });

    it('ORDER_MANAGER ne peut pas créer de produit', async () => {
      await request(app.getHttpServer())
        .post(`${baseUrl}/admin/products`)
        .set('Authorization', `Bearer ${tokens.ORDER_MANAGER}`)
        .send(productPayload('AUT05 Order Product'))
        .expect(403);
    });

    it('CUSTOMER ne peut pas modifier un guide de tailles', async () => {
      await request(app.getHttpServer())
        .put(`${baseUrl}/admin/size-guides/${sizeGuideId}`)
        .set('Authorization', `Bearer ${tokens.CUSTOMER}`)
        .send({ name: 'AUT05 Customer Guide' })
        .expect(403);
    });

    it('CUSTOMER ne peut pas obtenir une URL média signée', async () => {
      await request(app.getHttpServer())
        .post(`${baseUrl}/admin/media/presign`)
        .set('Authorization', `Bearer ${tokens.CUSTOMER}`)
        .send({ productSlug, contentType: 'image/jpeg', declaredSize: 1024 })
        .expect(403);
    });

    it('CUSTOMER ne peut pas lire les dead-letters', async () => {
      await request(app.getHttpServer())
        .get(`${baseUrl}/admin/notifications/dead-letters`)
        .set('Authorization', `Bearer ${tokens.CUSTOMER}`)
        .expect(403);
    });

    it('LIVREUR ne peut pas lire les dead-letters', async () => {
      await request(app.getHttpServer())
        .get(`${baseUrl}/admin/notifications/dead-letters`)
        .set('Authorization', `Bearer ${tokens.LIVREUR}`)
        .expect(403);
    });

    it('STOCK_MANAGER ne peut pas lire les dead-letters', async () => {
      await request(app.getHttpServer())
        .get(`${baseUrl}/admin/notifications/dead-letters`)
        .set('Authorization', `Bearer ${tokens.STOCK_MANAGER}`)
        .expect(403);
    });

    it('ORDER_MANAGER ne peut pas lire les dead-letters', async () => {
      await request(app.getHttpServer())
        .get(`${baseUrl}/admin/notifications/dead-letters`)
        .set('Authorization', `Bearer ${tokens.ORDER_MANAGER}`)
        .expect(403);
    });

    it('un CUSTOMER avec un JWT prétendant SUPER_ADMIN reste refusé', async () => {
      const response = await request(app.getHttpServer())
        .post(`${baseUrl}/admin/products`)
        .set('Authorization', `Bearer ${fakeSuperAdminToken}`)
        .send(productPayload('AUT05 Forged Role Product'))
        .expect(403);
      expect(response.body.code).toBe('FORBIDDEN');
    });
  });

  // --------------------------------------------------------------------- 200

  describe('RBAC — 200/201 avec un rôle autorisé', () => {
    it.each([
      ['STOCK_MANAGER', 'AUT05 Stock Manager Product'],
      ['ADMIN', 'AUT05 Admin Product'],
      ['SUPER_ADMIN', 'AUT05 Super Admin Product'],
    ] as const)('%s peut créer un produit (201)', async (role, name) => {
      const response = await request(app.getHttpServer())
        .post(`${baseUrl}/admin/products`)
        .set('Authorization', `Bearer ${tokens[role]}`)
        .send(productPayload(name))
        .expect(201);
      expect(response.body.name).toBe(name);
      expect(response.body.status).toBe('DRAFT');
    });

    it('ADMIN peut lire les dead-letters (200)', async () => {
      await request(app.getHttpServer())
        .get(`${baseUrl}/admin/notifications/dead-letters`)
        .set('Authorization', `Bearer ${tokens.ADMIN}`)
        .expect(200);
    });

    it('SUPER_ADMIN peut lire les dead-letters (200)', async () => {
      await request(app.getHttpServer())
        .get(`${baseUrl}/admin/notifications/dead-letters`)
        .set('Authorization', `Bearer ${tokens.SUPER_ADMIN}`)
        .expect(200);
    });

    it('STOCK_MANAGER peut modifier un guide de tailles (200)', async () => {
      await request(app.getHttpServer())
        .put(`${baseUrl}/admin/size-guides/${sizeGuideId}`)
        .set('Authorization', `Bearer ${tokens.STOCK_MANAGER}`)
        .send({ name: 'AUT05 Guide mis à jour' })
        .expect(200);
    });

    it('STOCK_MANAGER peut obtenir une URL média signée (200)', async () => {
      await request(app.getHttpServer())
        .post(`${baseUrl}/admin/media/presign`)
        .set('Authorization', `Bearer ${tokens.STOCK_MANAGER}`)
        .send({ productSlug, contentType: 'image/jpeg', declaredSize: 1024 })
        .expect(200);
    });
  });

  // ------------------------------------------------------------------- IDOR

  describe('IDOR — chaque client ne lit que son propre profil', () => {
    it('CUSTOMER A obtient son propre id', async () => {
      const response = await request(app.getHttpServer())
        .get(`${baseUrl}/me`)
        .set('Authorization', `Bearer ${tokens.CUSTOMER}`)
        .expect(200);
      expect(response.body.id).toBe(userIds.CUSTOMER);
    });

    it('CUSTOMER B obtient son propre id, différent de A', async () => {
      const response = await request(app.getHttpServer())
        .get(`${baseUrl}/me`)
        .set('Authorization', `Bearer ${customerBToken}`)
        .expect(200);
      expect(response.body.id).toBe(customerBId);
      expect(response.body.id).not.toBe(userIds.CUSTOMER);
    });

    it('un paramètre userId ne permet pas de lire le profil de B', async () => {
      const response = await request(app.getHttpServer())
        .get(`${baseUrl}/me?userId=${customerBId}`)
        .set('Authorization', `Bearer ${tokens.CUSTOMER}`)
        .expect(200);
      expect(response.body.id).toBe(userIds.CUSTOMER);
      expect(response.body.id).not.toBe(customerBId);
    });
  });
});
