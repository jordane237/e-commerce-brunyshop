import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { CatalogHeaderComponent } from './catalog-header.component';

async function create() {
  const fixture = TestBed.configureTestingModule({
    imports: [CatalogHeaderComponent],
    providers: [provideRouter([])],
  }).createComponent(CatalogHeaderComponent);
  fixture.componentRef.setInput('title', 'Sneakers');
  fixture.componentRef.setInput('total', 4);
  fixture.componentRef.setInput('activeFilterCount', 2);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

describe('CatalogHeaderComponent', () => {
  it('renders the breadcrumb, title, count and filter counter', async () => {
    const fixture = await create();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Sneakers');
    expect(element.querySelector('.heading__count')?.textContent).toContain('4 produits');
    expect(element.querySelector('.toolbar__filters')?.textContent).toContain('Filtres (2)');
    expect(element.querySelectorAll('.breadcrumb__list li')).toHaveLength(5);
  });

  it('uses the singular for one product', async () => {
    const fixture = await create();
    fixture.componentRef.setInput('total', 1);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.heading__count')?.textContent).toContain(
      '1 produit',
    );
  });

  it('emits filters opening and search input', async () => {
    const fixture = await create();
    let opened = false;
    let searched = '';
    fixture.componentInstance.openFilters.subscribe(() => (opened = true));
    fixture.componentInstance.searchChange.subscribe((value) => (searched = value));

    (fixture.nativeElement.querySelector('.toolbar__filters') as HTMLButtonElement).click();
    const input = fixture.nativeElement.querySelector('.search__input') as HTMLInputElement;
    input.value = 'mocassin';
    input.dispatchEvent(new Event('input'));

    expect(opened).toBe(true);
    expect(searched).toBe('mocassin');
  });
});
