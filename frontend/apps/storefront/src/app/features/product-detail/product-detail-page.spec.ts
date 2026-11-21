import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { CatalogProductDetail } from '@bruny/data-access';
import { APP_CONFIG, DEFAULT_APP_CONFIG } from '../../core/app-config';
import { MetaPixelService } from '../../core/services/meta-pixel.service';
import { SeoService } from '../../core/seo.service';
import { ProductDetailPage } from './product-detail-page';
import { ProductDetailStore } from './product-detail.store';

const product: CatalogProductDetail = {
  id: 'product-1',
  slug: 'mocassin-cuir',
  name: 'Mocassin Cuir',
  description: 'Mocassin en cuir véritable, confortable au quotidien.',
  seoTitle: 'Mocassin Cuir — Bruny',
  seoDescription: 'Mocassin en cuir véritable.',
  basePrice: 30000,
  effectivePrice: 25000,
  promoPrice: 25000,
  promoStart: '2026-11-01T00:00:00.000Z',
  promoEnd: '2026-12-01T00:00:00.000Z',
  isPromoActive: true,
  inStock: true,
  category: { id: 'category-1', name: 'Mocassins', slug: 'mocassins' },
  brand: { id: 'brand-1', name: 'Bruny', slug: 'bruny', logo: null },
  images: [
    { id: 'img-1', url: '/1.jpg', alt: 'Vue 1', position: 0, variantColor: null },
    { id: 'img-2', url: '/2.jpg', alt: 'Vue 2', position: 1, variantColor: null },
  ],
  colors: [
    {
      color: 'NOIR',
      slug: 'noir',
      images: [
        { id: 'img-1', url: '/1.jpg', alt: 'Vue 1', position: 0, variantColor: null },
        { id: 'img-2', url: '/2.jpg', alt: 'Vue 2', position: 1, variantColor: null },
      ],
      availableSizes: ['41'],
      hasStock: true,
    },
  ],
  sizes: [{ size: '41', availableStock: 3, isAvailable: true, isLowStock: true }],
  variants: [
    {
      id: 'variant-1',
      sku: 'SKU-1',
      size: '41',
      color: 'NOIR',
      effectivePrice: 25000,
      availableStock: 3,
      isAvailable: true,
    },
  ],
  similarProducts: [
    {
      id: 'similar-1',
      name: 'Richelieu Cuir',
      slug: 'richelieu-cuir',
      basePrice: 28000,
      effectivePrice: 28000,
      promoPrice: null,
      promoStart: null,
      promoEnd: null,
      isPromoActive: false,
      inStock: true,
      category: { id: 'category-1', name: 'Mocassins', slug: 'mocassins' },
      brand: { id: 'brand-1', name: 'Bruny', slug: 'bruny', logo: null },
      images: [{ id: 's-img', url: '/s.jpg', alt: 'Richelieu', position: 0, variantColor: null }],
    },
  ],
};

function createStoreMock() {
  const productState = signal<CatalogProductDetail | null>(product);
  const loadingState = signal(false);
  const errorState = signal<string | null>(null);
  const selectedColorState = signal<string | null>('noir');
  const selectedSizeState = signal<string | null>(null);
  const quantityState = signal(1);
  const activeImageIndexState = signal(0);

  const selectedVariant = computed(() => {
    if (selectedSizeState() === null) return null;
    return product.variants[0] ?? null;
  });

  return {
    product: productState.asReadonly(),
    loading: loadingState.asReadonly(),
    error: errorState.asReadonly(),
    selectedColor: selectedColorState.asReadonly(),
    selectedSize: selectedSizeState.asReadonly(),
    selectedVariant,
    quantity: quantityState.asReadonly(),
    activeImageIndex: activeImageIndexState.asReadonly(),
    galleryImages: computed(() => product.colors[0]?.images ?? []),
    activeImage: computed(() => product.colors[0]?.images[0] ?? null),
    sizesForSelectedColor: computed(() => product.sizes),
    maxQuantity: computed(() => 3),
    canAddToCart: computed(() => selectedSizeState() !== null),
    addToCartMessage: computed(() =>
      selectedSizeState() === null ? 'Sélectionnez une pointure' : '',
    ),
    displayPrice: computed(() => 25000),
    compareAtPrice: computed(() => 30000),
    promoPercent: computed(() => 17),
    load: vi.fn(async () => undefined),
    selectColor: vi.fn((slug: string) => selectedColorState.set(slug)),
    selectSize: vi.fn((size: string) => selectedSizeState.set(size)),
    setQuantity: vi.fn((quantity: number) => quantityState.set(quantity)),
    setActiveImage: vi.fn((index: number) => activeImageIndexState.set(index)),
    addToCart: vi.fn(() => true),
    __set: {
      loading: loadingState.set,
      error: errorState.set,
      product: productState.set,
    },
  };
}

