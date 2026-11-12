import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import type { CatalogCategory } from '@bruny/data-access';
import { CategoriesPillsComponent } from './categories-pills.component';

const category: CatalogCategory = {
  id: '1',
  name: 'Mocassins',
  slug: 'mocassins',
  position: 1,
  parent: null,
  children: [],
};

describe('CategoriesPillsComponent', () => {
  function create() {
    return TestBed.configureTestingModule({
      imports: [CategoriesPillsComponent],
      providers: [provideRouter([])],
    }).createComponent(CategoriesPillsComponent);
  }

  it('renders one pill per category with its aria-label', async () => {
    const fixture = create();
    fixture.componentRef.setInput('categories', [category]);
    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const link = element.querySelector<HTMLAnchorElement>('a.pill');
    expect(link?.textContent).toContain('Mocassins');
    expect(link?.getAttribute('aria-label')).toBe('Voir le rayon Mocassins');
  });

  it('shows skeletons while loading', () => {
    const fixture = create();
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.pill--skeleton').length).toBe(5);
  });

  it('shows the error and emits retry', () => {
    const fixture = create();
    fixture.componentRef.setInput('error', 'Impossible de charger les catégories. Réessayez.');
    const retry = vi.fn();
    fixture.componentInstance.retry.subscribe(retry);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Impossible de charger');
    element.querySelector<HTMLButtonElement>('.rayons__retry')?.click();
    expect(retry).toHaveBeenCalledOnce();
  });
});
