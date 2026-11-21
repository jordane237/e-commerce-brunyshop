import { TestBed } from '@angular/core/testing';
import { CatalogApi, CatalogFacets, CatalogProduct, ProductPage } from '@bruny/data-access';
import { of, Subject, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CatalogFilters } from './catalog-query';
import { CATALOG_ERROR, CatalogStore } from './catalog.store';

const facets: CatalogFacets = {
  categories: [{ id: '1', name: 'Sneakers', slug: 'sneakers', count: 4 }],
  brands: [{ id: 'b1', name: 'Kepe', slug: 'kepe', count: 7 }],
  sizes: [{ value: '42', count: 20 }],
  colors: [{ value: 'NOIR', count: 5 }],
  availability: { inStock: 20, outOfStock: 0 },
  promotion: { active: 0, inactive: 20 },
  price: { min: 8000, max: 33500 },
};

const product = (id: string): CatalogProduct => ({
  id,
  name: `Produit ${id}`,
  slug: `produit-${id}`,
  description: '',
  basePrice: 10000,
  effectivePrice: 10000,
  promoPrice: null,
  promoStart: null,
  promoEnd: null,
  isPromoActive: false,
  inStock: true,
  category: { id: '1', name: 'Sneakers', slug: 'sneakers' },
  brand: { id: 'b1', name: 'Kepe', slug: 'kepe', logo: null },
  images: [],
  variants: [],
});

function page(items: CatalogProduct[], pageNumber = 1, total = items.length): ProductPage {
  return {
    items,
    pagination: {
      page: pageNumber,
      limit: 12,
      total,
      pages: Math.ceil(total / 12),
    },
    facets,
  };
}

const filters: CatalogFilters = { sort: 'newest', page: 1 };

function setup(api: Partial<CatalogApi>) {
  TestBed.configureTestingModule({
    providers: [CatalogStore, { provide: CatalogApi, useValue: api }],
  });
  return TestBed.inject(CatalogStore);
}

describe('CatalogStore', () => {
  it('loads the first page and exposes products, meta and facets', () => {
    const store = setup({ list: vi.fn(() => of(page([product('1'), product('2')]))) });

    store.load(filters);

    expect(store.filters()).toEqual(filters);
    expect(store.products()).toHaveLength(2);
    expect(store.meta()?.total).toBe(2);
    expect(store.facets()).toEqual(facets);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.hasResults()).toBe(true);
    expect(store.isEmpty()).toBe(false);
  });

  it('sends the current filters and page size to the generated client', () => {
    const list = vi.fn(() => of(page([])));
    const store = setup({ list });

    store.load({ sort: 'price_asc', page: 2, category: 'sneakers', inStock: true });

    expect(list).toHaveBeenCalledWith({
      category: 'sneakers',
      brand: undefined,
      size: undefined,
      color: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      inStock: true,
      promo: undefined,
      q: undefined,
      sort: 'price_asc',
      page: 2,
      limit: 12,
    });
  });

  it('reports an empty result only when no request failed', () => {
    const store = setup({ list: () => of(page([])) });

    store.load(filters);

    expect(store.isEmpty()).toBe(true);
    expect(store.hasResults()).toBe(false);
  });

  it('appends the next page when loadMore is requested', () => {
    const list = vi
      .fn()
      .mockReturnValueOnce(of(page([product('1'), product('2')], 1, 4)))
      .mockReturnValueOnce(of(page([product('3'), product('4')], 2, 4)));
    const store = setup({ list });

    store.load(filters);
    store.load({ ...filters, page: 2 }, true);

    expect(store.products().map((item) => item.id)).toEqual(['1', '2', '3', '4']);
    expect(store.meta()?.page).toBe(2);
  });

  it('replaces the list on a normal page change', () => {
    const list = vi
      .fn()
      .mockReturnValueOnce(of(page([product('1')], 1, 2)))
      .mockReturnValueOnce(of(page([product('2')], 2, 2)));
    const store = setup({ list });

    store.load(filters);
    store.load({ ...filters, page: 2 });

    expect(store.products().map((item) => item.id)).toEqual(['2']);
  });

  it('exposes the canonical network error and stops loading', () => {
    const store = setup({ list: () => throwError(() => new Error('offline')) });

    store.load(filters);

    expect(store.error()).toBe(CATALOG_ERROR);
    expect(store.loading()).toBe(false);
    expect(store.isEmpty()).toBe(false);
  });

  it('ignores a stale response that resolves after a newer request', () => {
    const first = new Subject<ProductPage>();
    const second = new Subject<ProductPage>();
    const list = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
    const store = setup({ list });

    store.load(filters);
    store.load({ ...filters, category: 'sneakers' });
    second.next(page([product('new')]));
    second.complete();
    first.next(page([product('old')]));
    first.complete();

    expect(store.products().map((item) => item.id)).toEqual(['new']);
  });

  it('counts active filters and ignores sort/page', () => {
    const store = setup({ list: () => of(page([])) });

    store.load({ sort: 'price_desc', page: 3, category: 'sneakers', size: '42', inStock: true });

    expect(store.activeFilterCount()).toBe(3);
  });

  it('retries a failed load-more as an append instead of replacing the list', () => {
    const list = vi
      .fn()
      .mockReturnValueOnce(of(page([product('1'), product('2')], 1, 3)))
      .mockReturnValueOnce(throwError(() => new Error('offline')))
      .mockReturnValueOnce(of(page([product('3')], 2, 3)));
    const store = setup({ list });

    store.load(filters);
    store.load({ ...filters, page: 2 }, true);
    expect(store.error()).toBe(CATALOG_ERROR);

    store.retry();

    expect(store.products().map((item) => item.id)).toEqual(['1', '2', '3']);
    expect(store.meta()?.page).toBe(2);
  });

  it('retries with the last applied filters', () => {
    const list = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('offline')))
      .mockReturnValueOnce(of(page([product('1')])));
    const store = setup({ list });

    store.load({ sort: 'name', page: 2, q: 'air' });
    store.retry();

    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({ sort: 'name', page: 2, q: 'air' }),
    );
    expect(store.error()).toBeNull();
    expect(store.products()).toHaveLength(1);
  });
});
