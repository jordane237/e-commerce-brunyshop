import { TestBed } from '@angular/core/testing';
import { CatalogFacets } from '@bruny/data-access';
import { describe, expect, it } from 'vitest';
import { CatalogFilters } from '../../catalog-query';
import { FilterSidebarComponent } from './filter-sidebar.component';

const filters: CatalogFilters = { sort: 'newest', page: 1, category: 'sneakers' };

const facets: CatalogFacets = {
  categories: [
    { id: '1', name: 'Sneakers', slug: 'sneakers', count: 4 },
    { id: '2', name: 'Sandales', slug: 'sandales', count: 3 },
  ],
  brands: [{ id: 'b1', name: 'Kepe', slug: 'kepe', count: 7 }],
  sizes: [
    { value: '42', count: 20 },
    { value: '40', count: 20 },
  ],
  colors: [{ value: 'NOIR', count: 5 }],
  availability: { inStock: 20, outOfStock: 0 },
  promotion: { active: 0, inactive: 20 },
  price: { min: 8000, max: 33500 },
};

async function create() {
  const fixture = TestBed.configureTestingModule({
    imports: [FilterSidebarComponent],
  }).createComponent(FilterSidebarComponent);
  fixture.componentRef.setInput('filters', filters);
  fixture.componentRef.setInput('facets', facets);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

describe('FilterSidebarComponent', () => {
  it('renders facet sections with counts and the active category', async () => {
    const fixture = await create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Catégories');
    expect(element.textContent).toContain('Sneakers');
    expect(element.textContent).toContain('Kepe');
    expect(element.textContent).toContain('42');
    expect(element.textContent).toContain('Noir');
    expect(element.textContent).not.toContain('NOIR');

    const checked = element.querySelector<HTMLInputElement>(
      '#desktop-category-sneakers',
    ) as HTMLInputElement;
    expect(checked.checked).toBe(true);
    expect(element.querySelector('.sidebar__reset')).not.toBeNull();
  });

  it('emits a category patch when another category is selected', async () => {
    const fixture = await create();
    let patch: Partial<CatalogFilters> | undefined;
    fixture.componentInstance.filtersChange.subscribe((value) => (patch = value));

    const sandales = fixture.nativeElement.querySelector<HTMLInputElement>(
      '#desktop-category-sandales',
    );
    sandales.click();

    expect(patch).toEqual({ category: 'sandales' });
  });

  it('toggles a size and removes it when clicked again', async () => {
    const fixture = await create();
    const patches: Array<Partial<CatalogFilters>> = [];
    fixture.componentInstance.filtersChange.subscribe((value) => patches.push(value));

    const sizeButton = Array.from(
      fixture.nativeElement.querySelectorAll<HTMLButtonElement>('.chip'),
    ).find((button) => button.textContent?.includes('42')) as HTMLButtonElement;
    sizeButton.click();

    expect(patches[0]).toEqual({ size: '42' });
  });

  it('emits both price bounds and swaps an inverted range', async () => {
    const fixture = await create();
    let patch: Partial<CatalogFilters> | undefined;
    fixture.componentInstance.filtersChange.subscribe((value) => (patch = value));

    const min = fixture.nativeElement.querySelector<HTMLInputElement>(
      '#desktop-price-min',
    ) as HTMLInputElement;
    const max = fixture.nativeElement.querySelector<HTMLInputElement>(
      '#desktop-price-max',
    ) as HTMLInputElement;
    min.value = '50000';
    max.value = '20000';
    min.dispatchEvent(new Event('change'));

    expect(patch).toEqual({ minPrice: 20000, maxPrice: 50000 });
  });

  it('emits availability and reset', async () => {
    const fixture = await create();
    let patch: Partial<CatalogFilters> | undefined;
    let reset = false;
    fixture.componentInstance.filtersChange.subscribe((value) => (patch = value));
    fixture.componentInstance.reset.subscribe(() => (reset = true));

    (fixture.nativeElement.querySelector('#desktop-in-stock') as HTMLInputElement).click();
    (fixture.nativeElement.querySelector('.sidebar__reset') as HTMLButtonElement).click();

    expect(patch).toEqual({ inStock: true });
    expect(reset).toBe(true);
  });
});
