// CAT-06 e2e — public GET /size-guides/:categoryId and admin PUT.
// Uses the seeded guide for read tests and a dedicated guide for mutations.

import { randomUUID } from 'node:crypto';
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
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { RedisService } from '../src/infrastructure/cache/cache.module';
import { PrismaService } from '../src/infrastructure/database/database.module';

if (existsSync('../.env')) process.loadEnvFile('../.env');
if (process.env.REDIS_URL) {
  const redisUrl = new URL(process.env.REDIS_URL);
  redisUrl.pathname = '/1';
  process.env.REDIS_URL = redisUrl.toString();
}

const PREFIX = 'e2e-cat06';
const PASSWORD = 'E2eCat06!2026';
const BASE_URL = '/api/v1';
const ADMIN_EMAIL = `${PREFIX}-admin@brunyshop.test`;
const STOCK_EMAIL = `${PREFIX}-stock@brunyshop.test`;
const CUSTOMER_EMAIL = `${PREFIX}-customer@brunyshop.test`;
const SUPER_EMAIL = `${PREFIX}-super@brunyshop.test`;

const throttleHits = new Map<string, { totalHits: number; expiresAt: number }>();
function clearThrottle(): void {
  throttleHits.clear();
}

describe('Size guides (CAT-06)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: Redis | undefined;
  let adminToken: string;
  let stockToken: string;
  let customerToken: string;
  let superToken: string;
  let guideId: string;
  let categoryId: string;
  let noGuideCategoryId: string;
  let seededCategoryId: string;
  let seededGuideId: string;
  let kidsCategoryId: string;

  async function clearSizeGuideCache(): Promise<void> {
    if (!redis) return;
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', 'catalog:size-guides:*', 'COUNT', 100);
      cursor = next;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== '0');
  }

  async function cleanupDatabase(): Promise<void> {
    await prisma.auditLog
      .deleteMany({ where: { user: { email: { startsWith: PREFIX } } } })
      .catch(() => {});
    await prisma.category.deleteMany({ where: { slug: { startsWith: PREFIX } } }).catch(() => {});
    await prisma.sizeGuide.deleteMany({ where: { slug: { startsWith: PREFIX } } }).catch(() => {});
    await prisma.userRole
      .deleteMany({ where: { user: { email: { startsWith: PREFIX } } } })
      .catch(() => {});
    await prisma.refreshToken
      .deleteMany({ where: { user: { email: { startsWith: PREFIX } } } })
      .catch(() => {});
    await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } }).catch(() => {});
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

  function adminRequest(method: 'put', path: string, token?: string) {
    const req = request(app.getHttpServer())[method](`${BASE_URL}${path}`);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
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

    const memoryStorage = {
      increment: async (
        key: string,
        ttl: number,
        limit: number,
        blockDuration: number,
        _name: string,
      ) => {
        const now = Date.now();
        const current = throttleHits.get(key);
        const entry =
          !current || current.expiresAt <= now ? { totalHits: 0, expiresAt: now + ttl } : current;
        entry.totalHits += 1;
        throttleHits.set(key, entry);
        const blocked = entry.totalHits > limit;
        return {
          totalHits: entry.totalHits,
          timeToExpire: Math.max(0, entry.expiresAt - now),
          isBlocked: blocked,
          timeToBlockExpire: blocked ? blockDuration : 0,
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
    prisma = app.get(PrismaService);
    redis = app.get(RedisService).redis;

    await cleanupDatabase();
    await clearSizeGuideCache();
    clearThrottle();

    const seeded = await prisma.category.findUnique({
      where: { slug: 'sneakers' },
      select: { id: true, sizeGuideId: true },
    });
    const kids = await prisma.category.findUnique({
      where: { slug: 'chaussures-enfant' },
      select: { id: true },
    });
    if (!seeded?.sizeGuideId || !kids) {
      throw new Error('Seed CAT-06 absent : exécutez pnpm -C backend db:seed.');
    }
    seededCategoryId = seeded.id;
    seededGuideId = seeded.sizeGuideId;
    kidsCategoryId = kids.id;

    const guide = await prisma.sizeGuide.create({
      data: {
        name: 'Guide E2E CAT06',
        slug: `${PREFIX}-guide`,
        description: 'Guide de test.',
        table: {
          men: [
            { eu: 41, us: 8, uk: 7.5, cm: 25.7 },
            { eu: 42, us: 8.5, uk: 8, cm: 26.5 },
          ],
        },
        version: 'v1',
        publishedAt: new Date(),
      },
      select: { id: true },
    });
    guideId = guide.id;
    const category = await prisma.category.create({
      data: { name: 'CAT06 E2E', slug: `${PREFIX}-cat`, sizeGuideId: guide.id },
      select: { id: true },
    });
    categoryId = category.id;
    const noGuide = await prisma.category.create({
      data: { name: 'CAT06 sans guide', slug: `${PREFIX}-sans-guide` },
      select: { id: true },
    });
    noGuideCategoryId = noGuide.id;

    const adminId = await createUser(ADMIN_EMAIL, 'ADMIN');
    const stockId = await createUser(STOCK_EMAIL, 'STOCK_MANAGER');
    const customerId = await createUser(CUSTOMER_EMAIL, 'CUSTOMER');
    const superId = await createUser(SUPER_EMAIL, 'SUPER_ADMIN');
    const jwt = app.get(JwtService);
    adminToken = await jwt.signAsync({ sub: adminId, roles: ['ADMIN'], typ: 'access' });
    stockToken = await jwt.signAsync({ sub: stockId, roles: ['STOCK_MANAGER'], typ: 'access' });
    customerToken = await jwt.signAsync({ sub: customerId, roles: ['CUSTOMER'], typ: 'access' });
    superToken = await jwt.signAsync({ sub: superId, roles: ['SUPER_ADMIN'], typ: 'access' });
  });

  beforeEach(async () => {
    clearThrottle();
    await clearSizeGuideCache();
  });

  afterAll(async () => {
    try {
      await cleanupDatabase();
      await clearSizeGuideCache();
    } finally {
      await app?.close();
    }
  });

  // ------------------------------------------------------------ public
  it('retourne le guide seedé complet sans JWT', async () => {
    const response = await request(app.getHttpServer())
      .get(`${BASE_URL}/size-guides/${seededCategoryId}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: seededGuideId,
      slug: 'guide-pointures-brunyshop',
      version: 'v1',
    });
    expect(response.body.table.men.length).toBeGreaterThanOrEqual(10);
    expect(response.body.table.women.length).toBeGreaterThan(0);
    expect(response.body.table.kids.length).toBeGreaterThan(0);
    expect(response.body.publishedAt).toEqual(expect.any(String));
  });

  it('retourne le tableau enfant pour la catégorie enfant', async () => {
    const response = await request(app.getHttpServer())
      .get(`${BASE_URL}/size-guides/${kidsCategoryId}`)
      .expect(200);
    expect(response.body.table.kids.length).toBeGreaterThan(0);
  });

  it('renvoie 404 SIZE_GUIDE_NOT_FOUND sans guide lié', async () => {
    const response = await request(app.getHttpServer())
      .get(`${BASE_URL}/size-guides/${noGuideCategoryId}`)
      .expect(404);
    expect(response.body.code).toBe('SIZE_GUIDE_NOT_FOUND');
  });

  it('renvoie 404 CATEGORY_NOT_FOUND pour un UUID inconnu', async () => {
    const response = await request(app.getHttpServer())
      .get(`${BASE_URL}/size-guides/${randomUUID()}`)
      .expect(404);
    expect(response.body.code).toBe('CATEGORY_NOT_FOUND');
  });

  it('renvoie 400 pour un UUID invalide', async () => {
    const response = await request(app.getHttpServer())
      .get(`${BASE_URL}/size-guides/invalid-uuid`)
      .expect(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('sert le deuxième appel depuis le cache Redis', async () => {
    const first = await request(app.getHttpServer())
      .get(`${BASE_URL}/size-guides/${seededCategoryId}`)
      .expect(200);
    const cacheKey = `catalog:size-guides:${seededCategoryId}:v1`;
    const cached = await redis!.get(cacheKey);
    expect(cached).not.toBeNull();

    const second = await request(app.getHttpServer())
      .get(`${BASE_URL}/size-guides/${seededCategoryId}`)
      .expect(200);
    expect(second.body).toEqual(first.body);
  });

  it('applique le rate limit public (101e requête → 429)', async () => {
    for (let index = 0; index < 100; index += 1) {
      await request(app.getHttpServer())
        .get(`${BASE_URL}/size-guides/${seededCategoryId}`)
        .expect(200);
    }
    await request(app.getHttpServer())
      .get(`${BASE_URL}/size-guides/${seededCategoryId}`)
      .expect(429);
  });

  // ------------------------------------------------------------- admin
  it('refuse le PUT sans JWT (401)', async () => {
    await adminRequest('put', `/admin/size-guides/${guideId}`, undefined)
      .send({ name: 'Sans token' })
      .expect(401);
  });

  it('refuse le PUT avec le rôle CUSTOMER (403)', async () => {
    await adminRequest('put', `/admin/size-guides/${guideId}`, customerToken)
      .send({ name: 'Client interdit' })
      .expect(403);
  });

  it('accepte STOCK_MANAGER, ADMIN et SUPER_ADMIN (200)', async () => {
    for (const token of [stockToken, adminToken, superToken]) {
      const response = await adminRequest('put', `/admin/size-guides/${guideId}`, token)
        .send({ description: 'Description mise à jour par rôle.' })
        .expect(200);
      expect(response.body.id).toBe(guideId);
    }
  });

  it('met à jour la table, incrémente la version et invalide le cache public', async () => {
    await request(app.getHttpServer()).get(`${BASE_URL}/size-guides/${categoryId}`).expect(200);

    const response = await adminRequest('put', `/admin/size-guides/${guideId}`, adminToken)
      .send({
        table: {
          men: [
            { eu: 43, us: 9.5, uk: 9, cm: 27.3 },
            { eu: 41, us: 8, uk: 7.5, cm: 25.7 },
          ],
          women: [{ eu: 38, us: 7.5, uk: 5.5, cm: 24.1 }],
        },
      })
      .expect(200);

    expect(response.body.version).toBe('v2');
    expect(response.body.table.men.map((entry: { eu: number }) => entry.eu)).toEqual([41, 43]);

    const publicResponse = await request(app.getHttpServer())
      .get(`${BASE_URL}/size-guides/${categoryId}`)
      .expect(200);
    expect(publicResponse.body.version).toBe('v2');
    expect(publicResponse.body.table.men).toHaveLength(2);
    expect(publicResponse.body.table.women).toHaveLength(1);
  });

  it('refuse un doublon EU (400)', async () => {
    const response = await adminRequest('put', `/admin/size-guides/${guideId}`, adminToken)
      .send({
        table: {
          men: [
            { eu: 42, us: 8.5, uk: 8, cm: 26.5 },
            { eu: 42, us: 9, uk: 8.5, cm: 27 },
          ],
        },
      })
      .expect(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('trie une table non triée avant stockage', async () => {
    const response = await adminRequest('put', `/admin/size-guides/${guideId}`, adminToken)
      .send({
        table: {
          men: [
            { eu: 44, us: 10, uk: 9.5, cm: 28 },
            { eu: 40, us: 7, uk: 6.5, cm: 25 },
          ],
        },
      })
      .expect(200);
    expect(response.body.table.men.map((entry: { eu: number }) => entry.eu)).toEqual([40, 44]);

    const stored = await prisma.sizeGuide.findUnique({
      where: { id: guideId },
      select: { table: true },
    });
    expect((stored?.table as { men: Array<{ eu: number }> }).men.map((entry) => entry.eu)).toEqual([
      40, 44,
    ]);
  });

  it('refuse une entrée sans US (400)', async () => {
    const response = await adminRequest('put', `/admin/size-guides/${guideId}`, adminToken)
      .send({ table: { men: [{ eu: 42, uk: 8, cm: 26.5 }] } })
      .expect(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('ne change pas la version quand seul le nom change', async () => {
    const before = await prisma.sizeGuide.findUnique({
      where: { id: guideId },
      select: { version: true },
    });
    const response = await adminRequest('put', `/admin/size-guides/${guideId}`, adminToken)
      .send({ name: 'Guide renommé CAT06' })
      .expect(200);
    expect(response.body.version).toBe(before?.version);
  });

  it('renvoie 404 pour un guide inconnu', async () => {
    const response = await adminRequest('put', `/admin/size-guides/${randomUUID()}`, adminToken)
      .send({ name: 'Inconnu' })
      .expect(404);
    expect(response.body.code).toBe('SIZE_GUIDE_NOT_FOUND');
  });

  it('renvoie 400 pour un body vide', async () => {
    const response = await adminRequest('put', `/admin/size-guides/${guideId}`, adminToken)
      .send({})
      .expect(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('audite SIZE_GUIDE_UPDATED avec un résumé sans le JSON complet', async () => {
    const audit = await prisma.auditLog.findFirst({
      where: { action: 'SIZE_GUIDE_UPDATED', entityId: guideId },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit).not.toBeNull();
    expect(audit?.entity).toBe('SizeGuide');
    const serialized = JSON.stringify({ before: audit?.before, after: audit?.after });
    expect(serialized).toContain('counts');
    expect(serialized).not.toContain('"eu"');
  });

  it('applique le rate limit admin (31e PUT → 429)', async () => {
    for (let index = 0; index < 30; index += 1) {
      await adminRequest('put', `/admin/size-guides/${guideId}`, adminToken)
        .send({ name: 'Rythme CAT06' })
        .expect(200);
    }
    await adminRequest('put', `/admin/size-guides/${guideId}`, adminToken)
      .send({ name: 'Rythme CAT06' })
      .expect(429);
  });
});
