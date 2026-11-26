import { TestBed } from '@angular/core/testing';
import { CatalogFacets } from '@bruny/data-access';
import { describe, expect, it } from 'vitest';
import { CatalogFilterKey, CatalogFilters } from '../../catalog-query';
import { ActiveFiltersChipsComponent } from './active-filters-chips.component';

const filters: CatalogFilters = {
  sort: 'newest',
  page: 1,
  category: 'sneakers',
  size: '42',
  minPrice: 20000,
  maxPrice: 50000,
  q: 'air',
};

const facets: CatalogFacets = {
  categories: [{ id: '1', name: 'Sneakers', slug: 'sneakers', count: 4 }],
  brands: [],
  sizes: [],
  colors: [],
  availability: { inStock: 20, outOfStock: 0 },
  promotion: { active: 0, inactive: 20 },
  price: { min: 8000, max: 33500 },
};

async function create() {
  const fixture = TestBed.configureTestingModule({
    imports: [ActiveFiltersChipsComponent],
  }).createComponent(ActiveFiltersChipsComponent);
  fixture.componentRef.setInput('filters', filters);
  fixture.componentRef.setInput('facets', facets);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

describe('ActiveFiltersChipsComponent', () => {
  it('renders one removable chip per active filter with readable labels', async () => {
    const fixture = await create();
    const element = fixture.nativeElement as HTMLElement;
    const chips = Array.from(element.querySelectorAll('.active-filters__item button'));

    expect(chips).toHaveLength(4);
    expect(element.textContent).toContain('Sneakers');
    expect(element.textContent).toContain('Pointure 42');
    // Intl insère des espaces fines insécables dans les montants.
    expect(element.textContent?.replace(/[\u202f\u00a0]/g, ' ')).toContain('20 000 FCFA');
    expect(element.textContent).toContain('Recherche : « air »');
    expect(chips[0].getAttribute('aria-label')).toBe('Supprimer le filtre Sneakers');
  });

  it('emits the removed filter key and the global reset', async () => {
    const fixture = await create();
    let removed: CatalogFilterKey | undefined;
    let reset = false;
    fixture.componentInstance.remove.subscribe((key) => (removed = key));
    fixture.componentInstance.reset.subscribe(() => (reset = true));

    (
      fixture.nativeElement.querySelector('.active-filters__item button') as HTMLButtonElement
    ).click();
    (fixture.nativeElement.querySelector('.active-filters__reset') as HTMLButtonElement).click();

    expect(removed).toBe('category');
    expect(reset).toBe(true);
  });

  it('renders nothing without active filters', async () => {
    const fixture = TestBed.configureTestingModule({
      imports: [ActiveFiltersChipsComponent],
    }).createComponent(ActiveFiltersChipsComponent);
    fixture.componentRef.setInput('filters', { sort: 'newest', page: 1 });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.active-filters')).toBeNull();
  });
});
