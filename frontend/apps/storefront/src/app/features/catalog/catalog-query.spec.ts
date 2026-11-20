import { describe, expect, it } from 'vitest';
import {
  CATALOG_PAGE_SIZE,
  colorLabel,
  countActiveFilters,
  DEFAULT_CATALOG_FILTERS,
  hasSameFilters,
  parseCatalogFilters,
  resetCatalogFilters,
  toCatalogQueryParams,
  withFilterPatch,
  withoutFilter,
} from './catalog-query';

function params(values: Record<string, string>): { get(name: string): string | null } {
  return { get: (name) => values[name] ?? null };
}

describe('parseCatalogFilters', () => {
  it('returns defaults for an empty URL', () => {
    expect(parseCatalogFilters(params({}))).toEqual({
      sort: 'newest',
      page: 1,
      category: undefined,
      brand: undefined,
      size: undefined,
      color: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      inStock: undefined,
      promo: undefined,
      q: undefined,
    });
  });

  it('maps every supported query parameter', () => {
    const filters = parseCatalogFilters(
      params({
        category: 'sneakers',
        brand: 'kepe',
        size: '42',
        color: 'NOIR',
        minPrice: '20000',
        maxPrice: '50000',
        inStock: 'true',
        promo: 'false',
        q: 'air max',
        sort: 'price_asc',
        page: '3',
      }),
    );

    expect(filters).toMatchObject({
      category: 'sneakers',
      brand: 'kepe',
      size: '42',
      color: 'NOIR',
      minPrice: 20000,
      maxPrice: 50000,
      inStock: true,
      promo: false,
      q: 'air max',
      sort: 'price_asc',
      page: 3,
    });
  });

  it('falls back on defaults for an unknown sort or an invalid page', () => {
    expect(parseCatalogFilters(params({ sort: 'popular', page: '0' }))).toMatchObject({
      sort: 'newest',
      page: 1,
    });
    expect(parseCatalogFilters(params({ sort: 'name_asc', page: '-2' }))).toMatchObject({
      sort: 'newest',
      page: 1,
    });
  });

  it('ignores invalid booleans, non-integer prices and blank strings', () => {
    const filters = parseCatalogFilters(
      params({ inStock: 'yes', minPrice: 'abc', maxPrice: '12.5', category: '  ' }),
    );
    expect(filters.inStock).toBeUndefined();
    expect(filters.minPrice).toBeUndefined();
    expect(filters.maxPrice).toBeUndefined();
    expect(filters.category).toBeUndefined();
  });

  it('swaps an inverted price range instead of returning an empty list', () => {
    expect(parseCatalogFilters(params({ minPrice: '50000', maxPrice: '20000' }))).toMatchObject({
      minPrice: 20000,
      maxPrice: 50000,
    });
  });

  it('truncates values to the backend limits', () => {
    const filters = parseCatalogFilters(params({ size: '4'.repeat(30), q: 'a'.repeat(120) }));
    expect(filters.size).toHaveLength(20);
    expect(filters.q).toHaveLength(100);
  });
});

describe('toCatalogQueryParams', () => {
  it('omits default values to keep the URL clean', () => {
    expect(toCatalogQueryParams({ ...DEFAULT_CATALOG_FILTERS })).toEqual({});
  });

  it('serializes active filters and pagination', () => {
    expect(
      toCatalogQueryParams({
        category: 'sneakers',
        size: '42',
        minPrice: 20000,
        inStock: true,
        sort: 'price_desc',
        page: 2,
      }),
    ).toEqual({
      category: 'sneakers',
      size: '42',
      minPrice: '20000',
      inStock: 'true',
      sort: 'price_desc',
      page: '2',
    });
  });

  it('round-trips a filter set through the URL', () => {
    const filters = parseCatalogFilters(
      params({ category: 'sneakers', color: 'NOIR', sort: 'name', page: '2' }),
    );
    expect(parseCatalogFilters(params(toCatalogQueryParams(filters)))).toEqual(filters);
  });
});

describe('filter mutations', () => {
  it('resets the page when a filter changes', () => {
    const next = withFilterPatch({ sort: 'newest', page: 4 }, { category: 'sneakers' });
    expect(next.page).toBe(1);
  });

  it('keeps the page when only the page changes', () => {
    const next = withFilterPatch({ sort: 'newest', page: 1 }, { page: 3 });
    expect(next.page).toBe(3);
  });

  it('removes a filter and both price bounds', () => {
    expect(withoutFilter({ sort: 'newest', page: 2, category: 'sneakers' }, 'category')).toEqual({
      sort: 'newest',
      page: 1,
    });
    expect(
      withoutFilter({ sort: 'newest', page: 2, minPrice: 1000, maxPrice: 3000 }, 'price'),
    ).toEqual({ sort: 'newest', page: 1 });
  });

  it('resets every filter but keeps the sort', () => {
    expect(
      resetCatalogFilters({ sort: 'price_asc', page: 3, category: 'sneakers', inStock: true }),
    ).toEqual({ sort: 'price_asc', page: 1 });
  });

  it('compares filters while optionally ignoring the page', () => {
    const left = { sort: 'newest' as const, page: 1, category: 'sneakers' };
    const right = { sort: 'newest' as const, page: 2, category: 'sneakers' };
    expect(hasSameFilters(left, right)).toBe(false);
    expect(hasSameFilters(left, right, { ignorePage: true })).toBe(true);
  });
});

describe('countActiveFilters', () => {
  it('ignores sort and page', () => {
    expect(countActiveFilters({ sort: 'price_asc', page: 5 })).toBe(0);
  });

  it('counts a price range once and each boolean once', () => {
    expect(
      countActiveFilters({
        sort: 'newest',
        page: 1,
        category: 'sneakers',
        size: '42',
        minPrice: 1000,
        maxPrice: 2000,
        inStock: true,
        promo: true,
        q: 'air',
      }),
    ).toBe(6);
  });

  it('does not count an explicit false boolean', () => {
    expect(countActiveFilters({ sort: 'newest', page: 1, inStock: false })).toBe(0);
  });
});

describe('constants', () => {
  it('uses a page size compatible with the 2/3/4 column grid and the API cap', () => {
    expect(CATALOG_PAGE_SIZE % 4).toBe(0);
    expect(CATALOG_PAGE_SIZE).toBeLessThanOrEqual(48);
  });

  it('capitalizes a raw color value', () => {
    expect(colorLabel('NOIR')).toBe('Noir');
    expect(colorLabel('MARRON')).toBe('Marron');
  });
});
