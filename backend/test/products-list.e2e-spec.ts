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
process.env['TURNSTILE_ENABLED'] = 'false';

const PREFIX = 'e2e-cat02';
const IN_STOCK = `${PREFIX}-in-stock`;
const OUT_OF_STOCK = `${PREFIX}-out-of-stock`;
const PLAIN = `${PREFIX}-plain`;
const DRAFT = `${PREFIX}-draft`;
const BRAND_A = `${PREFIX}-brand-a`;
const BRAND_B = `${PREFIX}-brand-b`;
const CATEGORY = `${PREFIX}-sneakers`;

describe('GET /api/v1/products (CAT-02)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cache: CatalogCacheService;
  let redis: Redis | undefined;
  let categoryId: string;
  let brandAId: string;
  let brandBId: string;
  let baseUrl: string;

  async function clearThrottleCounters(): Promise<void> {
    if (!redis) return;
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', '*:default}:*', 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== '0');
  }

  async function createProduct(options: {
    slug: string;
    brandId: string;
    basePrice: number;
    promoPrice?: number | null;
    promoStart?: Date | null;
    promoEnd?: Date | null;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    variants: Array<{ size: string; color: string; stock: number; reservedStock?: number }>;
  }): Promise<void> {
    const product = await prisma.product.create({
      data: {
        slug: options.slug,
        name: `Produit ${options.slug}`,
        description: `Description ${options.slug}.`,
        categoryId,
        brandId: options.brandId,
        basePrice: options.basePrice,
        promoPrice: options.promoPrice ?? null,
        promoStart: options.promoStart ?? null,
        promoEnd: options.promoEnd ?? null,
        status: options.status ?? 'PUBLISHED',
      },
    });
    await prisma.productVariant.createMany({
      data: options.variants.map((variant) => ({
        productId: product.id,
        sku: `${options.slug}-${variant.size}-${variant.color}`,
        size: variant.size,
        color: variant.color,
        stock: variant.stock,
        reservedStock: variant.reservedStock ?? 0,
      })),
    });
  }

  function list(query: string) {
    return request(app.getHttpServer()).get(`${baseUrl}/products?${query}`);
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
    redis = app.get(RedisService).redis;
    await cache.invalidateProducts();
    await clearThrottleCounters();

    const category = await prisma.category.create({
      data: { name: 'E2E CAT02', slug: CATEGORY, position: 98 },
    });
    categoryId = category.id;
    const brandA = await prisma.brand.create({
      data: { name: 'E2E Brand A', slug: BRAND_A },
    });
    brandAId = brandA.id;
    const brandB = await prisma.brand.create({
      data: { name: 'E2E Brand B', slug: BRAND_B },
    });
    brandBId = brandB.id;

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    await createProduct({
      slug: IN_STOCK,
      brandId: brandAId,
      basePrice: 30000,
      promoPrice: 24000,
      promoStart: new Date(now - day),
      promoEnd: new Date(now + day),
      variants: [
        // 5 physiques, 2 réservés => 3 disponibles.
        { size: '40', color: 'NOIR', stock: 5, reservedStock: 2 },
        // Pointure 42 épuisée dans cette couleur.
        { size: '42', color: 'NOIR', stock: 0 },
        { size: '41', color: 'BLANC', stock: 0 },
      ],
    });
    await createProduct({
      slug: OUT_OF_STOCK,
      brandId: brandAId,
      basePrice: 28000,
      variants: [{ size: '40', color: 'NOIR', stock: 4, reservedStock: 4 }],
    });
    await createProduct({
      slug: PLAIN,
      brandId: brandBId,
      basePrice: 20000,
      variants: [{ size: '42', color: 'BLEU', stock: 2 }],
    });
    await createProduct({
      slug: DRAFT,
      brandId: brandAId,
      basePrice: 15000,
      status: 'DRAFT',
      variants: [{ size: '40', color: 'NOIR', stock: 10 }],
    });
  });

  afterAll(async () => {
    try {
      if (prisma) {
        await prisma.product.deleteMany({ where: { slug: { startsWith: PREFIX } } });
        await prisma.category.deleteMany({ where: { slug: CATEGORY } });
        await prisma.brand.deleteMany({ where: { slug: { in: [BRAND_A, BRAND_B] } } });
      }
      if (cache) await cache.invalidateProducts();
      await clearThrottleCounters();
    } finally {
      await app?.close();
    }
  });

  it('renvoie items, pagination et facettes avec availableStock uniquement', async () => {
    const response = await list(`brand=${BRAND_A}&limit=10`).expect(200);

    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('pagination');
    expect(response.body).toHaveProperty('facets');

    const inStock = response.body.items.find((item: { slug: string }) => item.slug === IN_STOCK);
    expect(inStock.inStock).toBe(true);
    expect(inStock.effectivePrice).toBe(24000);
    expect(inStock.isPromoActive).toBe(true);
    const noir40 = inStock.variants.find((variant: { size: string }) => variant.size === '40');
    expect(noir40.availableStock).toBe(3);
    expect(noir40.isAvailable).toBe(true);

    const serialized = JSON.stringify(response.body.items);
    expect(serialized).not.toContain('"stock":');
    expect(serialized).not.toContain('reservedStock');
  });

  it('filtre par marque et exclut les brouillons', async () => {
    const response = await list(`brand=${BRAND_A}&limit=10`).expect(200);
    const slugs = response.body.items.map((item: { slug: string }) => item.slug);

    expect(slugs).toEqual(expect.arrayContaining([IN_STOCK, OUT_OF_STOCK]));
    expect(slugs).not.toContain(PLAIN);
    expect(slugs).not.toContain(DRAFT);

    const brandB = await list(`brand=${BRAND_B}&limit=10`).expect(200);
    expect(brandB.body.items.map((item: { slug: string }) => item.slug)).toEqual([PLAIN]);
  });

  it('filtre sur la disponibilité réelle (stock - réservé)', async () => {
    const inStock = await list(`brand=${BRAND_A}&inStock=true&limit=10`).expect(200);
    expect(inStock.body.items.map((item: { slug: string }) => item.slug)).toEqual([IN_STOCK]);

    const outOfStock = await list(`brand=${BRAND_A}&inStock=false&limit=10`).expect(200);
    expect(outOfStock.body.items.map((item: { slug: string }) => item.slug)).toEqual([
      OUT_OF_STOCK,
    ]);
  });

  it('filtre sur la promotion active', async () => {
    const promo = await list(`brand=${BRAND_A}&promo=true&limit=10`).expect(200);
    expect(promo.body.items.map((item: { slug: string }) => item.slug)).toEqual([IN_STOCK]);

    const withoutPromo = await list(`brand=${BRAND_A}&promo=false&limit=10`).expect(200);
    expect(withoutPromo.body.items.map((item: { slug: string }) => item.slug)).toEqual([
      OUT_OF_STOCK,
    ]);
  });

  it('ignore les variantes épuisées dans les filtres pointure/couleur', async () => {
    const response = await list('size=42&color=NOIR&limit=48').expect(200);
    const slugs = response.body.items.map((item: { slug: string }) => item.slug);

    // La pointure 42 NOIR du produit IN_STOCK est épuisée : elle ne doit pas le faire remonter.
    expect(slugs).not.toContain(IN_STOCK);
    // La pointure 42 BLEU du produit PLAIN est disponible mais la couleur demandée est NOIR.
    expect(slugs).not.toContain(PLAIN);
  });

  it('calcule les facettes sur tout le catalogue publié', async () => {
    const response = await list('limit=1').expect(200);
    const { facets, pagination } = response.body;

    const brandA = facets.brands.find((facet: { slug: string }) => facet.slug === BRAND_A);
    const brandB = facets.brands.find((facet: { slug: string }) => facet.slug === BRAND_B);
    expect(brandA).toMatchObject({ name: 'E2E Brand A', count: 2 });
    expect(brandB).toMatchObject({ name: 'E2E Brand B', count: 1 });
    expect(brandA).not.toHaveProperty('logo');

    const category = facets.categories.find((facet: { slug: string }) => facet.slug === CATEGORY);
    expect(category).toMatchObject({ name: 'E2E CAT02', count: 3 });

    // Les facettes couvrent tout le catalogue, pas seulement les 1 items de la page.
    expect(facets.availability.inStock + facets.availability.outOfStock).toBe(pagination.total);

    const size40 = facets.sizes.find((facet: { value: string }) => facet.value === '40');
    // IN_STOCK (3 dispo) + OUT_OF_STOCK (0) + DRAFT exclu : seul IN_STOCK compte.
    expect(size40.count).toBeGreaterThanOrEqual(1);
    expect(facets.promotion.active).toBeGreaterThanOrEqual(1);
    expect(facets.price.max).toBeGreaterThanOrEqual(30000);
    expect(facets.price.min).toBeGreaterThan(0);
  });

  it('pagine les résultats', async () => {
    const first = await list('limit=1&page=1&sort=price_asc').expect(200);
    const second = await list('limit=1&page=2&sort=price_asc').expect(200);

    expect(first.body.pagination).toMatchObject({ page: 1, limit: 1 });
    expect(first.body.pagination.pages).toBeGreaterThan(1);
    expect(first.body.items[0].slug).not.toBe(second.body.items[0].slug);
  });

  it('rejette une valeur de filtre booléen invalide', async () => {
    const response = await list('inStock=maybe').expect(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('sert la liste depuis le cache puis l’invalide', async () => {
    const query = `brand=${BRAND_A}&limit=10&sort=price_asc`;
    await list(query).expect(200);
    await prisma.product.update({ where: { slug: IN_STOCK }, data: { basePrice: 31000 } });

    const cached = await list(query).expect(200);
    const cachedItem = cached.body.items.find((item: { slug: string }) => item.slug === IN_STOCK);
    expect(cachedItem.basePrice).toBe(30000);

    await cache.invalidateProducts();
    const fresh = await list(query).expect(200);
    const freshItem = fresh.body.items.find((item: { slug: string }) => item.slug === IN_STOCK);
    expect(freshItem.basePrice).toBe(31000);

    await prisma.product.update({ where: { slug: IN_STOCK }, data: { basePrice: 30000 } });
    await cache.invalidateProducts();
  });

  it('ne casse pas la fiche produit (routes distinctes)', async () => {
    const response = await request(app.getHttpServer())
      .get(`${baseUrl}/products/${PLAIN}`)
      .expect(200);
    expect(response.body).toMatchObject({ slug: PLAIN, basePrice: 20000 });
    expect(response.body.sizes).toEqual([
      { size: '42', availableStock: 2, isAvailable: true, isLowStock: true },
    ]);
  });
});
