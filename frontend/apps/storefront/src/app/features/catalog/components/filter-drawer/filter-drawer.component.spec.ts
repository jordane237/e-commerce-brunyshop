import { TestBed } from '@angular/core/testing';
import { CatalogFacets } from '@bruny/data-access';
import { describe, expect, it } from 'vitest';
import { CatalogFilters } from '../../catalog-query';
import { FilterDrawerComponent } from './filter-drawer.component';

const filters: CatalogFilters = { sort: 'newest', page: 1, category: 'sneakers' };
const facets: CatalogFacets = {
  categories: [
    { id: '1', name: 'Sneakers', slug: 'sneakers', count: 4 },
    { id: '2', name: 'Sandales', slug: 'sandales', count: 3 },
  ],
  brands: [],
  sizes: [{ value: '42', count: 20 }],
  colors: [],
  availability: { inStock: 20, outOfStock: 0 },
  promotion: { active: 0, inactive: 20 },
  price: { min: 8000, max: 33500 },
};

async function create(open: boolean) {
  const fixture = TestBed.configureTestingModule({
    imports: [FilterDrawerComponent],
  }).createComponent(FilterDrawerComponent);
  fixture.componentRef.setInput('open', open);
  fixture.componentRef.setInput('filters', filters);
  fixture.componentRef.setInput('facets', facets);
  fixture.componentRef.setInput('total', 4);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

describe('FilterDrawerComponent', () => {
  it('renders nothing when closed', async () => {
    const fixture = await create(false);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders an accessible dialog with the filters and result count', async () => {
    const fixture = await create(true);
    const element = fixture.nativeElement as HTMLElement;
    const dialog = element.querySelector('[role="dialog"]');

    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-labelledby')).toBe('catalog-filter-title');
    expect(element.querySelectorAll('bruny-filter-sidebar')).toHaveLength(1);
    expect(element.textContent).toContain('Voir les 4 résultats');
    expect(fixture.componentInstance['document'].body.style.overflow).toBe('hidden');
  });

  it('closes through the button and Escape', async () => {
    const fixture = await create(true);
    let closed = 0;
    fixture.componentInstance.closed.subscribe(() => (closed += 1));

    (fixture.nativeElement.querySelector('.drawer__close') as HTMLButtonElement).click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(closed).toBe(2);
  });

  it('relays filter changes and reset from the embedded sidebar', async () => {
    const fixture = await create(true);
    let patch: Partial<CatalogFilters> | undefined;
    let reset = false;
    fixture.componentInstance.filtersChange.subscribe((value) => (patch = value));
    fixture.componentInstance.reset.subscribe(() => (reset = true));

    (fixture.nativeElement.querySelector('#drawer-category-sandales') as HTMLInputElement).click();
    (fixture.nativeElement.querySelector('.sidebar__reset') as HTMLButtonElement).click();

    expect(patch).toEqual({ category: 'sandales' });
    expect(reset).toBe(true);
  });
});
