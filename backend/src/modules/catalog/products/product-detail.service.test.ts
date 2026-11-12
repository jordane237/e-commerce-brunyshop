import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../../../infrastructure/database/database.module';
import { CatalogCacheService } from '../cache/catalog-cache.service';
import { ProductDetailService } from './product-detail.service';

const NOW = new Date('2026-11-09T12:00:00.000Z');

interface VariantFixture {
  id: string;
  sku: string;
  size: string;
  color: string;
  price: number | null;
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
}

interface ProductFixture {
  id: string;
  name: string;
  slug: string;
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
  categoryId: string;
  basePrice: number;
  promoPrice: number | null;
  promoStart: Date | null;
  promoEnd: Date | null;
  createdAt: Date;
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string; slug: string; logo: string | null };
  images: Array<{
    id: string;
    url: string;
    alt: string | null;
    position: number;
    variantColor: string | null;
  }>;
  variants: VariantFixture[];
}

function variant(overrides: Partial<VariantFixture> = {}): VariantFixture {
  return {
    id: 'v1',
    sku: 'BARF-SNEAKERSUR-42-NOIR',
    size: '42',
    color: 'NOIR',
    price: null,
    stock: 10,
    reservedStock: 0,
    lowStockThreshold: 5,
    ...overrides,
  };
}

function product(overrides: Partial<ProductFixture> = {}): ProductFixture {
  return {
    id: 'p1',
    name: 'Sneakers UrbanStep Air',
    slug: 'sneakers-urbanstep-air',
    description: 'Sneakers légères à semelle amortissante.',
    seoTitle: null,
    seoDescription: null,
    categoryId: 'c1',
    basePrice: 30000,
    promoPrice: null,
    promoStart: null,
    promoEnd: null,
    createdAt: NOW,
    category: { id: 'c1', name: 'Sneakers', slug: 'sneakers' },
    brand: { id: 'b1', name: 'Barrage Foot', slug: 'barrage-foot', logo: null },
    images: [
      { id: 'i1', url: 'https://cdn.test/1.jpg', alt: 'vue 1', position: 0, variantColor: null },
      { id: 'i2', url: 'https://cdn.test/2.jpg', alt: 'vue 2', position: 1, variantColor: null },
    ],
    variants: [variant()],
    ...overrides,
  };
}

function makeService() {
  const prisma = {
    product: {
      findFirst: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
  const cache = {
    getProductDetail: vi.fn().mockResolvedValue(null),
    setProductDetail: vi.fn().mockResolvedValue(undefined),
    invalidateProducts: vi.fn().mockResolvedValue(undefined),
  };
  const config = {
    get: vi.fn((key: string) => (key === 'app.catalog.similarProductsLimit' ? 6 : 300)),
  };
  const service = new ProductDetailService(
    prisma as unknown as PrismaService,
    cache as unknown as CatalogCacheService,
    config as unknown as ConfigService,
  );
  return { service, prisma, cache, config };
}

async function expectUniformNotFound(service: ProductDetailService, slug: string) {
  const error = await service.getProductDetail(slug).catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(NotFoundException);
  expect((error as NotFoundException).getResponse()).toEqual({
    code: 'PRODUCT_NOT_FOUND',
    message: 'Produit introuvable.',
  });
}

describe('ProductDetailService — 404 uniforme', () => {
  it('renvoie le même 404 pour un slug inconnu, DRAFT, ARCHIVED ou supprimé', async () => {
    const { service, prisma } = makeService();
    prisma.product.findFirst.mockResolvedValue(null);

    for (const slug of ['inconnu', 'brouillon', 'archive', 'supprime']) {
      await expectUniformNotFound(service, slug);
    }

    // Le filtre PUBLISHED + deletedAt null est bien poussé en base : le statut
    // réel du produit n'est jamais chargé ni révélé.
    expect(prisma.product.findFirst).toHaveBeenCalledTimes(4);
    expect(prisma.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'brouillon', status: 'PUBLISHED', deletedAt: null },
      }),
    );
  });
});

