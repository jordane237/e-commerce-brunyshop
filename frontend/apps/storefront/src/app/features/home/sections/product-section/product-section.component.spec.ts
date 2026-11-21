import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import type { CatalogProduct } from '@bruny/data-access';
import { ProductSectionComponent } from './product-section.component';

const product: CatalogProduct = {
  id: '1',
  name: 'Mocassin',
  slug: 'mocassin',
  description: '',
  basePrice: 20000,
  effectivePrice: 18000,
  promoPrice: 18000,
  promoStart: null,
  promoEnd: null,
  isPromoActive: true,
  inStock: true,
  category: { id: '1', name: 'Mocassins', slug: 'mocassins' },
  brand: { id: '1', name: 'Bruny', slug: 'bruny', logo: null },
  images: [{ id: '1', url: '/images/hero-home.png', alt: null, position: 0 }],
  variants: [],
};

describe('ProductSectionComponent', () => {
  function create() {
    const fixture = TestBed.configureTestingModule({
      imports: [ProductSectionComponent],
      providers: [provideRouter([])],
    }).createComponent(ProductSectionComponent);
    fixture.componentRef.setInput('title', 'Nouveautés de la Semaine');
    return fixture;
  }

  it('renders a product card per product and an accessible heading', async () => {
    const fixture = create();
    fixture.componentRef.setInput('products', [product]);
    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const heading = element.querySelector('h2');
    expect(heading?.textContent).toContain('Nouveautés de la Semaine');
    expect(heading?.id).toBe('home-section-nouveaut-s-de-la-semaine');
    expect(element.querySelectorAll('bruny-product-card').length).toBe(1);
  });

  it('renders four skeletons while loading', () => {
    const fixture = create();
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.surface-card').length).toBe(4);
  });

  it('shows the empty message', () => {
    const fixture = create();
    fixture.componentRef.setInput('products', []);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Aucun produit pour le moment.',
    );
  });

  it('emits retry from the error state', () => {
    const fixture = create();
    fixture.componentRef.setInput('error', 'Impossible de charger les promotions. Réessayez.');
    const retry = vi.fn();
    fixture.componentInstance.retry.subscribe(retry);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="alert"]')).not.toBeNull();
    element.querySelector<HTMLButtonElement>('.section__retry')?.click();
    expect(retry).toHaveBeenCalledOnce();
  });
});
