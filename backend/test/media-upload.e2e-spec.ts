// CAT-05 e2e — presign, confirm, delete, reorder, RBAC, audit and rate limit.
// MinIO is not available in CI: the storage provider is forced to `fake`.

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
import sharp from 'sharp';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { RedisService } from '../src/infrastructure/cache/cache.module';
import { PrismaService } from '../src/infrastructure/database/database.module';
import { FakeStorageProvider } from '../src/infrastructure/storage/providers/fake-storage.provider';
import {
  STORAGE_PROVIDER,
  type StorageProvider,
} from '../src/infrastructure/storage/providers/storage-provider.interface';

if (existsSync('../.env')) process.loadEnvFile('../.env');
process.env['TURNSTILE_ENABLED'] = 'false';

// Force the in-memory provider before AppModule/ConfigModule is imported.
process.env.STORAGE_PROVIDER = 'fake';
process.env.MEDIA_PUBLIC_URL = 'http://media.test/brunyshop-media';
process.env.STORAGE_MAX_FILE_SIZE_MB = '5';
process.env.STORAGE_MAX_IMAGES_PER_PRODUCT = '10';

if (process.env.REDIS_URL) {
  const redisUrl = new URL(process.env.REDIS_URL);
  redisUrl.pathname = '/1';
  process.env.REDIS_URL = redisUrl.toString();
}

const PREFIX = 'e2e-cat05';
const PASSWORD = 'E2eCat05!2026';
const BASE_URL = '/api/v1';
const ADMIN_EMAIL = `${PREFIX}-admin@brunyshop.test`;
const STOCK_EMAIL = `${PREFIX}-stock@brunyshop.test`;
const CUSTOMER_EMAIL = `${PREFIX}-customer@brunyshop.test`;
const SUPER_EMAIL = `${PREFIX}-super@brunyshop.test`;

const throttleHits = new Map<string, { totalHits: number; expiresAt: number }>();
function clearThrottle(): void {
  throttleHits.clear();
}

async function jpeg(width = 120, height = 80): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 10, g: 20, b: 30 } },
  })
    .jpeg()
    .toBuffer();
}

