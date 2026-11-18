import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { CatalogImage, CatalogProductDetail } from '@bruny/data-access';
import { FcfaPipe } from '@bruny/util';
import {
  BadgeComponent,
  ButtonComponent,
  EmptyStateComponent,
  ModalComponent,
  PriceTagComponent,
  ProductCardComponent,
  ReassuranceBandComponent,
  QuantitySelectorComponent,
  SizeSelectorComponent,
  SkeletonComponent,
  TabsComponent,
  type ReassurancePoint,
  type SizeSelectorItem,
  type TabItem,
} from '@bruny/ui';
import { APP_CONFIG } from '../../core/app-config';
import { SeoService } from '../../core/seo.service';
import { productSchema } from '../../core/structured-data';
import { ColorSelectorComponent } from './components/color-selector/color-selector.component';
import { ProductGalleryComponent } from './components/product-gallery/product-gallery.component';
import { StickyBuyBarComponent } from './components/sticky-buy-bar/sticky-buy-bar.component';
import { ProductDetailStore } from './product-detail.store';

const TABS: readonly TabItem[] = [
  { id: 'description', label: 'Description' },
  { id: 'delivery', label: 'Livraison' },
  { id: 'returns', label: 'Retours' },
];

const REASSURANCE: readonly ReassurancePoint[] = [
  {
    icon: 'check-circle',
    label: 'Paiement à la livraison',
    description: 'Payez une fois la paire reçue.',
  },
  {
    icon: 'refresh',
    label: 'Échange de pointure sous 7 jours',
    description: 'Un échange possible si la pointure ne convient pas.',
  },
  {
    icon: 'truck',
    label: 'Livraison à Douala et Yaoundé',
    description: 'Vos commandes livrées dans les villes desservies.',
  },
  {
    icon: 'whatsapp',
    label: 'Support WhatsApp',
    description: 'Une question ? Notre équipe vous répond.',
  },
];

@Component({
  selector: 'bruny-product-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FcfaPipe,
    BadgeComponent,
    ButtonComponent,
    EmptyStateComponent,
    ModalComponent,
    PriceTagComponent,
    ProductCardComponent,
    ReassuranceBandComponent,
    QuantitySelectorComponent,
    SizeSelectorComponent,
    SkeletonComponent,
    TabsComponent,
    ColorSelectorComponent,
    ProductGalleryComponent,
    StickyBuyBarComponent,
  ],
  templateUrl: './product-detail-page.html',
  styleUrl: './product-detail-page.scss',
})
export class ProductDetailPage {
  private readonly store = inject(ProductDetailStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seoService = inject(SeoService);
  private readonly config = inject(APP_CONFIG);

  readonly tabs = TABS;
  readonly reassurancePoints = REASSURANCE;

  readonly product = this.store.product;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly selectedColor = this.store.selectedColor;
  readonly selectedSize = this.store.selectedSize;
  readonly selectedVariant = this.store.selectedVariant;
  readonly quantity = this.store.quantity;
  readonly activeImageIndex = this.store.activeImageIndex;
  readonly galleryImages = this.store.galleryImages;
  readonly activeImage = this.store.activeImage;
  readonly sizes = this.store.sizesForSelectedColor;
  readonly maxQuantity = this.store.maxQuantity;
  readonly canAddToCart = this.store.canAddToCart;
  readonly addToCartMessage = this.store.addToCartMessage;
  readonly displayPrice = this.store.displayPrice;
  readonly compareAtPrice = this.store.compareAtPrice;
  readonly promoPercent = this.store.promoPercent;
  readonly savings = computed(() => {
    const compareAt = this.compareAtPrice();
    return compareAt === null ? 0 : Math.max(0, compareAt - this.displayPrice());
  });

  readonly activeTab = signal('description');
  readonly zoomOpen = signal(false);

  readonly sizeItems = computed<SizeSelectorItem[]>(() =>
    this.sizes().map((size) => ({
      id: size.size,
      size: size.size,
      stock: size.availableStock,
    })),
  );

  readonly selectedSizeItem = computed<{ id: string; size: string } | null>(() => {
    const size = this.selectedSize();
    return size === null ? null : { id: size, size };
  });

  readonly whatsappUrl = computed(() => {
    const product = this.product();
    const base = this.config.contactWhatsappUrl;
    if (product === null) return base;
    const text = encodeURIComponent(
      `Bonjour, je m'intéresse au produit "${product.name}" (${product.slug}).`,
    );
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}text=${text}`;
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const slug = params.get('slug');
      if (slug === null || slug.trim() === '') {
        void this.router.navigate(['/boutique']);
        return;
      }
      this.activeTab.set('description');
      this.zoomOpen.set(false);
      void this.store.load(slug).then(() => this.applySeo());
    });
  }

  onColorSelect(slug: string): void {
    this.store.selectColor(slug);
  }

  onSizeSelect(size: string): void {
    this.store.selectSize(size);
  }

  onQuantityChange(quantity: number): void {
    this.store.setQuantity(quantity);
  }

  onImageChange(index: number): void {
    this.store.setActiveImage(index);
  }

  onAddToCart(): void {
    this.store.addToCart();
  }

  goToCatalog(): void {
    void this.router.navigate(['/boutique']);
  }

  private applySeo(): void {
    const product = this.product();
    if (product === null) return;

    const path = `/produit/${product.slug}`;
    const image = this.galleryImages()[0] ?? product.images[0] ?? null;

    this.seoService.setPageMeta({
      title: product.seoTitle ?? `${product.name} — ${product.brand.name}`,
      description: product.seoDescription ?? this.truncate(product.description, 160),
      canonicalPath: path,
      ogImage: image?.url ?? null,
      ogImageAlt: image?.alt ?? product.name,
      ogType: 'product',
      jsonLd: productSchema(this.config, product, path),
    });
  }

  private truncate(value: string, max: number): string {
    if (value.length <= max) return value;
    return `${value.slice(0, max - 1).trimEnd()}…`;
  }

  /** Utilisé par le template pour le zoom : image active ou première image. */
  zoomImage(product: CatalogProductDetail): CatalogImage | null {
    return this.activeImage() ?? product.images[0] ?? null;
  }
}
