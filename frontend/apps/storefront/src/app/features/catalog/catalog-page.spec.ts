import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CatalogApi, CatalogFacets, CatalogProduct, ProductPage } from '@bruny/data-access';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { SeoService } from '../../core/seo.service';
import { CATALOG_PAGE_SIZE } from './catalog-query';
import { CatalogStore } from './catalog.store';
import { CatalogPage } from './catalog-page';

const facets: CatalogFacets = {
  categories: [{ id: '1', name: 'Sneakers', slug: 'sneakers', count: 4 }],
  brands: [],
  sizes: [{ value: '42', count: 20 }],
  colors: [],
  availability: { inStock: 20, outOfStock: 0 },
  promotion: { active: 0, inactive: 20 },
  price: { min: 8000, max: 33500 },
};

const product = (id: string): CatalogProduct => ({
  id,
  name: `Sneaker ${id}`,
  slug: `sneaker-${id}`,
  description: '',
  basePrice: 25000,
  effectivePrice: 25000,
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

function buildPage(items: CatalogProduct[], pageNumber = 1, total = items.length): ProductPage {
  return {
    items,
    pagination: {
      page: pageNumber,
      limit: CATALOG_PAGE_SIZE,
      total,
      pages: Math.ceil(total / CATALOG_PAGE_SIZE),
    },
    facets,
  };
}

async function setup(initialUrl = '/boutique') {
  const list = vi.fn(() => of(buildPage([product('1'), product('2')])));
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        {
          path: 'boutique',
          component: CatalogPage,
          providers: [CatalogStore],
        },
      ]),
      { provide: CatalogApi, useValue: { list, categories: () => of([]) } },
      { provide: SeoService, useValue: { set: vi.fn() } },
    ],
  });

  const harness = await RouterTestingHarness.create(initialUrl);
  return { harness, list, router: TestBed.inject(Router) };
}

describe('CatalogPage', () => {
  it('loads the first page from the URL and renders the category title', async () => {
    const { harness, list } = await setup('/boutique?category=sneakers');
    const element = harness.routeNativeElement as HTMLElement;

    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'sneakers', page: 1, limit: CATALOG_PAGE_SIZE }),
    );
    expect(element.querySelector('h1')?.textContent).toContain('Sneakers');
    expect(element.querySelectorAll('bruny-product-card')).toHaveLength(2);
  });

  it('writes the selected sort to the URL and reloads', async () => {
    const { harness, list, router } = await setup();
    const page = harness.routeDebugElement?.componentInstance as CatalogPage;

    page.onSort('price_asc');
    await harness.fixture.whenStable();

    expect(router.url).toContain('sort=price_asc');
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'price_asc' }));
  });

  it('removes a filter through the URL and returns to page 1', async () => {
    const { harness, list, router } = await setup('/boutique?category=sneakers&page=2');
    const page = harness.routeDebugElement?.componentInstance as CatalogPage;

    page.onRemoveFilter('category');
    await harness.fixture.whenStable();

    expect(router.url).not.toContain('category=');
    expect(router.url).not.toContain('page=2');
    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: undefined, page: 1 }),
    );
  });

  it('appends the next page through "Voir plus"', async () => {
    const list = vi
      .fn()
      .mockReturnValueOnce(of(buildPage([product('1'), product('2')], 1, 3)))
      .mockReturnValueOnce(of(buildPage([product('3')], 2, 3)));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'boutique', component: CatalogPage, providers: [CatalogStore] }]),
        { provide: CatalogApi, useValue: { list, categories: () => of([]) } },
        { provide: SeoService, useValue: { set: vi.fn() } },
      ],
    });
    const harness = await RouterTestingHarness.create('/boutique');
    const page = harness.routeDebugElement?.componentInstance as CatalogPage;

    page.onLoadMore();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toContain('page=2');
    expect(list).toHaveBeenCalledTimes(2);
    expect(page.store.products().map((item) => item.id)).toEqual(['1', '2', '3']);
  });

  it('resets filters but keeps the sort', async () => {
    const { harness, router } = await setup('/boutique?category=sneakers&sort=price_desc');
    const page = harness.routeDebugElement?.componentInstance as CatalogPage;

    page.onReset();
    await harness.fixture.whenStable();

    expect(router.url).toContain('sort=price_desc');
    expect(router.url).not.toContain('category=');
  });

  it('opens and closes the mobile filter drawer', async () => {
    const { harness } = await setup();
    const page = harness.routeDebugElement?.componentInstance as CatalogPage;

    page.openDrawer();
    await harness.fixture.whenStable();
    expect(page.drawerOpen()).toBe(true);
    expect(harness.routeNativeElement?.querySelector('[role="dialog"]')).not.toBeNull();

    page.closeDrawer();
    await harness.fixture.whenStable();
    expect(page.drawerOpen()).toBe(false);
  });
});
