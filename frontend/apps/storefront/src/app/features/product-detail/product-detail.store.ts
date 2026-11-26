import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  CatalogApi,
  type CatalogColor,
  type CatalogImage,
  type CatalogProductDetail,
  type CatalogSize,
  type CatalogDetailVariant,
} from '@bruny/data-access';
import { CartStore } from '../../core/cart/cart.store';

/** Seuil repris du seed (`lowStockThreshold = 5`) pour les variantes. */
const LOW_STOCK_THRESHOLD = 5;

@Injectable()
export class ProductDetailStore {
  private readonly catalogApi = inject(CatalogApi);
  private readonly cartStore = inject(CartStore);

  private readonly productState = signal<CatalogProductDetail | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly selectedColorState = signal<string | null>(null);
  private readonly selectedSizeState = signal<string | null>(null);
  private readonly quantityState = signal(1);
  private readonly activeImageIndexState = signal(0);

  readonly product = this.productState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly selectedColor = this.selectedColorState.asReadonly();
  readonly selectedSize = this.selectedSizeState.asReadonly();
  readonly quantity = this.quantityState.asReadonly();
  readonly activeImageIndex = this.activeImageIndexState.asReadonly();

  readonly selectedColorOption = computed<CatalogColor | null>(() => {
    const slug = this.selectedColorState();
    if (slug === null) return null;
    return this.productState()?.colors.find((color) => color.slug === slug) ?? null;
  });

  readonly selectedVariant = computed<CatalogDetailVariant | null>(() => {
    const product = this.productState();
    const color = this.selectedColorOption();
    const size = this.selectedSizeState();
    if (product === null || color === null || size === null) return null;
    return (
      product.variants.find((variant) => variant.color === color.color && variant.size === size) ??
      null
    );
  });

  readonly galleryImages = computed<CatalogImage[]>(() => {
    const product = this.productState();
    if (product === null) return [];

    const color =
      this.selectedColorOption() ??
      product.colors.find((item) => item.hasStock) ??
      product.colors[0] ??
      null;

    if (color !== null && color.images.length > 0) return color.images;

    return product.images.filter((image) => image.variantColor === null);
  });

  readonly activeImage = computed<CatalogImage | null>(
    () => this.galleryImages()[this.activeImageIndexState()] ?? null,
  );

  readonly sizesForSelectedColor = computed<CatalogSize[]>(() => {
    const product = this.productState();
    if (product === null) return [];
    const color = this.selectedColorOption();
    if (color === null) return product.sizes;

    return product.sizes.map((size) => {
      const variant = product.variants.find(
        (item) => item.color === color.color && item.size === size.size,
      );
      const availableStock = variant?.availableStock ?? 0;
      return {
        size: size.size,
        availableStock,
        isAvailable: availableStock > 0,
        isLowStock: availableStock > 0 && availableStock <= LOW_STOCK_THRESHOLD,
      };
    });
  });

  readonly maxQuantity = computed(() => {
    const stock = this.selectedVariant()?.availableStock ?? 0;
    return Math.max(1, stock);
  });

  readonly canAddToCart = computed(() => {
    const variant = this.selectedVariant();
    return variant !== null && variant.availableStock > 0;
  });

  readonly addToCartMessage = computed(() => {
    if (this.productState() === null) return '';
    const color = this.selectedColorState();
    const size = this.selectedSizeState();
    if (color === null && size === null) return 'Sélectionnez une couleur et une pointure';
    if (color === null) return 'Sélectionnez une couleur';
    if (size === null) return 'Sélectionnez une pointure';
    const variant = this.selectedVariant();
    if (variant === null || variant.availableStock <= 0) return 'Rupture de stock';
    return '';
  });

  readonly promoPercent = computed(() => {
    // Pourcentage fourni par l'API (CAT-12) : aucun recalcul côté client.
    const product = this.productState();
    if (product === null || !product.isPromoActive) return 0;
    return product.discountPercent ?? 0;
  });

  /** Prix de la couleur sélectionnée, même sans pointure (CA #2). */
  readonly selectedColorPrice = computed(() => {
    const product = this.productState();
    if (product === null) return 0;
    const color = this.selectedColorOption();
    if (color === null) return product.effectivePrice;

    const variants = product.variants.filter((variant) => variant.color === color.color);
    const available = variants.filter((variant) => variant.availableStock > 0);
    const prices = (available.length > 0 ? available : variants).map(
      (variant) => variant.effectivePrice,
    );
    return prices.length > 0 ? Math.min(...prices) : product.effectivePrice;
  });

  readonly displayPrice = computed(() => {
    const variant = this.selectedVariant();
    if (variant !== null) return variant.effectivePrice;
    return this.selectedColorPrice();
  });

  readonly compareAtPrice = computed(() => {
    const product = this.productState();
    if (product === null || !product.isPromoActive) return null;
    return product.basePrice;
  });

  async load(slug: string): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);
    this.productState.set(null);
    this.selectedColorState.set(null);
    this.selectedSizeState.set(null);
    this.quantityState.set(1);
    this.activeImageIndexState.set(0);

    try {
      const product = await firstValueFrom(this.catalogApi.get(slug));
      this.productState.set(product);
      const firstColor = product.colors.find((color) => color.hasStock) ?? product.colors[0];
      if (firstColor !== undefined) this.selectedColorState.set(firstColor.slug);
    } catch {
      this.errorState.set('Impossible de charger le produit. Vérifiez votre connexion.');
    } finally {
      this.loadingState.set(false);
    }
  }

  selectColor(slug: string | null): void {
    this.selectedColorState.set(slug);
    this.activeImageIndexState.set(0);

    const size = this.selectedSizeState();
    if (size !== null) {
      const color = this.selectedColorOption();
      const variant = this.productState()?.variants.find(
        (item) => item.color === color?.color && item.size === size,
      );
      if (variant === undefined || variant.availableStock <= 0) {
        this.selectedSizeState.set(null);
      }
    }

    this.clampQuantity();
  }

  selectSize(size: string): void {
    this.selectedSizeState.set(size);
    this.clampQuantity();
  }

  setActiveImage(index: number): void {
    const length = this.galleryImages().length;
    if (length === 0) {
      this.activeImageIndexState.set(0);
      return;
    }
    this.activeImageIndexState.set(Math.max(0, Math.min(index, length - 1)));
  }

  setQuantity(quantity: number): void {
    const parsed = Number.isFinite(quantity) ? Math.floor(quantity) : 1;
    this.quantityState.set(Math.max(1, Math.min(parsed, this.maxQuantity())));
  }

  addToCart(): boolean {
    const product = this.productState();
    const variant = this.selectedVariant();
    if (product === null || variant === null || variant.availableStock <= 0) return false;

    const image = this.activeImage() ?? product.images[0] ?? null;
    this.cartStore.addLine({
      variantId: variant.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      variantSku: variant.sku,
      size: variant.size,
      color: variant.color,
      quantity: this.quantityState(),
      unitPriceAtAdd: variant.effectivePrice,
      imageUrl: image?.url ?? null,
      imageAlt: image?.alt ?? product.name,
    });
    return true;
  }

  private clampQuantity(): void {
    this.quantityState.set(Math.max(1, Math.min(this.quantityState(), this.maxQuantity())));
  }
}