describe('Media upload (CAT-05)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: Redis | undefined;
  let storage: FakeStorageProvider;
  let adminToken: string;
  let stockToken: string;
  let customerToken: string;
  let superToken: string;
  let productId: string;
  let productSlug: string;
  let quotaProductId: string;
  let quotaProductSlug: string;

  async function clearRedis(): Promise<void> {
    if (!redis) return;
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', 'catalog:*', 'COUNT', 100);
      cursor = next;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== '0');
  }

  async function cleanupDatabase(): Promise<void> {
    const productWhere = { slug: { startsWith: PREFIX } };
    await prisma.auditLog.deleteMany({
      where: { OR: [{ user: { email: { startsWith: PREFIX } } }, { entityId: productId ?? '' }] },
    });
    await prisma.productImage.deleteMany({ where: { product: productWhere } });
    await prisma.cartItem.deleteMany({ where: { variant: { product: productWhere } } });
    await prisma.productVariant.deleteMany({ where: { product: productWhere } });
    await prisma.product.deleteMany({ where: productWhere });
    await prisma.userRole.deleteMany({ where: { user: { email: { startsWith: PREFIX } } } });
    await prisma.refreshToken.deleteMany({ where: { user: { email: { startsWith: PREFIX } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
    await prisma.category.deleteMany({ where: { slug: { startsWith: PREFIX } } });
    await prisma.brand.deleteMany({ where: { slug: { startsWith: PREFIX } } });
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

  async function makeProduct(slug: string, imageCount = 0): Promise<string> {
    const category = await prisma.category.upsert({
      where: { slug: `${PREFIX}-cat` },
      create: { name: 'CAT05', slug: `${PREFIX}-cat` },
      update: {},
      select: { id: true },
    });
    const brand = await prisma.brand.upsert({
      where: { slug: `${PREFIX}-brand` },
      create: { name: 'CAT05 Brand', slug: `${PREFIX}-brand` },
      update: {},
      select: { id: true },
    });
    const product = await prisma.product.create({
      data: {
        name: `Produit ${slug}`,
        slug,
        description: 'Produit de test CAT-05 suffisamment long.',
        categoryId: category.id,
        brandId: brand.id,
        basePrice: 25000,
        status: 'PUBLISHED',
        variants: {
          create: {
            sku: `${PREFIX}-${slug}-42-NOIR`,
            color: 'NOIR',
            size: '42',
            stock: 5,
            lowStockThreshold: 2,
          },
        },
      },
      select: { id: true },
    });
    if (imageCount > 0) {
      await prisma.productImage.createMany({
        data: Array.from({ length: imageCount }, (_, index) => ({
          productId: product.id,
          url: `http://media.test/brunyshop-media/products/${slug}/common/legacy-${index}.webp`,
          position: index,
        })),
      });
    }
    return product.id;
  }

  function presign(token: string | undefined, body: Record<string, unknown>): request.Test {
    const call = request(app.getHttpServer()).post(`${BASE_URL}/admin/media/presign`);
    if (token) call.set('Authorization', `Bearer ${token}`);
    return call.send(body);
  }

  function keyFor(slug: string, color = 'common', extension = 'jpg'): string {
    return `products/${slug}/${color}/${randomUUID()}.${extension}`;
  }

  function installFakeObject(key: string, buffer: Buffer): void {
    storage.putRaw(key, buffer, 'image/jpeg');
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
    storage = app.get<StorageProvider>(STORAGE_PROVIDER) as FakeStorageProvider;
    if (!(storage instanceof FakeStorageProvider)) {
      throw new Error('Le provider fake n’a pas été sélectionné pour les e2e.');
    }

    await cleanupDatabase();
    await clearRedis();
    clearThrottle();

    const adminId = await createUser(ADMIN_EMAIL, 'ADMIN');
    const stockId = await createUser(STOCK_EMAIL, 'STOCK_MANAGER');
    const customerId = await createUser(CUSTOMER_EMAIL, 'CUSTOMER');
    const superId = await createUser(SUPER_EMAIL, 'SUPER_ADMIN');
    const jwt = app.get(JwtService);
    adminToken = await jwt.signAsync({
      sub: adminId,
      email: ADMIN_EMAIL,
      roles: ['ADMIN'],
      typ: 'access',
    });
    stockToken = await jwt.signAsync({
      sub: stockId,
      email: STOCK_EMAIL,
      roles: ['STOCK_MANAGER'],
      typ: 'access',
    });
    customerToken = await jwt.signAsync({
      sub: customerId,
      email: CUSTOMER_EMAIL,
      roles: ['CUSTOMER'],
      typ: 'access',
    });
    superToken = await jwt.signAsync({
      sub: superId,
      email: SUPER_EMAIL,
      roles: ['SUPER_ADMIN'],
      typ: 'access',
    });

    productSlug = `${PREFIX}-product`;
    productId = await makeProduct(productSlug);
    quotaProductSlug = `${PREFIX}-quota`;
    quotaProductId = await makeProduct(quotaProductSlug, 10);
  });

  beforeEach(() => {
    clearThrottle();
  });

  afterAll(async () => {
    try {
      await cleanupDatabase();
      await clearRedis();
    } finally {
      await app?.close();
    }
  });

  it('refuse le presign sans JWT (401)', async () => {
    await presign(undefined, {
      productSlug,
      contentType: 'image/jpeg',
      declaredSize: 1024,
    }).expect(401);
  });

  it('refuse le presign avec le rôle CUSTOMER (403)', async () => {
    await presign(customerToken, {
      productSlug,
      contentType: 'image/jpeg',
      declaredSize: 1024,
    }).expect(403);
  });

  it('accepte STOCK_MANAGER, ADMIN et SUPER_ADMIN (200)', async () => {
    for (const token of [stockToken, adminToken, superToken]) {
      const response = await presign(token, {
        productSlug,
        contentType: 'image/jpeg',
        declaredSize: 1024,
      }).expect(200);
      expect(response.body).toMatchObject({
        key: expect.stringContaining(`products/${productSlug}/common/`),
        publicUrl: expect.stringContaining('http://media.test/brunyshop-media/'),
        expiresIn: 300,
        method: 'PUT',
      });
    }
  });

  it('refuse un contentType PDF au presign (400 INVALID_IMAGE_TYPE)', async () => {
    const response = await presign(adminToken, {
      productSlug,
      contentType: 'application/pdf',
      declaredSize: 1024,
    }).expect(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(response.body)).toContain('Format non autorisé');
  });

  it('refuse une taille déclarée supérieure à 5 Mo (400 FILE_TOO_LARGE)', async () => {
    const response = await presign(adminToken, {
      productSlug,
      contentType: 'image/jpeg',
      declaredSize: 6 * 1024 * 1024,
    }).expect(400);
    expect(JSON.stringify(response.body)).toContain('FILE_TOO_LARGE');
  });

  it('renvoie 404 pour un produit inexistant', async () => {
    const response = await presign(adminToken, {
      productSlug: `${PREFIX}-absent`,
      contentType: 'image/jpeg',
      declaredSize: 1024,
    }).expect(404);
    expect(response.body.code).toBe('PRODUCT_NOT_FOUND');
  });

  it('refuse un produit ayant atteint 10 images (400 MAX_IMAGES_REACHED)', async () => {
    const response = await presign(adminToken, {
      productSlug: quotaProductSlug,
      contentType: 'image/jpeg',
      declaredSize: 1024,
    }).expect(400);
    expect(response.body.code).toBe('MAX_IMAGES_REACHED');
  });

  it('rejette un body de presign vide (400)', async () => {
    await presign(adminToken, {}).expect(400);
  });

  it('confirme une image valide, crée ProductImage et invalide le cache', async () => {
    await request(app.getHttpServer()).get(`${BASE_URL}/products/${productSlug}`).expect(200);

    const presigned = await presign(adminToken, {
      productSlug,
      variantColor: 'noir',
      contentType: 'image/jpeg',
      declaredSize: 1024,
    }).expect(200);
    const key = presigned.body.key as string;
    installFakeObject(key, await jpeg());

    const response = await request(app.getHttpServer())
      .post(`${BASE_URL}/admin/media/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ key, productSlug, variantColor: 'noir', alt: 'Vue de face' })
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      url: expect.stringMatching(/\.webp$/),
      thumbnailUrl: expect.stringMatching(/-thumb\.webp$/),
      alt: 'Vue de face',
      variantColor: 'NOIR',
    });
    // The optimized JPEG replaces the raw file (same .jpg key).
    expect(await storage.exists(key)).toBe(true);
    expect(await storage.exists(key.replace(/\.jpg$/, '.webp'))).toBe(true);
    expect(await storage.exists(key.replace(/\.jpg$/, '-thumb.webp'))).toBe(true);

    const publicDetail = await request(app.getHttpServer())
      .get(`${BASE_URL}/products/${productSlug}`)
      .expect(200);
    expect(JSON.stringify(publicDetail.body.images)).toContain(response.body.url);
  });

  it('refuse un PDF à la confirmation, supprime le brut et audite le rejet', async () => {
    const presigned = await presign(adminToken, {
      productSlug,
      contentType: 'image/jpeg',
      declaredSize: 1024,
    }).expect(200);
    const key = presigned.body.key as string;
    storage.putRaw(key, Buffer.from('%PDF-1.7\nfake pdf'), 'image/jpeg');

    const response = await request(app.getHttpServer())
      .post(`${BASE_URL}/admin/media/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ key, productSlug })
      .expect(400);

    expect(response.body.code).toBe('INVALID_IMAGE_TYPE');
    expect(await storage.exists(key)).toBe(false);
    expect(await prisma.productImage.count({ where: { productId } })).toBeGreaterThan(0);
    const rejected = await prisma.auditLog.findFirst({
      where: { action: 'MEDIA_UPLOAD_REJECTED', entityId: productId },
    });
    expect(rejected).not.toBeNull();
  });

  it('renvoie 404 quand le fichier confirmé est absent du stockage', async () => {
    const response = await request(app.getHttpServer())
      .post(`${BASE_URL}/admin/media/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ key: keyFor(productSlug), productSlug })
      .expect(404);
    expect(response.body.code).toBe('MEDIA_NOT_FOUND');
  });

  it('refuse une clé appartenant à un autre produit (400 INVALID_MEDIA_KEY)', async () => {
    const response = await request(app.getHttpServer())
      .post(`${BASE_URL}/admin/media/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ key: keyFor(`${PREFIX}-autre`), productSlug })
      .expect(400);
    expect(response.body.code).toBe('INVALID_MEDIA_KEY');
  });

  it('refuse un fichier réel supérieur à 5 Mo (400 FILE_TOO_LARGE)', async () => {
    const presigned = await presign(adminToken, {
      productSlug,
      contentType: 'image/jpeg',
      declaredSize: 1024,
    }).expect(200);
    const key = presigned.body.key as string;
    storage.putRaw(key, Buffer.alloc(5 * 1024 * 1024 + 1, 1), 'image/jpeg');

    const response = await request(app.getHttpServer())
      .post(`${BASE_URL}/admin/media/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ key, productSlug })
      .expect(400);
    expect(response.body.code).toBe('FILE_TOO_LARGE');
    expect(await storage.exists(key)).toBe(false);
  });

  it('réorganise les images puis supprime une image avec invalidation du cache', async () => {
    const images = await prisma.productImage.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, url: true },
    });
    expect(images.length).toBeGreaterThanOrEqual(1);

    const reorder = await request(app.getHttpServer())
      .patch(`${BASE_URL}/admin/media/images/reorder`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        productId,
        order: images.map((image, index) => ({ id: image.id, position: images.length - index })),
      })
      .expect(200);
    expect(reorder.body.updated).toBe(images.length);

    const target = images[0]!;
    await request(app.getHttpServer())
      .delete(`${BASE_URL}/admin/media/images/${target.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    const remaining = await prisma.productImage.findUnique({ where: { id: target.id } });
    expect(remaining).toBeNull();
    const publicDetail = await request(app.getHttpServer())
      .get(`${BASE_URL}/products/${productSlug}`)
      .expect(200);
    expect(JSON.stringify(publicDetail.body.images)).not.toContain(target.url);
  });

  it('renvoie 404 à la suppression d’une image inconnue', async () => {
    const response = await request(app.getHttpServer())
      .delete(`${BASE_URL}/admin/media/images/${randomUUID()}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
    expect(response.body.code).toBe('IMAGE_NOT_FOUND');
  });

  it('refuse le réordonnancement d’une image étrangère au produit (400)', async () => {
    const foreign = await prisma.productImage.findFirst({
      where: { productId: quotaProductId },
      select: { id: true },
    });
    const response = await request(app.getHttpServer())
      .patch(`${BASE_URL}/admin/media/images/reorder`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId, order: [{ id: foreign!.id, position: 0 }] })
      .expect(400);
    expect(response.body.code).toBe('INVALID_IMAGE_ORDER');
  });

  it('trace MEDIA_UPLOADED après une confirmation réussie', async () => {
    const uploaded = await prisma.auditLog.findFirst({
      where: { action: 'MEDIA_UPLOADED', entityId: { not: productId } },
      orderBy: { createdAt: 'desc' },
    });
    expect(uploaded).not.toBeNull();
    expect(uploaded?.entity).toBe('ProductImage');
  });

  it('applique le rate limit de 30 presigns par minute (429)', async () => {
    clearThrottle();
    for (let index = 0; index < 30; index += 1) {
      await presign(adminToken, {
        productSlug,
        contentType: 'image/jpeg',
        declaredSize: 1024,
      }).expect(200);
    }
    await presign(adminToken, {
      productSlug,
      contentType: 'image/jpeg',
      declaredSize: 1024,
    }).expect(429);
  });
});
