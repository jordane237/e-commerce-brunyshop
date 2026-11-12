import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { CatalogApi, CatalogCategory, CatalogProduct, ProductPage } from '@bruny/data-access';
import { HomeDataService } from './home-data.service';

const category: CatalogCategory = {
  id: '1',
  name: 'Mocassins',
  slug: 'mocassins',
  position: 1,
  parent: null,
  children: [],
};

const childCategory: CatalogCategory = {
  id: '2',
  name: 'Mocassins cuir',
  slug: 'mocassins-cuir',
  position: 1,
  parent: { id: '1', name: 'Mocassins', slug: 'mocassins' },
  children: [],
};

const product: CatalogProduct = {
  id: 'p1',
  name: 'Mocassin',
  slug: 'mocassin',
  description: '',
  basePrice: 20000,
  effectivePrice: 20000,
  promoPrice: null,
  promoStart: null,
  promoEnd: null,
  isPromoActive: false,
  inStock: true,
  category: { id: '1', name: 'Mocassins', slug: 'mocassins' },
  brand: { id: '1', name: 'Bruny', slug: 'bruny', logo: null },
  images: [],
  variants: [],
};

function page(items: CatalogProduct[]): ProductPage {
  return {
    items,
    pagination: { page: 1, limit: 8, total: items.length, pages: 1 },
    facets: {
      categories: [],
      brands: [],
      sizes: [],
      colors: [],
      availability: { inStock: 0, outOfStock: 0 },
      promotion: { active: 0, inactive: 0 },
      price: { min: 0, max: 0 },
    },
  };
}

function stubbedApi(): Partial<CatalogApi> {
  return {
    categories: () => of([category, childCategory]),
    list: () => of(page([product])),
  };
}

describe('HomeDataService', () => {
  let service: HomeDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: CatalogApi, useValue: stubbedApi() }],
    });
    service = TestBed.inject(HomeDataService);
  });

  it('keeps only top-level categories', () => {
    service.loadCategories();
    expect(service.categoriesLoading()).toBe(false);
    expect(service.categories()?.map((item) => item.id)).toEqual(['1']);
    expect(service.categoriesError()).toBeNull();
  });

  it('loads the three product sections', () => {
    service.loadNewProducts();
    service.loadBestSellers();
    service.loadPromotions();

    expect(service.newProducts()?.length).toBe(1);
    expect(service.bestSellers()?.length).toBe(1);
    expect(service.promotions()?.length).toBe(1);
    expect(service.newProductsLoading()).toBe(false);
  });

  it('exposes a French error message and clears it on retry', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CatalogApi,
          useValue: {
            categories: () => throwError(() => new Error('offline')),
            list: () => of(page([])),
          },
        },
      ],
    });
    const failing = TestBed.inject(HomeDataService);

    failing.loadCategories();
    expect(failing.categoriesError()).toBe('Impossible de charger les catégories. Réessayez.');
    expect(failing.categoriesLoading()).toBe(false);

    failing.loadCategories();
    expect(failing.categoriesError()).toBe('Impossible de charger les catégories. Réessayez.');
  });

  it('reloads all four sections', () => {
    service.reloadAll();
    expect(service.categories()).not.toBeNull();
    expect(service.newProducts()).not.toBeNull();
    expect(service.bestSellers()).not.toBeNull();
    expect(service.promotions()).not.toBeNull();
  });
});
