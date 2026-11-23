import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { convertToParamMap } from '@angular/router';
import { Subject, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CatalogApi, CatalogFacets, CatalogProduct, ProductPage } from '@bruny/data-access';
import { SeoService } from '../../core/seo.service';
import { CartStore } from '../../core/cart/cart.store';
import { CatalogStore } from '../catalog/catalog.store';
import { SearchComponent } from './search.component';

const facets: CatalogFacets = {
  categories: [{ id: '1', name: 'Sneakers', slug: 'sneakers', count: 4 }],
  brands: [],
  sizes: [],
  colors: [],
  availability: { inStock: 4, outOfStock: 0 },
  promotion: { active: 0, inactive: 4 },
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

function buildPage(items: CatalogProduct[], total = items.length): ProductPage {
  return {
    items,
    pagination: { page: 1, limit: 12, total, pages: Math.ceil(total / 12) || 1 },
    facets,
  };
}

describe('SearchComponent', () => {
  it('se crée sans erreur', async () => {
    const queryParamMap = new Subject();
    const list = vi.fn(() => of(buildPage([product('1')])));
    TestBed.configureTestingModule({
      imports: [SearchComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParamMap.asObservable() } },
        { provide: Router, useValue: { navigate: vi.fn(() => Promise.resolve(true)) } },
        { provide: CatalogApi, useValue: { list, categories: () => of([]) } },
        { provide: SeoService, useValue: { setPageMeta: vi.fn() } },
        { provide: CartStore, useValue: { addProduct: vi.fn() } },
        CatalogStore,
      ],
    });
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('lit ?q= au boot et charge le store', () => {
    const queryParamMap = new Subject();
    const list = vi.fn(() => of(buildPage([product('1')])));
    TestBed.configureTestingModule({
      imports: [SearchComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParamMap.asObservable() } },
        { provide: Router, useValue: { navigate: vi.fn(() => Promise.resolve(true)) } },
        { provide: CatalogApi, useValue: { list, categories: () => of([]) } },
        { provide: SeoService, useValue: { setPageMeta: vi.fn() } },
        { provide: CartStore, useValue: { addProduct: vi.fn() } },
        CatalogStore,
      ],
    });
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.detectChanges();
    queryParamMap.next(convertToParamMap({ q: 'air' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.query()).toBe('air');
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ q: 'air', page: 1 }));
  });

  it('débounce la saisie de 300 ms avant de naviguer', async () => {
    const queryParamMap = new Subject();
    const navigate = vi.fn(() => Promise.resolve(true));
    TestBed.configureTestingModule({
      imports: [SearchComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParamMap.asObservable() } },
        { provide: Router, useValue: { navigate } },
        {
          provide: CatalogApi,
          useValue: { list: vi.fn(() => of(buildPage([]))), categories: () => of([]) },
        },
        { provide: SeoService, useValue: { setPageMeta: vi.fn() } },
        { provide: CartStore, useValue: { addProduct: vi.fn() } },
        CatalogStore,
      ],
    });
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.detectChanges();

    fixture.componentInstance.searchControl.setValue('air');
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(navigate).not.toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 100));
    fixture.detectChanges();
    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { q: 'air' }, replaceUrl: true }),
    );
  });

  it('ne relance pas la navigation pour la même valeur', async () => {
    const queryParamMap = new Subject();
    const navigate = vi.fn(() => Promise.resolve(true));
    TestBed.configureTestingModule({
      imports: [SearchComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParamMap.asObservable() } },
        { provide: Router, useValue: { navigate } },
        {
          provide: CatalogApi,
          useValue: { list: vi.fn(() => of(buildPage([]))), categories: () => of([]) },
        },
        { provide: SeoService, useValue: { setPageMeta: vi.fn() } },
        { provide: CartStore, useValue: { addProduct: vi.fn() } },
        CatalogStore,
      ],
    });
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.detectChanges();

    fixture.componentInstance.searchControl.setValue('air');
    await new Promise((resolve) => setTimeout(resolve, 350));
    const calls = navigate.mock.calls.length;
    fixture.componentInstance.searchControl.setValue('air');
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(navigate.mock.calls.length).toBe(calls);
  });

  it('efface la recherche et retire q de l’URL', async () => {
    const queryParamMap = new Subject();
    const navigate = vi.fn(() => Promise.resolve(true));
    TestBed.configureTestingModule({
      imports: [SearchComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParamMap.asObservable() } },
        { provide: Router, useValue: { navigate } },
        {
          provide: CatalogApi,
          useValue: { list: vi.fn(() => of(buildPage([]))), categories: () => of([]) },
        },
        { provide: SeoService, useValue: { setPageMeta: vi.fn() } },
        { provide: CartStore, useValue: { addProduct: vi.fn() } },
        CatalogStore,
      ],
    });
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.detectChanges();

    fixture.componentInstance.onClear();
    await new Promise((resolve) => setTimeout(resolve, 350));
    fixture.detectChanges();
    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { q: null } }),
    );
  });

  it('appelle SeoService avec noIndex', () => {
    const queryParamMap = new Subject();
    const setPageMeta = vi.fn();
    TestBed.configureTestingModule({
      imports: [SearchComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParamMap.asObservable() } },
        { provide: Router, useValue: { navigate: vi.fn(() => Promise.resolve(true)) } },
        {
          provide: CatalogApi,
          useValue: { list: vi.fn(() => of(buildPage([]))), categories: () => of([]) },
        },
        { provide: SeoService, useValue: { setPageMeta } },
        { provide: CartStore, useValue: { addProduct: vi.fn() } },
        CatalogStore,
      ],
    });
    TestBed.createComponent(SearchComponent);
    expect(setPageMeta).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Recherche', noIndex: true }),
    );
  });

  it('charge des suggestions à l’initialisation', async () => {
    const queryParamMap = new Subject();
    const list = vi.fn(() => of(buildPage([product('1'), product('2')])));
    TestBed.configureTestingModule({
      imports: [SearchComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParamMap.asObservable() } },
        { provide: Router, useValue: { navigate: vi.fn(() => Promise.resolve(true)) } },
        { provide: CatalogApi, useValue: { list, categories: () => of([]) } },
        { provide: SeoService, useValue: { setPageMeta: vi.fn() } },
        { provide: CartStore, useValue: { addProduct: vi.fn() } },
        CatalogStore,
      ],
    });
    const fixture = TestBed.createComponent(SearchComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.suggestions()).toHaveLength(2);
  });
});
