import { existsSync } from 'node:fs';
import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import type Redis from 'ioredis';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { RedisService } from '../src/infrastructure/cache/cache.module';
import { PrismaService } from '../src/infrastructure/database/database.module';
import { CatalogCacheService } from '../src/modules/catalog/cache/catalog-cache.service';

if (existsSync('../.env')) process.loadEnvFile('../.env');

const PREFIX = 'e2e-cat03';
const MAIN = `${PREFIX}-main`;
const EXPIRED = `${PREFIX}-expired`;
const FUTURE = `${PREFIX}-future`;
const DRAFT = `${PREFIX}-draft`;
const ARCHIVED = `${PREFIX}-archived`;
const DELETED = `${PREFIX}-deleted`;
const LONELY = `${PREFIX}-lonely`;

interface FixtureOptions {
  slug: string;
  basePrice?: number;
  promoPrice?: number | null;
  promoStart?: Date | null;
  promoEnd?: Date | null;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  deletedAt?: Date | null;
}

describe('GET /api/v1/products/:slug (CAT-03)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cache: CatalogCacheService;
  let categoryId: string;
  let brandId: string;
  let baseUrl: string;
  let redis: Redis | undefined;

  // Rate-limit counters live in Redis for 60 s and are shared by IP: clear them
  // so the suite neither inherits a previous run nor blocks the next one.
  async function clearThrottleCounters(): Promise<void> {
    if (!redis) return;
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', '*:default}:*', 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== '0');
  }

  async function createProduct(options: FixtureOptions): Promise<void> {
    await prisma.product.create({
      data: {
        slug: options.slug,
        name: `Produit ${options.slug}`,
        description: `Description complète de ${options.slug}.`,
        categoryId,
        brandId,
        basePrice: options.basePrice ?? 30000,
        promoPrice: options.promoPrice ?? null,
        promoStart: options.promoStart ?? null,
        promoEnd: options.promoEnd ?? null,
        status: options.status ?? 'PUBLISHED',
        deletedAt: options.deletedAt ?? null,
      },
    });
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
    baseUrl = '/api/v1';

    prisma = app.get(PrismaService);
    cache = app.get(CatalogCacheService);
    await cache.invalidateProducts();

    redis = app.get(RedisService).redis;
    await clearThrottleCounters();

    const category = await prisma.category.create({
      data: { name: 'E2E CAT03', slug: `${PREFIX}-sneakers`, position: 99 },
    });
    categoryId = category.id;
    const brand = await prisma.brand.create({
      data: { name: 'E2E CAT03 Brand', slug: `${PREFIX}-brand` },
    });
    brandId = brand.id;

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    // Produit principal : promo active, deux couleurs, stock réservé.
    const main = await prisma.product.create({
      data: {
        slug: MAIN,
        name: 'Sneakers E2E Cat03',
        description: 'Fiche complète : images par couleur, variantes, stock réservé.',
        seoTitle: 'Sneakers E2E',
        seoDescription: 'Description SEO de la fiche E2E.',
        categoryId,
        brandId,
        basePrice: 30000,
        promoPrice: 24000,
        promoStart: new Date(now - day),
        promoEnd: new Date(now + day),
        status: 'PUBLISHED',
      },
    });
    await prisma.productImage.createMany({
      data: [
        {
          productId: main.id,
          url: 'https://cdn.e2e/common.jpg',
          alt: 'vue commune',
          position: 0,
          variantColor: null,
        },
        {
          productId: main.id,
          url: 'https://cdn.e2e/noir.jpg',
          alt: 'vue noir',
          position: 1,
          variantColor: 'NOIR',
        },
      ],
    });
    await prisma.productVariant.createMany({
      data: [
        // NOIR 40 : 10 physiques, 4 réservés => 6 disponibles.
        {
          productId: main.id,
          sku: `${PREFIX}-NOIR-40`,
          color: 'NOIR',
          size: '40',
          stock: 10,
          reservedStock: 4,
          lowStockThreshold: 5,
        },
        // NOIR 42 : épuisé.
        {
          productId: main.id,
          sku: `${PREFIX}-NOIR-42`,
          color: 'NOIR',
          size: '42',
          stock: 0,
          reservedStock: 0,
          lowStockThreshold: 5,
        },
        // BLANC 41 : entièrement réservé => disponible 0 (plancher).
        {
          productId: main.id,
          sku: `${PREFIX}-BLANC-41`,
          color: 'BLANC',
          size: '41',
          stock: 3,
          reservedStock: 3,
          lowStockThreshold: 5,
        },
        // BLANC 42 : override de prix, la promo produit ne s'applique pas.
        {
          productId: main.id,
          sku: `${PREFIX}-BLANC-42`,
          color: 'BLANC',
          size: '42',
          price: 27000,
          stock: 2,
          reservedStock: 0,
          lowStockThreshold: 5,
        },
      ],
    });

    await createProduct({
      slug: EXPIRED,
      promoPrice: 24000,
      promoStart: new Date(now - 2 * day),
      promoEnd: new Date(now - day),
    });
    await createProduct({
      slug: FUTURE,
      promoPrice: 24000,
      promoStart: new Date(now + day),
      promoEnd: new Date(now + 2 * day),
    });
    await createProduct({ slug: DRAFT, status: 'DRAFT' });
    await createProduct({ slug: ARCHIVED, status: 'ARCHIVED' });
    await createProduct({ slug: DELETED, deletedAt: new Date() });

    // Similaires : trois produits dans la fenêtre ±50 % (15 000–45 000)…
    await createProduct({ slug: `${PREFIX}-similar-1`, basePrice: 28000 });
    await createProduct({ slug: `${PREFIX}-similar-2`, basePrice: 31000 });
    await createProduct({ slug: `${PREFIX}-similar-3`, basePrice: 22000 });
    // …et un produit hors gamme de prix.
    await createProduct({ slug: `${PREFIX}-out-of-range`, basePrice: 90000 });
    // Produit isolé sur son prix : déclenche le fallback sans contrainte.
    await createProduct({ slug: LONELY, basePrice: 8000 });
  });

  afterAll(async () => {
    try {
      if (prisma) {
        await prisma.product.deleteMany({ where: { slug: { startsWith: PREFIX } } });
        await prisma.category.deleteMany({ where: { slug: `${PREFIX}-sneakers` } });
        await prisma.brand.deleteMany({ where: { slug: `${PREFIX}-brand` } });
      }
      if (cache) await cache.invalidateProducts();
      await clearThrottleCounters();
    } finally {
      await app?.close();
    }
  });

  function getDetail(slug: string) {
    return request(app.getHttpServer()).get(`${baseUrl}/products/${slug}`);
  }

  it('renvoie la fiche complète d’un produit publié', async () => {
    const response = await getDetail(MAIN).expect(200);
    expect(response.body).toMatchObject({
      slug: MAIN,
      name: 'Sneakers E2E Cat03',
      description: expect.stringContaining('Fiche complète'),
      seoTitle: 'Sneakers E2E',
      category: { id: categoryId, slug: `${PREFIX}-sneakers` },
      brand: { id: brandId, slug: `${PREFIX}-brand` },
      basePrice: 30000,
      effectivePrice: 24000,
      promoPrice: 24000,
      isPromoActive: true,
      inStock: true,
    });
    expect(response.body.images).toHaveLength(2);
    expect(response.body.variants).toHaveLength(4);
    expect(Array.isArray(response.body.similarProducts)).toBe(true);
  });

  it('expose le stock disponible et jamais le stock brut', async () => {
    const response = await getDetail(MAIN).expect(200);
    const noir40 = response.body.variants.find(
      (variant: { sku: string }) => variant.sku === `${PREFIX}-NOIR-40`,
    );
    expect(noir40.availableStock).toBe(6);

    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain('"stock":');
    expect(serialized).not.toContain('reservedStock');
    expect(serialized).toContain('"availableStock":6');
  });

  it('plancher à 0 pour une variante entièrement réservée', async () => {
    const response = await getDetail(MAIN).expect(200);
    const blanc41 = response.body.variants.find(
      (variant: { sku: string }) => variant.sku === `${PREFIX}-BLANC-41`,
    );
    expect(blanc41.availableStock).toBe(0);
    expect(blanc41.isAvailable).toBe(false);
  });

  it('groupe les variantes par couleur avec images spécifiques + communes', async () => {
    const response = await getDetail(MAIN).expect(200);
    const noir = response.body.colors.find((color: { color: string }) => color.color === 'NOIR');
    expect(noir).toMatchObject({ slug: 'noir', availableSizes: ['40'], hasStock: true });
    expect(noir.images.map((image: { url: string }) => image.url)).toEqual([
      'https://cdn.e2e/noir.jpg',
      'https://cdn.e2e/common.jpg',
    ]);
    const blanc = response.body.colors.find((color: { color: string }) => color.color === 'BLANC');
    expect(blanc).toMatchObject({ availableSizes: ['42'], hasStock: true });
  });

  it('agrège les pointures toutes couleurs confondues', async () => {
    const response = await getDetail(MAIN).expect(200);
    expect(response.body.sizes.map((size: { size: string }) => size.size)).toEqual([
      '40',
      '41',
      '42',
    ]);
    const size42 = response.body.sizes.find((size: { size: string }) => size.size === '42');
    expect(size42.availableStock).toBe(2);
    expect(size42.isAvailable).toBe(true);
  });

  it('applique la promo active, sauf override de variante', async () => {
    const response = await getDetail(MAIN).expect(200);
    expect(response.body.effectivePrice).toBe(24000);
    const blanc42 = response.body.variants.find(
      (variant: { sku: string }) => variant.sku === `${PREFIX}-BLANC-42`,
    );
    expect(blanc42.effectivePrice).toBe(27000);
  });

  it('ignore une promo expirée', async () => {
    const response = await getDetail(EXPIRED).expect(200);
    expect(response.body.isPromoActive).toBe(false);
    expect(response.body.promoPrice).toBeNull();
    expect(response.body.effectivePrice).toBe(30000);
  });

  it('ignore une promo future', async () => {
    const response = await getDetail(FUTURE).expect(200);
    expect(response.body.isPromoActive).toBe(false);
    expect(response.body.effectivePrice).toBe(30000);
  });

  it('renvoie le même 404 pour un slug inconnu, DRAFT, ARCHIVED ou supprimé', async () => {
    const unknown = await getDetail('e2e-cat03-inconnu').expect(404);
    for (const slug of [DRAFT, ARCHIVED, DELETED]) {
      const response = await getDetail(slug).expect(404);
      expect({
        statusCode: response.body.statusCode,
        code: response.body.code,
        message: response.body.message,
      }).toEqual({
        statusCode: unknown.body.statusCode,
        code: unknown.body.code,
        message: unknown.body.message,
      });
    }
    expect(unknown.body.code).toBe('PRODUCT_NOT_FOUND');
    expect(unknown.body.message).toBe('Produit introuvable.');
  });

  it('renvoie 400 VALIDATION_ERROR pour un slug non kebab-case', async () => {
    const response = await getDetail('INVALID_SLUG').expect(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('renvoie des produits similaires de la même catégorie dans la fenêtre de prix', async () => {
    const response = await getDetail(MAIN).expect(200);
    const slugs = response.body.similarProducts.map((item: { slug: string }) => item.slug);

    expect(slugs).not.toContain(MAIN);
    expect(slugs).toContain(`${PREFIX}-similar-1`);
    expect(slugs).toContain(`${PREFIX}-similar-2`);
    expect(slugs).toContain(`${PREFIX}-similar-3`);
    expect(slugs).not.toContain(`${PREFIX}-out-of-range`);
    expect(response.body.similarProducts.length).toBeLessThanOrEqual(6);
    for (const item of response.body.similarProducts) {
      expect(item.category.id).toBe(categoryId);
      expect(item.inStock).toBe(false);
    }
  });

  it('bascule sur la catégorie sans contrainte de prix quand la fenêtre est vide', async () => {
    const response = await getDetail(LONELY).expect(200);
    expect(response.body.similarProducts.length).toBeGreaterThan(0);
    expect(
      response.body.similarProducts.every(
        (item: { category: { id: string } }) => item.category.id === categoryId,
      ),
    ).toBe(true);
  });

  it('sert la deuxième requête depuis le cache, puis l’invalide', async () => {
    await getDetail(MAIN).expect(200);
    await prisma.product.update({ where: { slug: MAIN }, data: { basePrice: 31000 } });

    // Toujours l'ancienne valeur : la fiche vient du cache Redis.
    const cached = await getDetail(MAIN).expect(200);
    expect(cached.body.basePrice).toBe(30000);

    await cache.invalidateProducts();
    const fresh = await getDetail(MAIN).expect(200);
    expect(fresh.body.basePrice).toBe(31000);

    await prisma.product.update({ where: { slug: MAIN }, data: { basePrice: 30000 } });
    await cache.invalidateProducts();
  });

  it('ne capture pas la liste CAT-01 (ordre des routes)', async () => {
    const response = await request(app.getHttpServer())
      .get(`${baseUrl}/products?page=1&limit=2`)
      .expect(200);
    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('pagination');
  });

  it('limite la fiche produit à 100 requêtes par minute et par IP', async () => {
    let limited = false;
    for (let attempt = 0; attempt < 110 && !limited; attempt += 1) {
      const response = await getDetail(MAIN);
      if (response.status === 429) {
        limited = true;
        expect(response.body.statusCode).toBe(429);
        expect(response.body.code).toBe('RATE_LIMITED');
      }
    }
    expect(limited).toBe(true);
  });
});
