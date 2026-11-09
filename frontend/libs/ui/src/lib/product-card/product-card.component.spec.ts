import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { ProductCardComponent } from './product-card.component';
import type { CatalogProduct } from '@bruny/data-access';

const PRODUCT: CatalogProduct = {
  id: 'prod-1',
  name: 'Mocassin Cuir Glacé Noir Prestige',
  slug: 'mocassin-cuir-glace-noir-prestige',
  description: "Le mocassin Prestige Imperial incarne l'excellence du vestiaire masculin formel.",
  basePrice: 32000,
  effectivePrice: 24500,
  promoPrice: 24500,
  promoStart: '2026-10-01T00:00:00.000Z',
  promoEnd: '2026-12-31T23:59:59.000Z',
  isPromoActive: true,
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

describe('ProductCardComponent', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function create(overrides: Partial<Record<keyof ProductCardHostComponent, unknown>> = {}) {
    await TestBed.configureTestingModule({
      imports: [ProductCardHostComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProductCardHostComponent);
    await fixture.whenStable();
    for (const [key, value] of Object.entries(overrides)) {
      (fixture.componentInstance as Record<string, never>)[key] = value as never;
    }
    await fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('renders the product identity and links to its slug', async () => {
    const { nativeElement, fixture } = await create();
    const card = nativeElement.querySelector('.bs-product-card') as HTMLElement;
    const title = card?.querySelector('.bs-product-card__title') as HTMLElement;
    const link = title?.querySelector('a');

    expect(card).not.toBeNull();
    expect(title?.textContent).toContain('Mocassin Cuir Glacé Noir Prestige');
    expect(link?.getAttribute('href')).toContain('/produit/mocassin-cuir-glace-noir-prestige');
    expect(link?.getAttribute('aria-label')).toContain('Voir');
    await fixture.detectChanges();
  });

  it('shows the category, price and available sizes', async () => {
    const { nativeElement } = await create();
    const card = nativeElement.querySelector('.bs-product-card') as HTMLElement;

    expect(card?.querySelector('.bs-product-card__category')?.textContent).toContain(
      'Chaussures Homme',
    );
    expect(card?.textContent).toContain('24 500 FCFA');
    expect(card?.querySelector('.bs-product-card__sizes-label')?.textContent).toContain(
      'Pointures disponibles',
    );
  });

  it('derives the discount and shows the promo badge when applicable', async () => {
    const { nativeElement } = await create({
      product: {
        ...PRODUCT,
        basePrice: 32000,
        effectivePrice: 24500,
        promoPrice: 24500,
      } as CatalogProduct,
    });
    const badge = nativeElement.querySelector('.bs-badge--promo');

    expect(badge).not.toBeNull();
    expect(badge?.textContent).toContain('-');
  });

  it('does not show a promo badge when there is no discount', async () => {
    const { nativeElement } = await create({
      product: {
        ...PRODUCT,
        basePrice: 24500,
        effectivePrice: 24500,
        promoPrice: null,
        isPromoActive: false,
      } as CatalogProduct,
    });

    expect(nativeElement.querySelector('.bs-badge--promo')).toBeNull();
  });

  it('shows the new badge when the product is new', async () => {
    const { nativeElement } = await create({ isNew: true });

    expect(nativeElement.querySelector('.bs-badge--new')).not.toBeNull();
  });

  it('renders skeleton loaders when loading', async () => {
    const { nativeElement } = await create({ loading: true });
    const card = nativeElement.querySelector('.bs-product-card') as HTMLElement;

    expect(card?.querySelector('bruny-skeleton')).not.toBeNull();
    expect(card?.querySelector('.bs-product-card__title')).toBeNull();
    expect(card?.querySelector('a[href]')).toBeNull();
  });

  it('sets aria-busy while loading', async () => {
    const { nativeElement } = await create({ loading: true });
    const article = nativeElement.querySelector('article') as HTMLElement;

    expect(article?.getAttribute('aria-busy')).toBe('true');
  });

  it('shows the favorite action with a dynamic label', async () => {
    const { nativeElement } = await create({ favorite: true });

    const button = nativeElement.querySelector('.bs-product-card__favorite') as HTMLButtonElement;
    expect(button?.getAttribute('aria-pressed')).toBe('true');
    expect(button?.getAttribute('aria-label')).toContain('Retirer des favoris');
  });

  it('toggles the favorite state and emits the new value', async () => {
    const { nativeElement, componentInstance, fixture } = await create({ favorite: false });
    const button = nativeElement.querySelector('.bs-product-card__favorite') as HTMLButtonElement;

    button.click();
    await fixture.whenStable?.();
    fixture.detectChanges();
    await Promise.resolve();

    expect(componentInstance.favorited()).toBe(true);
    expect(componentInstance.favorite()).toBe(true);
  });

  it('returns focus to the card image link on keyboard navigation', async () => {
    const { nativeElement } = await create();
    const imageLink = nativeElement.querySelector('.bs-product-card__image-link') as HTMLElement;

    imageLink?.focus();
    await fixture.whenStable?.();

    expect(document.activeElement).toBe(imageLink);
  });

  it('emits the add event when the add button is shown and clicked', async () => {
    const { nativeElement, componentInstance } = await create({ showAdd: true });
    const addButton = nativeElement.querySelector('.bruny-button') as HTMLButtonElement;

    expect(addButton).not.toBeNull();
    addButton?.click();
    await fixture.whenStable?.();

    expect(componentInstance.added()).toBe(true);
  });

  it('does not show the add button by default', async () => {
    const { nativeElement } = await create({ showAdd: false });

    expect(nativeElement.querySelector('.bruny-button')).toBeNull();
  });

  it('limits the visible sizes to five and shows the overflow label', async () => {
    const { nativeElement } = await create({
      product: {
        ...PRODUCT,
        variants: Array.from({ length: 7 }, (_, index) => ({
          ...PRODUCT.variants[0],
          id: `var-${index}`,
          size: String(35 + index),
          availableStock: index < 7 ? 3 : 0,
          isAvailable: index < 7,
        })),
      } as CatalogProduct,
    });
    const sizeList = nativeElement.querySelector('.bs-product-card__size-list') as HTMLElement;

    expect(sizeList?.children.length).toBeGreaterThanOrEqual(5);
    expect(sizeList?.textContent).toContain('+');
  });

  it('can hide the sizes section when showSizes is false', async () => {
    const { nativeElement } = await create({ showSizes: false });

    expect(nativeElement.querySelector('.bs-product-card__sizes')).toBeNull();
  });

  it('uses the product name as the image alt when no explicit alt exists', async () => {
    const { nativeElement } = await create({
      product: {
        ...PRODUCT,
        images: [{ id: 'img-1', url: 'https://example.com/mocassin.jpg', alt: null, position: 0 }],
      } as CatalogProduct,
    });
    const image = nativeElement.querySelector('img') as HTMLImageElement;

    expect(image?.alt).toBe('Mocassin Cuir Glacé Noir Prestige');
  });

  it('renders a placeholder when the product has no image', async () => {
    const { nativeElement } = await create({
      product: {
        ...PRODUCT,
        images: [],
      } as CatalogProduct,
    });
    const placeholder = nativeElement.querySelector('.bs-product-card__placeholder');

    expect(placeholder).not.toBeNull();
    expect(nativeElement.querySelector('img')).toBeNull();
  });
});