describe('ProductDetailService — stock disponible (CA #2)', () => {
  it('expose availableStock = stock - reservedStock et jamais le stock brut', async () => {
    const { service, prisma } = makeService();
    prisma.product.findFirst.mockResolvedValue(
      product({ variants: [variant({ stock: 5, reservedStock: 3 })] }),
    );

    const detail = await service.getProductDetail('sneakers-urbanstep-air');

    expect(detail.variants[0]?.availableStock).toBe(2);
    expect(detail.variants[0]?.isAvailable).toBe(true);
    expect(detail.sizes[0]?.availableStock).toBe(2);
    expect(detail.colors[0]?.availableSizes).toEqual(['42']);
    const serialized = JSON.stringify(detail);
    expect(serialized).not.toContain('"stock":');
    expect(serialized).not.toContain('reservedStock');
  });

  it('plancher à 0 quand le réservé dépasse le physique', async () => {
    const { service, prisma } = makeService();
    prisma.product.findFirst.mockResolvedValue(
      product({ variants: [variant({ stock: 2, reservedStock: 5 })] }),
    );

    const detail = await service.getProductDetail('sneakers-urbanstep-air');

    expect(detail.variants[0]?.availableStock).toBe(0);
    expect(detail.variants[0]?.isAvailable).toBe(false);
    expect(detail.inStock).toBe(false);
    expect(detail.colors[0]?.hasStock).toBe(false);
    expect(detail.sizes[0]?.isAvailable).toBe(false);
  });

  it('marque le stock faible sous le seuil de la variante', async () => {
    const { service, prisma } = makeService();
    prisma.product.findFirst.mockResolvedValue(
      product({ variants: [variant({ stock: 3, reservedStock: 0, lowStockThreshold: 5 })] }),
    );

    const detail = await service.getProductDetail('sneakers-urbanstep-air');

    expect(detail.sizes[0]?.isLowStock).toBe(true);
  });
});

describe('ProductDetailService — prix promotionnel', () => {
  it('applique la promo dans sa fenêtre et l’annonce', async () => {
    const { service, prisma } = makeService();
    prisma.product.findFirst.mockResolvedValue(
      product({
        promoPrice: 24000,
        promoStart: new Date('2026-11-01T00:00:00.000Z'),
        promoEnd: new Date('2026-11-30T00:00:00.000Z'),
      }),
    );

    const detail = await service.getProductDetail('sneakers-urbanstep-air');

    expect(detail.isPromoActive).toBe(true);
    expect(detail.promoPrice).toBe(24000);
    expect(detail.effectivePrice).toBe(24000);
    expect(detail.variants[0]?.effectivePrice).toBe(24000);
  });

  it('ignore une promo expirée', async () => {
    const { service, prisma } = makeService();
    prisma.product.findFirst.mockResolvedValue(
      product({
        promoPrice: 24000,
        promoStart: new Date('2026-10-01T00:00:00.000Z'),
        promoEnd: new Date('2026-10-31T00:00:00.000Z'),
      }),
    );

    const detail = await service.getProductDetail('sneakers-urbanstep-air');

    expect(detail.isPromoActive).toBe(false);
    expect(detail.promoPrice).toBeNull();
    expect(detail.effectivePrice).toBe(30000);
  });

  it('ignore une promo future', async () => {
    const { service, prisma } = makeService();
    prisma.product.findFirst.mockResolvedValue(
      product({
        promoPrice: 24000,
        promoStart: new Date('2026-12-01T00:00:00.000Z'),
        promoEnd: new Date('2026-12-31T00:00:00.000Z'),
      }),
    );

    const detail = await service.getProductDetail('sneakers-urbanstep-air');

    expect(detail.isPromoActive).toBe(false);
    expect(detail.effectivePrice).toBe(30000);
  });

  it('ignore une promo sans prix', async () => {
    const { service, prisma } = makeService();
    prisma.product.findFirst.mockResolvedValue(product());

    const detail = await service.getProductDetail('sneakers-urbanstep-air');

    expect(detail.isPromoActive).toBe(false);
    expect(detail.effectivePrice).toBe(30000);
  });

  it('fait primer le prix override de la variante sur la promo produit', async () => {
    const { service, prisma } = makeService();
    prisma.product.findFirst.mockResolvedValue(
      product({
        promoPrice: 24000,
        promoStart: new Date('2026-11-01T00:00:00.000Z'),
        promoEnd: new Date('2026-11-30T00:00:00.000Z'),
        variants: [variant({ price: 27000 })],
      }),
    );

    const detail = await service.getProductDetail('sneakers-urbanstep-air');

    expect(detail.effectivePrice).toBe(24000);
    expect(detail.variants[0]?.effectivePrice).toBe(27000);
  });
});

