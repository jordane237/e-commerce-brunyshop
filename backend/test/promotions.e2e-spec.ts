// promotions.e2e-spec.ts
// E2E CAT-12 : promotions programmées.
//   - validation admin : prix promo < prix de base, fenêtre de dates cohérente,
//     dates obligatoires dès qu'un prix promo est fourni (CA #1, #4) ;
//   - prix effectif calculé côté serveur à l'instant de la requête (CA #2) ;
//   - exposition de `discountPercent` pour le badge −X% (CA #3).
//
// Les bornes temporelles fines sont couvertes par le test unitaire
// `src/common/pricing/pricing.service.test.ts` (fenêtre fixe, 6 bornes).

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
process.env['TURNSTILE_ENABLED'] = 'false';

if (process.env.REDIS_URL) {
  const redisUrl = new URL(process.env.REDIS_URL);
  redisUrl.pathname = '/1';
  process.env.REDIS_URL = redisUrl.toString();
}

const PREFIX = 'e2e-cat12';
const ADMIN_EMAIL = `${PREFIX}-admin@brunyshop.test`;
const PASSWORD = 'E2eCat12!2026';
const BASE_URL = '/api/v1';

const HOUR = 60 * 60 * 1000;

describe('Promotions programmées (CAT-12)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: Redis | undefined;
  let adminToken: string;
  let categoryId: string;
  let brandId: string;

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
    const productWhere = { slug: { startsWith: PREFIX } };
    const variantWhere = { product: productWhere };
    await prisma.cartItem.deleteMany({ where: { variant: variantWhere } }).catch(() => {});
    await prisma.stockMovement.deleteMany({ where: { variant: variantWhere } }).catch(() => {});
    await prisma.auditLog
      .deleteMany({ where: { user: { email: { startsWith: PREFIX } } } })
      .catch(() => {});
    await prisma.productImage.deleteMany({ where: { product: productWhere } }).catch(() => {});
    await prisma.productVariant.deleteMany({ where: variantWhere }).catch(() => {});
    await prisma.product.deleteMany({ where: productWhere }).catch(() => {});
    await prisma.userRole
      .deleteMany({ where: { user: { email: { startsWith: PREFIX } } } })
      .catch(() => {});
    await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } }).catch(() => {});
    await prisma.category.deleteMany({ where: { slug: { startsWith: PREFIX } } }).catch(() => {});
    await prisma.brand.deleteMany({ where: { slug: { startsWith: PREFIX } } }).catch(() => {});
  }

  function adminRequest(method: 'post' | 'patch', path: string) {
    const server = request(app.getHttpServer());
    return server[method](`${BASE_URL}${path}`).set('Authorization', `Bearer ${adminToken}`);
  }

  function createPayload(slug: string, overrides: Record<string, unknown> = {}) {
    return {
      name: `Produit ${slug}`,
      slug,
      description: 'Description promotionnelle suffisamment longue.',
      categoryId,
      brandId,
      basePrice: 30000,
      status: 'PUBLISHED',
      variants: [{ color: 'NOIR', size: '42', stock: 10 }],
      ...overrides,
    };
  }

  // Date ISO décalée de `offsetMs` par rapport à maintenant.
  function iso(offsetMs: number): string {
    return new Date(Date.now() + offsetMs).toISOString();
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

    const hits = new Map<string, { totalHits: number; expiresAt: number }>();
    const memoryStorage = {
      increment: async (key: string, ttl: number, limit: number, blockDuration: number) => {
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

    prisma = app.get(PrismaService);
    redis = app.get(RedisService).redis;
    await cleanupDatabase();
    await clearThrottleCounters();

    const role = await prisma.role.findFirst({ where: { name: 'ADMIN' }, select: { id: true } });
    if (!role) throw new Error('Rôle ADMIN introuvable : exécutez le seed.');
    const user = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        passwordHash: await hash(PASSWORD),
        firstName: 'E2E',
        lastName: 'CAT12',
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
    adminToken = await app.get(JwtService).signAsync({
      sub: user.id,
      roles: ['ADMIN'],
      typ: 'access',
    });

    const category = await prisma.category.create({
      data: { name: 'CAT12', slug: `${PREFIX}-cat`, position: 120 },
      select: { id: true },
    });
    categoryId = category.id;
    const brand = await prisma.brand.create({
      data: { name: 'CAT12 Brand', slug: `${PREFIX}-brand` },
      select: { id: true },
    });
    brandId = brand.id;
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

  describe('validation admin (CA #1, #4)', () => {
    it('refuse un prix promo supérieur au prix de base', async () => {
      const response = await adminRequest('post', '/admin/products')
        .send(
          createPayload(`${PREFIX}-too-high`, {
            promoPrice: 35000,
            promoStart: iso(-HOUR),
            promoEnd: iso(HOUR),
          }),
        )
        .expect(400);
      expect(response.body.code).toBe('PROMO_PRICE_INVALID');
    });

    it('refuse une date de fin antérieure à la date de début', async () => {
      const response = await adminRequest('post', '/admin/products')
        .send(
          createPayload(`${PREFIX}-bad-window`, {
            promoPrice: 25000,
            promoStart: iso(HOUR),
            promoEnd: iso(-HOUR),
          }),
        )
        .expect(400);
      expect(response.body.code).toBe('PROMO_WINDOW_INVALID');
    });

    it('refuse un prix promo sans dates de programmation', async () => {
      const response = await adminRequest('post', '/admin/products')
        .send(createPayload(`${PREFIX}-no-dates`, { promoPrice: 25000 }))
        .expect(400);
      expect(response.body.code).toBe('PROMO_DATES_REQUIRED');
    });

    it('accepte une promotion complète et cohérente', async () => {
      await adminRequest('post', '/admin/products')
        .send(
          createPayload(`${PREFIX}-valid`, {
            promoPrice: 25000,
            promoStart: iso(-HOUR),
            promoEnd: iso(HOUR),
          }),
        )
        .expect(201);
    });
  });

  describe('calcul serveur du prix effectif (CA #2, #3)', () => {
    beforeAll(async () => {
      const windows: Array<[string, number, number]> = [
        ['active', -HOUR, HOUR],
        ['expired', -2 * HOUR, -HOUR],
        ['future', HOUR, 2 * HOUR],
      ];
      for (const [suffix, startOffset, endOffset] of windows) {
        await adminRequest('post', '/admin/products')
          .send(
            createPayload(`${PREFIX}-${suffix}`, {
              promoPrice: 25000,
              promoStart: iso(startOffset),
              promoEnd: iso(endOffset),
            }),
          )
          .expect(201);
      }
      await adminRequest('post', '/admin/products')
        .send(createPayload(`${PREFIX}-none`))
        .expect(201);
    });

    async function findItem(slug: string) {
      const response = await request(app.getHttpServer())
        .get(`${BASE_URL}/products?q=${slug}&limit=48`)
        .expect(200);
      const item = (response.body.items as Array<Record<string, unknown>>).find(
        (row) => row['slug'] === slug,
      );
      expect(item).toBeDefined();
      return item as Record<string, unknown>;
    }

    it('applique le prix promo quand la fenêtre est active', async () => {
      const item = await findItem(`${PREFIX}-active`);
      expect(item['isPromoActive']).toBe(true);
      expect(item['effectivePrice']).toBe(25000);
      expect(item['basePrice']).toBe(30000);
      expect(item['discountPercent']).toBe(17);
    });

    it('ignore une promotion expirée', async () => {
      const item = await findItem(`${PREFIX}-expired`);
      expect(item['isPromoActive']).toBe(false);
      expect(item['effectivePrice']).toBe(30000);
      expect(item['discountPercent']).toBeNull();
    });

    it('ignore une promotion future', async () => {
      const item = await findItem(`${PREFIX}-future`);
      expect(item['isPromoActive']).toBe(false);
      expect(item['effectivePrice']).toBe(30000);
    });

    it('retourne le prix de base sans promotion', async () => {
      const item = await findItem(`${PREFIX}-none`);
      expect(item['isPromoActive']).toBe(false);
      expect(item['effectivePrice']).toBe(30000);
      expect(item['promoPrice']).toBeNull();
    });

    it('filtre la liste sur les promotions actives', async () => {
      const response = await request(app.getHttpServer())
        .get(`${BASE_URL}/products?promo=true&limit=48`)
        .expect(200);
      const slugs = (response.body.items as Array<{ slug: string }>).map((row) => row.slug);
      expect(slugs).toContain(`${PREFIX}-active`);
      expect(slugs).not.toContain(`${PREFIX}-expired`);
      expect(slugs).not.toContain(`${PREFIX}-future`);
      expect(slugs).not.toContain(`${PREFIX}-none`);
    });

    it('expose le prix effectif et le pourcentage sur la fiche produit', async () => {
      const response = await request(app.getHttpServer())
        .get(`${BASE_URL}/products/${PREFIX}-active`)
        .expect(200);
      expect(response.body.isPromoActive).toBe(true);
      expect(response.body.effectivePrice).toBe(25000);
      expect(response.body.discountPercent).toBe(17);
      expect(response.body.variants[0].effectivePrice).toBe(25000);
    });
  });
});