function createPage(store = createStoreMock()) {
  const seo = { setPageMeta: vi.fn() };
  const metaPixel = {
    trackViewContent: vi.fn(),
    trackAddToCart: vi.fn(),
  };
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [ProductDetailPage],
    providers: [
      provideRouter([]),
      { provide: ProductDetailStore, useValue: store },
      { provide: SeoService, useValue: seo },
      { provide: MetaPixelService, useValue: metaPixel },
      { provide: APP_CONFIG, useValue: DEFAULT_APP_CONFIG },
      {
        provide: ActivatedRoute,
        useValue: { paramMap: of(convertToParamMap({ slug: 'mocassin-cuir' })) },
      },
    ],
  });
  const fixture = TestBed.createComponent(ProductDetailPage);
  fixture.detectChanges();
  return { fixture, store, seo, metaPixel };
}

describe('ProductDetailPage', () => {
  it('charge le produit depuis le slug de la route', () => {
    const { store } = createPage();

    expect(store.load).toHaveBeenCalledWith('mocassin-cuir');
  });

  it('affiche les squelettes pendant le chargement', () => {
    const store = createStoreMock();
    store.__set.loading(true);
    const { fixture } = createPage(store);
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Chargement de la fiche produit');
    expect(element.querySelector('bruny-skeleton')).not.toBeNull();
  });

  it('affiche l’état « Produit introuvable » en erreur', () => {
    const store = createStoreMock();
    store.__set.error('404');
    const { fixture } = createPage(store);

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Produit introuvable');
  });

  it('affiche la galerie, les sélecteurs, les onglets, les similaires et la barre fixe', () => {
    const { fixture } = createPage();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('app-product-gallery')).not.toBeNull();
    expect(element.querySelector('app-color-selector')).not.toBeNull();
    expect(element.querySelector('bruny-size-selector')).not.toBeNull();
    expect(element.querySelector('bruny-tabs')).not.toBeNull();
    expect(element.querySelectorAll('bruny-product-card')).toHaveLength(1);
    expect(element.querySelector('app-sticky-buy-bar')).not.toBeNull();
    expect(element.textContent?.replace(/\s/g, ' ')).toContain('25 000 FCFA');
  });

  it('applique les métadonnées SEO et le JSON-LD Product', async () => {
    const { fixture, seo } = createPage();
    await fixture.whenStable();
    await Promise.resolve();

    expect(seo.setPageMeta).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Mocassin Cuir — Bruny',
        canonicalPath: '/produit/mocassin-cuir',
        ogType: 'product',
        jsonLd: expect.objectContaining({
          '@type': 'Product',
          name: 'Mocassin Cuir',
        }),
      }),
    );
  });

  it('envoie ViewContent après le chargement de la fiche', async () => {
    const { fixture, metaPixel } = createPage();
    await fixture.whenStable();
    await Promise.resolve();

    expect(metaPixel.trackViewContent).toHaveBeenCalledWith(product);
  });

  it('transmet les sélections de couleur et de pointure au store', () => {
    const { fixture, store } = createPage();
    const page = fixture.componentInstance;

    page.onColorSelect('noir');
    page.onSizeSelect('41');
    page.onQuantityChange(2);
    page.onImageChange(1);

    expect(store.selectColor).toHaveBeenCalledWith('noir');
    expect(store.selectSize).toHaveBeenCalledWith('41');
    expect(store.setQuantity).toHaveBeenCalledWith(2);
    expect(store.setActiveImage).toHaveBeenCalledWith(1);
  });

  it('ajoute au panier via le store et envoie AddToCart', () => {
    const { fixture, store, metaPixel } = createPage();
    fixture.componentInstance.onSizeSelect('41');

    fixture.componentInstance.onAddToCart();

    expect(store.addToCart).toHaveBeenCalledOnce();
    expect(metaPixel.trackAddToCart).toHaveBeenCalledWith(product, product.variants[0], 1);
  });

  it('n’envoie pas AddToCart si le store refuse l’ajout', () => {
    const store = createStoreMock();
    store.addToCart.mockReturnValue(false);
    const { fixture, metaPixel } = createPage(store);

    fixture.componentInstance.onAddToCart();

    expect(metaPixel.trackAddToCart).not.toHaveBeenCalled();
  });

  it('ouvre la modale de zoom', () => {
    const { fixture } = createPage();
    fixture.componentInstance.zoomOpen.set(true);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')).not.toBeNull();
  });
});
