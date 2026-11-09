import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../infrastructure/database/database.module';
import type { CatalogCacheService } from './cache/catalog-cache.service';
import { CatalogService } from './catalog.service';
import type { ListProductsDto } from './dto/list-products.dto';

function makeService() {
  const prisma = {
    $transaction: vi.fn(),
    $queryRaw: vi.fn().mockResolvedValue([]),
    product: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
    category: { findMany: vi.fn() },
  };
  const cache = {
    invalidateProducts: vi.fn().mockResolvedValue(undefined),
    getProductsList: vi.fn().mockResolvedValue(null),
    setProductsList: vi.fn().mockResolvedValue(undefined),
    getProductsFacets: vi.fn().mockResolvedValue(null),
    setProductsFacets: vi.fn().mockResolvedValue(undefined),
  };
  return {
    service: new CatalogService(
      prisma as unknown as PrismaService,
      { record: vi.fn() },
      cache as unknown as CatalogCacheService,
    ),
    prisma,
    cache,
  };
}

function listRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    name: 'Sneakers UrbanStep Air',
    slug: 'sneakers-urbanstep-air',
    basePrice: 30000,
    promoPrice: null,
    promoStart: null,
    promoEnd: null,
    category: { id: 'c1', name: 'Sneakers', slug: 'sneakers' },
    brand: { id: 'b1', name: 'Barrage Foot', slug: 'barrage-foot', logo: null },
    images: [{ id: 'i1', url: 'https://cdn/1.jpg', alt: null, position: 0, variantColor: null }],
    variants: [
      {
        id: 'v1',
        sku: 'BARF-SNEAKERSUR-42-NOIR',
        size: '42',
        color: 'NOIR',
        stock: 5,
        reservedStock: 2,
      },
    ],
    ...overrides,
  };
}

function query(overrides: Partial<ListProductsDto> = {}): ListProductsDto {
  return {
    page: 2,
    limit: 8,
    category: 'sneakers',
    size: '42',
    color: 'Noir',
    minPrice: 10000,
    maxPrice: 50000,
    sort: 'price_asc',
    q: 'urbain',
    ...overrides,
  } as ListProductsDto;
}

