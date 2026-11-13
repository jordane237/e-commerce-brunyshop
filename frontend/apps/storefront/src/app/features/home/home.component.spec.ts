import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { CatalogApi, CatalogCategory, ProductPage } from '@bruny/data-access';
import { HomeComponent } from './home.component';

const category: CatalogCategory = {
  id: '1',
  name: 'Mocassins',
  slug: 'mocassins',
  position: 1,
  parent: null,
  children: [],
};

const emptyPage: ProductPage = {
  items: [],
  pagination: { page: 1, limit: 8, total: 0, pages: 0 },
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

function apiStub(): Partial<CatalogApi> {
  return {
    categories: () => of([category]),
    list: () => of(emptyPage),
  };
}

describe('HomeComponent', () => {
  it('loads every section through HomeDataService', async () => {
    const fixture = TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([]), { provide: CatalogApi, useValue: apiStub() }],
    }).createComponent(HomeComponent);

    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('bruny-hero-banner')).not.toBeNull();
    expect(element.querySelectorAll('bruny-product-section').length).toBe(3);
    expect(element.textContent).toContain('Nouveautés de la Semaine');
    expect(element.textContent).toContain('Meilleures Ventes');
    expect(element.textContent).toContain('Promotions');
    expect(element.querySelector('bruny-facebook-cta')).not.toBeNull();
    expect(fixture.componentInstance.data.categories()?.length).toBe(1);
  });

  it('shows the global retry only when all sections fail', async () => {
    const failing = {
      categories: () => throwError(() => new Error('offline')),
      list: () => throwError(() => new Error('offline')),
    } as Partial<CatalogApi>;

    const fixture = TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([]), { provide: CatalogApi, useValue: failing }],
    }).createComponent(HomeComponent);

    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.home__global-error')).not.toBeNull();
  });
});
