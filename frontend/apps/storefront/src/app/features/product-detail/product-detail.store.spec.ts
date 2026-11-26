import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogApi, type CatalogProductDetail } from '@bruny/data-access';
import { CartStore } from '../../core/cart/cart.store';
import { ProductDetailStore } from './product-detail.store';

const product: CatalogProductDetail = {
  id: 'product-1',
  slug: 'mocassin-cuir',
  name: 'Mocassin Cuir',
  description: 'Mocassin en cuir véritable.',
  seoTitle: 'Mocassin Cuir — BrunyShop',
  seoDescription: 'Mocassin en cuir véritable, confortable.',
  basePrice: 30000,
  effectivePrice: 25000,
  promoPrice: 25000,
  promoStart: '2026-11-01T00:00:00.000Z',
  promoEnd: '2026-12-01T00:00:00.000Z',
  isPromoActive: true,
  discountPercent: 17,
  inStock: true,
  category: { id: 'category-1', name: 'Mocassins', slug: 'mocassins' },
  brand: { id: 'brand-1', name: 'Bruny', slug: 'bruny', logo: null },
  images: [
    { id: 'img-common', url: '/common.jpg', alt: 'Vue commune', position: 0, variantColor: null },
    { id: 'img-noir', url: '/noir.jpg', alt: 'Vue noire', position: 1, variantColor: 'NOIR' },
  ],
  colors: [
    {
      color: 'NOIR',
      slug: 'noir',
      images: [
        { id: 'img-noir', url: '/noir.jpg', alt: 'Vue noire', position: 1, variantColor: 'NOIR' },
        {
          id: 'img-common',
          url: '/common.jpg',
          alt: 'Vue commune',
          position: 0,
          variantColor: null,
        },
      ],
      availableSizes: ['41'],
      hasStock: true,
    },
    {
      color: 'BLANC',
      slug: 'blanc',
      images: [
        {
          id: 'img-blanc',
          url: '/blanc.jpg',
          alt: 'Vue blanche',
          position: 2,
          variantColor: 'BLANC',
        },
      ],
      availableSizes: [],
      hasStock: false,
    },
  ],
  sizes: [
    { size: '41', availableStock: 3, isAvailable: true, isLowStock: true },
    { size: '42', availableStock: 0, isAvailable: false, isLowStock: false },
  ],
  variants: [
    {
      id: 'variant-noir-41',
      sku: 'SKU-NOIR-41',
      size: '41',
      color: 'NOIR',
      effectivePrice: 25000,
      availableStock: 3,
      isAvailable: true,
    },
    {
      id: 'variant-noir-42',
      sku: 'SKU-NOIR-42',
      size: '42',
      color: 'NOIR',
      effectivePrice: 25000,
      availableStock: 0,
      isAvailable: false,
    },
    {
      id: 'variant-blanc-41',
      sku: 'SKU-BLANC-41',
      size: '41',
      color: 'BLANC',
      effectivePrice: 26000,
      availableStock: 0,
      isAvailable: false,
    },
  ],
  similarProducts: [],
};

