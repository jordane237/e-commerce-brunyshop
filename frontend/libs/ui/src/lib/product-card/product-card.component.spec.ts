import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';
import type { CatalogProduct } from '@bruny/data-access';
import { ProductCardComponent } from './product-card.component';

const PRODUCT: CatalogProduct = {
  id: 'prod-1',
  name: 'Mocassin Cuir Glacé Noir Prestige',
  slug: 'mocassin-cuir-glace-noir-prestige',
  description: 'Mocassin en cuir pleine fleur.',
  basePrice: 32000,
  effectivePrice: 24500,
  promoPrice: 24500,
  promoStart: '2026-10-01T00:00:00.000Z',
  promoEnd: '2026-12-31T23:59:59.000Z',
  isPromoActive: true,
  discountPercent: 23,
  inStock: true,
  category: { id: 'cat-1', name: 'Chaussures Homme', slug: 'chaussures-homme' },
  brand: { id: 'brand-1', name: 'Bruny', slug: 'bruny', logo: null },
  images: [
    {
      id: 'img-1',
      url: 'https://example.com/mocassin.jpg',
      alt: 'Mocassin Cuir Glacé Noir',
      position: 0,
    },
  ],
  variants: [
    {
      id: 'var-1',
      sku: 'SKU-001',
      size: '41',
      color: 'Noir Ébène',
      availableStock: 5,
      isAvailable: true,
    },
  ],
};

@Component({
  standalone: true,
  imports: [ProductCardComponent],
  template: `
    <bruny-product-card
      [product]="product()"
      [loading]="loading()"
      [showSizes]="showSizes()"
      [showAdd]="showAdd()"
      [isNew]="isNew()"
      [favorite]="favorite()"
      (add)="added.set(true)"
      (favoriteChange)="favorited.set($event)"
    />
  `,
})
class ProductCardHostComponent {
  readonly product = signal(PRODUCT);
  readonly loading = signal(false);
  readonly showSizes = signal(true);
  readonly showAdd = signal(false);
  readonly isNew = signal(false);
  readonly favorite = signal(false);
  readonly added = signal(false);
  readonly favorited = signal(false);
}

function normalizeSpaces(value: string | null | undefined): string {
  return (value ?? '').replace(/[\u00a0\u202f]/g, ' ');
}

function setHostValue(instance: object, key: string, value: unknown): void {
  const record = instance as Record<string, unknown>;
  const current = record[key];
  if (typeof current === 'function' && 'set' in current) {
    (current as { set: (next: unknown) => void }).set(value);
    return;
  }
  record[key] = value;
}

describe('ProductCardComponent', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function create(overrides: Partial<Record<keyof ProductCardHostComponent, unknown>> = {}) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ProductCardHostComponent],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(ProductCardHostComponent);
    fixture.detectChanges();
    for (const [key, value] of Object.entries(overrides)) {
      setHostValue(fixture.componentInstance, key, value);
    }
    fixture.detectChanges();
    return {
      fixture,
      nativeElement: fixture.nativeElement as HTMLElement,
      componentInstance: fixture.componentInstance,
    };
  }

  it('renders the product identity, category and slug link', async () => {
    const { nativeElement } = await create();
    const link = nativeElement.querySelector('.bs-product-card__title a') as HTMLAnchorElement;

    expect(nativeElement.textContent).toContain('Mocassin Cuir Glacé Noir Prestige');
    expect(nativeElement.textContent).toContain('Chaussures Homme');
    expect(link.getAttribute('href')).toContain('/produit/mocassin-cuir-glace-noir-prestige');
    expect(link.getAttribute('aria-label')).toBeNull();
  });

  it('shows the price and available sizes', async () => {
    const { nativeElement } = await create();

    expect(normalizeSpaces(nativeElement.textContent)).toContain('24 500 FCFA');
    expect(nativeElement.textContent).toContain('Pointures disponibles');
    expect(nativeElement.textContent).toContain('41');
  });

  it('shows promo and new badges when applicable', async () => {
    const { nativeElement } = await create({ isNew: true });

    expect(nativeElement.textContent).toContain('-23%');
    expect(nativeElement.textContent).toContain('Nouveau');
  });

  it('does not show a promo badge without a discount', async () => {
    const { nativeElement } = await create({
      product: {
        ...PRODUCT,
        basePrice: 24500,
        effectivePrice: 24500,
        promoPrice: null,
        discountPercent: null,
      },
    });

    expect(nativeElement.querySelector('.bs-badge--promo')).toBeNull();
  });

  it('renders skeletons and hides the content while loading', async () => {
    const { nativeElement } = await create({ loading: true });

    expect(nativeElement.querySelector('bruny-skeleton')).not.toBeNull();
    expect(nativeElement.querySelector('.bs-product-card__title')).toBeNull();
    expect(nativeElement.querySelector('a[href]')).toBeNull();
  });

  it('toggles the favorite state', async () => {
    const { nativeElement, componentInstance, fixture } = await create();
    const button = nativeElement.querySelector('.bs-product-card__favorite') as HTMLButtonElement;

    expect(button.getAttribute('aria-label')).toBe('Ajouter aux favoris');
    button.click();
    fixture.detectChanges();

    expect(componentInstance.favorited()).toBe(true);
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('emits add only when the add button is shown', async () => {
    const { nativeElement, componentInstance, fixture } = await create({ showAdd: true });
    const add = nativeElement.querySelector('bruny-button button') as HTMLButtonElement;

    add.click();
    fixture.detectChanges();
    expect(componentInstance.added()).toBe(true);

    const hidden = await create({ showAdd: false });
    expect(hidden.nativeElement.querySelector('bruny-button')).toBeNull();
  });

  it('uses the product name as image alt and renders a placeholder without image', async () => {
    const { nativeElement } = await create({
      product: { ...PRODUCT, images: [{ ...PRODUCT.images[0], alt: null }] },
    });
    expect((nativeElement.querySelector('img') as HTMLImageElement).alt).toBe(
      'Mocassin Cuir Glacé Noir Prestige',
    );

    const placeholder = await create({ product: { ...PRODUCT, images: [] } });
    expect(placeholder.nativeElement.querySelector('.bs-product-card__placeholder')).not.toBeNull();
  });
});