describe('ProductDetailService — groupements et images (CA #1)', () => {
  it('groupe les variantes par couleur et par pointure', async () => {
    const { service, prisma } = makeService();
    prisma.product.findFirst.mockResolvedValue(
      product({
        variants: [
          variant({ id: 'v1', color: 'NOIR', size: '40', stock: 4 }),
          variant({ id: 'v2', color: 'NOIR', size: '42', stock: 9 }),
          variant({ id: 'v3', color: 'BLANC', size: '41', stock: 0 }),
          variant({ id: 'v4', color: 'BLANC', size: '42', stock: 2 }),
        ],
      }),
    );

    const detail = await service.getProductDetail('sneakers-urbanstep-air');

    expect(detail.colors).toHaveLength(2);
    const black = detail.colors.find((color) => color.color === 'NOIR');
    const white = detail.colors.find((color) => color.color === 'BLANC');
    expect(black).toMatchObject({ slug: 'noir', availableSizes: ['40', '42'], hasStock: true });
    // Blanc 41 est épuisé, Blanc 42 reste disponible.
    expect(white).toMatchObject({ slug: 'blanc', availableSizes: ['42'], hasStock: true });

    expect(detail.sizes.map((size) => size.size)).toEqual(['40', '41', '42']);
    const size42 = detail.sizes.find((size) => size.size === '42');
    // Max des deux couleurs : NOIR 9, BLANC 2.
    expect(size42?.availableStock).toBe(9);
    expect(detail.sizes.find((size) => size.size === '41')?.isAvailable).toBe(false);
    expect(detail.inStock).toBe(true);
  });

  it('attache à chaque couleur ses images spécifiques puis les images communes', async () => {
    const { service, prisma } = makeService();
    prisma.product.findFirst.mockResolvedValue(
      product({
        images: [
          {
            id: 'i1',
            url: 'https://cdn.test/common.jpg',
            alt: null,
            position: 0,
            variantColor: null,
          },
          {
            id: 'i2',
            url: 'https://cdn.test/noir.jpg',
            alt: null,
            position: 1,
            variantColor: 'noir',
          },
        ],
        variants: [variant({ color: 'NOIR' })],
      }),
    );

    const detail = await service.getProductDetail('sneakers-urbanstep-air');

    expect(detail.colors[0]?.images.map((image) => image.url)).toEqual([
      'https://cdn.test/noir.jpg',
      'https://cdn.test/common.jpg',
    ]);
    // L'image commune reste la première de la galerie globale.
    expect(detail.images[0]?.url).toBe('https://cdn.test/common.jpg');
  });
});

describe('ProductDetailService — produits similaires (CA #3)', () => {
  it('filtre la même catégorie, exclut le produit courant et la fenêtre ±50 %', async () => {
    const { service, prisma } = makeService();
    prisma.product.findFirst.mockResolvedValue(product());
    prisma.product.findMany.mockResolvedValue([
      product({ id: 'p2', slug: 'sneakers-2', basePrice: 28000 }),
      product({ id: 'p3', slug: 'sneakers-3', basePrice: 31000 }),
    ]);

    const detail = await service.getProductDetail('sneakers-urbanstep-air');

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: 'p1' },
          categoryId: 'c1',
          status: 'PUBLISHED',
          deletedAt: null,
          basePrice: { gte: 15000, lte: 45000 },
        }),
        take: 12,
      }),
    );
    expect(detail.similarProducts.map((item) => item.slug)).toEqual(['sneakers-3', 'sneakers-2']);
  });

  it('bascule sur la catégorie sans contrainte de prix quand la fenêtre est vide', async () => {
    const { service, prisma } = makeService();
    prisma.product.findFirst.mockResolvedValue(product());
    prisma.product.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        product({ id: 'p9', slug: 'sneakers-hors-gamme', basePrice: 90000 }),
      ]);

    const detail = await service.getProductDetail('sneakers-urbanstep-air');

    expect(prisma.product.findMany).toHaveBeenCalledTimes(2);
    const fallback = prisma.product.findMany.mock.calls[1]?.[0] as { where: unknown };
    expect(JSON.stringify(fallback.where)).not.toContain('basePrice');
    expect(detail.similarProducts.map((item) => item.slug)).toEqual(['sneakers-hors-gamme']);
  });

  it('respecte la limite configurée', async () => {
    const { service, prisma, config } = makeService();
    config.get.mockImplementation((key: string) =>
      key === 'app.catalog.similarProductsLimit' ? 2 : 300,
    );
    prisma.product.findFirst.mockResolvedValue(product());
    prisma.product.findMany.mockResolvedValue([
      product({ id: 'p2', slug: 'sneakers-2', basePrice: 30000 }),
      product({ id: 'p3', slug: 'sneakers-3', basePrice: 30000 }),
      product({ id: 'p4', slug: 'sneakers-4', basePrice: 30000 }),
    ]);

    const detail = await service.getProductDetail('sneakers-urbanstep-air');

    expect(detail.similarProducts).toHaveLength(2);
  });
});

describe('ProductDetailService — cache', () => {
  it('sert la réponse en cache sans interroger Prisma', async () => {
    const { service, prisma, cache } = makeService();
    const cached = { slug: 'sneakers-urbanstep-air', cached: true };
    cache.getProductDetail.mockResolvedValue(cached);

    const detail = await service.getProductDetail('sneakers-urbanstep-air');

    expect(detail).toBe(cached);
    expect(prisma.product.findFirst).not.toHaveBeenCalled();
  });

  it('écrit la fiche en cache après un miss', async () => {
    const { service, prisma, cache } = makeService();
    prisma.product.findFirst.mockResolvedValue(product());

    const detail = await service.getProductDetail('sneakers-urbanstep-air');

    expect(cache.setProductDetail).toHaveBeenCalledWith('sneakers-urbanstep-air', detail);
  });

  it('ne met pas les 404 en cache', async () => {
    const { service, prisma, cache } = makeService();
    prisma.product.findFirst.mockResolvedValue(null);

    await expectUniformNotFound(service, 'inconnu');

    expect(cache.setProductDetail).not.toHaveBeenCalled();
  });
});