describe('ProductDetailStore', () => {
  let store: ProductDetailStore;
  let get: ReturnType<typeof vi.fn>;
  let addLine: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    get = vi.fn(() => of(product));
    addLine = vi.fn();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ProductDetailStore,
        { provide: CatalogApi, useValue: { get } },
        { provide: CartStore, useValue: { addLine } },
      ],
    });
    store = TestBed.inject(ProductDetailStore);
  });

  it('charge le produit et sélectionne la première couleur disponible, pas la pointure', async () => {
    await store.load('mocassin-cuir');

    expect(get).toHaveBeenCalledWith('mocassin-cuir');
    expect(store.product()?.name).toBe('Mocassin Cuir');
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.selectedColor()).toBe('noir');
    expect(store.selectedSize()).toBeNull();
  });

  it('expose une erreur quand le chargement échoue', async () => {
    get.mockReturnValue(throwError(() => new Error('404')));

    await store.load('inconnu');

    expect(store.product()).toBeNull();
    expect(store.error()).toContain('Impossible de charger le produit');
    expect(store.loading()).toBe(false);
  });

  it('construit la galerie avec les images de la couleur et les images communes', async () => {
    await store.load('mocassin-cuir');

    expect(store.galleryImages().map((image) => image.id)).toEqual(['img-noir', 'img-common']);
    expect(store.activeImage()?.id).toBe('img-noir');
  });

  it('met à jour la galerie quand la couleur change', async () => {
    await store.load('mocassin-cuir');

    store.selectColor('blanc');

    expect(store.selectedColorOption()?.color).toBe('BLANC');
    expect(store.galleryImages().map((image) => image.id)).toEqual(['img-blanc']);
    expect(store.activeImageIndex()).toBe(0);
  });

  it('résout la variante à partir de la couleur et de la pointure', async () => {
    await store.load('mocassin-cuir');
    store.selectSize('41');

    expect(store.selectedVariant()?.id).toBe('variant-noir-41');
    expect(store.displayPrice()).toBe(25000);
  });

  it('met à jour le prix dès le changement de couleur, sans pointure', async () => {
    await store.load('mocassin-cuir');
    expect(store.displayPrice()).toBe(25000);

    store.selectColor('blanc');

    expect(store.selectedVariant()).toBeNull();
    expect(store.displayPrice()).toBe(26000);
  });

  it('désélectionne une pointure indisponible dans la nouvelle couleur', async () => {
    await store.load('mocassin-cuir');
    store.selectSize('41');

    store.selectColor('blanc');

    expect(store.selectedSize()).toBeNull();
    expect(store.canAddToCart()).toBe(false);
  });

  it('calcule les pointures disponibles pour la couleur sélectionnée', async () => {
    await store.load('mocassin-cuir');

    const sizes = store.sizesForSelectedColor();
    expect(sizes.find((size) => size.size === '41')?.availableStock).toBe(3);
    expect(sizes.find((size) => size.size === '42')?.isAvailable).toBe(false);

    store.selectColor('blanc');
    expect(store.sizesForSelectedColor().every((size) => !size.isAvailable)).toBe(true);
  });

  it('renvoie le bon message tant que la sélection est incomplète', async () => {
    await store.load('mocassin-cuir');
    store.selectColor(null);
    expect(store.addToCartMessage()).toBe('Sélectionnez une couleur et une pointure');

    store.selectColor('noir');
    expect(store.addToCartMessage()).toBe('Sélectionnez une pointure');

    store.selectSize('42');
    expect(store.addToCartMessage()).toBe('Rupture de stock');
  });

  it('autorise l’ajout uniquement pour une variante en stock', async () => {
    await store.load('mocassin-cuir');
    store.selectSize('42');
    expect(store.canAddToCart()).toBe(false);

    store.selectSize('41');
    expect(store.canAddToCart()).toBe(true);
  });

  it('borne la quantité au stock de la variante', async () => {
    await store.load('mocassin-cuir');
    store.selectSize('41');

    store.setQuantity(9);
    expect(store.quantity()).toBe(3);

    store.setQuantity(0);
    expect(store.quantity()).toBe(1);
  });

  it('ajoute la variante au panier avec les bonnes données', async () => {
    await store.load('mocassin-cuir');
    store.selectSize('41');
    store.setQuantity(2);

    expect(store.addToCart()).toBe(true);
    expect(addLine).toHaveBeenCalledWith({
      variantId: 'variant-noir-41',
      productId: 'product-1',
      productSlug: 'mocassin-cuir',
      productName: 'Mocassin Cuir',
      variantSku: 'SKU-NOIR-41',
      size: '41',
      color: 'NOIR',
      quantity: 2,
      unitPriceAtAdd: 25000,
      imageUrl: '/noir.jpg',
      imageAlt: 'Vue noire',
    });
  });

  it('refuse l’ajout sans variante valide', async () => {
    await store.load('mocassin-cuir');
    store.selectSize('42');

    expect(store.addToCart()).toBe(false);
    expect(addLine).not.toHaveBeenCalled();
  });

  it('calcule le pourcentage de promotion', async () => {
    await store.load('mocassin-cuir');

    expect(store.promoPercent()).toBe(17);
    expect(store.compareAtPrice()).toBe(30000);
  });
});