describe('CatalogService.listProducts', () => {
  it('pagine et combine les filtres de catalogue côté base', async () => {
    const { service, prisma } = makeService();
    prisma.$transaction.mockResolvedValue([[], 0]);
    prisma.product.findMany.mockResolvedValue([]);

    await service.listProducts(query());

    const itemsQuery = prisma.product.findMany.mock.calls[0]?.[0] as {
      where: unknown;
      skip: number;
      take: number;
      orderBy: unknown;
    };
    const countQuery = prisma.product.count.mock.calls[0]?.[0] as { where: unknown };
    expect(itemsQuery.skip).toBe(8);
    expect(itemsQuery.take).toBe(8);
    expect(itemsQuery.orderBy).toEqual({ basePrice: 'asc' });
    expect(itemsQuery.where).toEqual(countQuery.where);
    expect(JSON.stringify(itemsQuery.where)).toContain('PUBLISHED');
    expect(JSON.stringify(itemsQuery.where)).toContain('sneakers');
    expect(JSON.stringify(itemsQuery.where)).toContain('urbain');
    // Pointure/couleur et disponibilité sont résolues par la requête SQL stock - réservé.
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('filtre par marque, disponibilité et promotion active', async () => {
    const { service, prisma } = makeService();
    prisma.$transaction.mockResolvedValue([[], 0]);
    prisma.product.findMany.mockResolvedValue([]);

    await service.listProducts(
      query({
        category: undefined,
        size: undefined,
        color: undefined,
        q: undefined,
        brand: 'kepe',
      }),
    );
    const brandWhere = prisma.product.findMany.mock.calls[0]?.[0] as { where: unknown };
    expect(JSON.stringify(brandWhere.where)).toContain('"slug":"kepe"');

    prisma.product.findMany.mockClear();
    prisma.$transaction.mockClear();
    prisma.$queryRaw.mockClear();
    await service.listProducts(query({ page: 1, inStock: 'true', promo: 'true' }));
    const availabilityWhere = prisma.product.findMany.mock.calls[0]?.[0] as { where: unknown };
    expect(JSON.stringify(availabilityWhere.where)).toContain('"promoPrice":{"not":null}');
    expect(JSON.stringify(availabilityWhere.where)).toContain('"in":[]');
    expect(prisma.$queryRaw).toHaveBeenCalled();

    prisma.product.findMany.mockClear();
    prisma.$transaction.mockClear();
    prisma.$queryRaw.mockClear();
    await service.listProducts(query({ page: 1, inStock: 'false', promo: 'false' }));
    const outOfStockWhere = prisma.product.findMany.mock.calls[0]?.[0] as { where: unknown };
    const outOfStock = JSON.stringify(outOfStockWhere.where);
    expect(outOfStock).toContain('"notIn":[]');
    expect(outOfStock).toContain('"NOT"');
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('expose availableStock et jamais le stock brut', async () => {
    const { service, prisma } = makeService();
    prisma.$transaction.mockResolvedValue([
      [listRow({ variants: [{ ...listRow().variants[0], stock: 5, reservedStock: 3 }] })],
      1,
    ]);
    prisma.product.findMany.mockResolvedValue([]);

    const result = await service.listProducts(query({ page: 1 }));

    expect(result.items[0]?.variants[0]?.availableStock).toBe(2);
    expect(result.items[0]?.variants[0]?.isAvailable).toBe(true);
    expect(result.items[0]?.inStock).toBe(true);
    expect(JSON.stringify(result)).not.toContain('"stock":');
    expect(JSON.stringify(result)).not.toContain('reservedStock');
  });

  it('calcule les facettes sur tout le catalogue publié', async () => {
    const { service, prisma } = makeService();
    prisma.$transaction.mockResolvedValue([[listRow()], 1]);
    prisma.product.findMany.mockResolvedValue([
      {
        ...listRow(),
        id: 'p1',
        basePrice: 10000,
        variants: [
          { size: '40', color: 'NOIR', stock: 4, reservedStock: 0 },
          { size: '42', color: 'BLANC', stock: 0, reservedStock: 0 },
        ],
      },
      {
        ...listRow(),
        id: 'p2',
        basePrice: 30000,
        variants: [{ size: '42', color: 'NOIR', stock: 2, reservedStock: 0 }],
      },
      {
        ...listRow(),
        id: 'p3',
        basePrice: 20000,
        promoPrice: 15000,
        promoStart: new Date('2026-11-01T00:00:00.000Z'),
        promoEnd: new Date('2026-12-01T00:00:00.000Z'),
        variants: [{ size: '42', color: 'NOIR', stock: 1, reservedStock: 1 }],
      },
    ]);

    const result = await service.listProducts(query({ page: 1 }));

    expect(result.facets.sizes).toEqual([
      { value: '40', count: 1 },
      { value: '42', count: 1 },
    ]);
    expect(result.facets.colors).toEqual([{ value: 'NOIR', count: 2 }]);
    expect(result.facets.availability).toEqual({ inStock: 2, outOfStock: 1 });
    expect(result.facets.promotion).toEqual({ active: 1, inactive: 2 });
    expect(result.facets.price).toEqual({ min: 10000, max: 30000 });
    expect(result.facets.categories).toEqual([
      { id: 'c1', name: 'Sneakers', slug: 'sneakers', count: 3 },
    ]);
    expect(result.facets.brands).toEqual([
      { id: 'b1', name: 'Barrage Foot', slug: 'barrage-foot', count: 3 },
    ]);
  });

  it('sert la liste depuis le cache sans interroger la base', async () => {
    const { service, prisma, cache } = makeService();
    const cached = { items: [], pagination: {}, facets: {}, cached: true };
    cache.getProductsList.mockResolvedValue(cached);

    const result = await service.listProducts(query());

    expect(result).toBe(cached);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('écrit la liste et les facettes en cache après un miss', async () => {
    const { service, prisma, cache } = makeService();
    prisma.$transaction.mockResolvedValue([[], 0]);
    prisma.product.findMany.mockResolvedValue([]);

    const result = await service.listProducts(query());

    expect(cache.setProductsList).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 8, sort: 'price_asc' }),
      result,
    );
    expect(cache.setProductsFacets).toHaveBeenCalledWith(result.facets);
  });
});
