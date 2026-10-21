import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CatalogApi, CatalogProduct } from '@bruny/data-access';
import { CartStore } from '@bruny/data-access';
import { PriceTagComponent, SizeSelectorComponent } from '@bruny/ui';
import { effectiveProductPrice } from '@bruny/util';
import { NgOptimizedImage } from '@angular/common';
import { SeoService } from '../../core/seo.service';

@Component({
  standalone: true,
  selector: 'bruny-product-page',
  imports: [RouterLink, PriceTagComponent, SizeSelectorComponent, NgOptimizedImage],
  template: `
    <section class="container product-page">
      <a class="back" routerLink="/boutique">← Retour à la boutique</a>
      @if (state() === 'loading') {
        <p class="state">Chargement de la fiche produit…</p>
      } @else if (state() === 'error' || !product()) {
        <div class="state">
          <h1>Produit introuvable</h1>
          <p>Cette fiche n’est pas disponible.</p>
        </div>
      } @else {
        <div class="product-layout">
          <div class="gallery">
            @if (product()!.images[0]; as image) {
              <img
                class="main-image"
                [ngSrc]="image.url"
                [alt]="image.alt || product()!.name"
                width="900"
                height="900"
              />
            }
            @if (product()!.images.length > 1) {
              <div class="thumbnails">
                @for (image of product()!.images; track image.id) {
                  <img
                    [ngSrc]="image.url"
                    [alt]="image.alt || product()!.name"
                    width="96"
                    height="96"
                  />
                }
              </div>
            }
          </div>
          <article class="details">
            <p class="eyebrow">{{ product()!.brand.name }} · {{ product()!.category.name }}</p>
            <h1>{{ product()!.name }}</h1>
            <p class="price">
              <bruny-price-tag [amount]="effectivePrice()" />
            </p>
            <p class="description">{{ product()!.description }}</p>
            <h2>Choisissez votre pointure</h2>
            <bruny-size-selector
              [sizes]="availableSizes()"
              [selected]="selectedSize()"
              (selectedSize)="selectedSize.set($event)"
            />
            @if (selectedSize()) {
              <p class="availability">Disponible en {{ selectedSize() }}</p>
            }
            <button class="add" type="button" [disabled]="!selectedSize()" (click)="addToCart()">
              {{ added() ? 'Ajouté au panier ✓' : 'Ajouter au panier' }}
            </button>
            <p class="delivery">
              Livraison disponible à Douala, Yaoundé et dans plusieurs villes du Cameroun.
            </p>
          </article>
        </div>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .product-page {
        padding-block: 30px 60px;
      }
      .back {
        color: #48536b;
        text-decoration: none;
      }
      .product-layout {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: clamp(30px, 6vw, 80px);
        margin-top: 30px;
      }
      .main-image {
        display: block;
        width: 100%;
        height: auto;
        aspect-ratio: 1;
        object-fit: cover;
        background: #f4f3ef;
        border-radius: 16px;
      }
      .thumbnails {
        display: flex;
        gap: 12px;
        margin-top: 12px;
      }
      .thumbnails img {
        width: 76px;
        height: 76px;
        object-fit: cover;
        border-radius: 8px;
      }
      .details {
        padding-top: 16px;
      }
      .eyebrow {
        color: #7a6b36;
        font-weight: 700;
      }
      .details h1 {
        font-size: clamp(2rem, 4vw, 3.3rem);
        letter-spacing: -0.04em;
        margin: 12px 0;
      }
      .price {
        font-size: 1.5rem;
      }
      .description {
        line-height: 1.75;
        color: #555e6f;
        margin: 26px 0;
      }
      .details h2 {
        font-size: 1rem;
      }
      .availability {
        font-weight: 700;
        color: #34734b;
      }
      .add {
        height: 52px;
        width: 100%;
        border: 0;
        border-radius: 10px;
        background: #1f2a44;
        color: white;
        font-weight: 700;
        margin-top: 22px;
      }
      .add:disabled {
        opacity: 0.45;
      }
      .delivery {
        font-size: 0.88rem;
        color: #687087;
      }
      .state {
        padding: 90px 0;
        text-align: center;
      }
      @media (max-width: 760px) {
        .product-layout {
          grid-template-columns: 1fr;
          gap: 20px;
        }
        .details {
          padding-top: 0;
        }
      }
    `,
  ],
})
export class ProductPage implements OnInit {
  private readonly api = inject(CatalogApi);
  private readonly route = inject(ActivatedRoute);
  private readonly cart = inject(CartStore);
  private readonly seo = inject(SeoService);
  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  readonly product = signal<CatalogProduct | null>(null);
  readonly selectedSize = signal<string | null>(null);
  readonly availableSizes = signal<string[]>([]);
  readonly added = signal(false);

  effectivePrice(): number {
    const product = this.product();
    return product ? effectiveProductPrice(product) : 0;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) {
        this.state.set('error');
        return;
      }
      this.state.set('loading');
      this.api.get(slug).subscribe({
        next: (item) => {
          this.product.set(item);
          this.seo.set(item.name, item.description, `/produit/${item.slug}`);
          this.availableSizes.set(
            [
              ...new Set(
                item.variants.filter((variant) => variant.stock > 0).map((variant) => variant.size),
              ),
            ].sort(),
          );
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
    });
  }

  addToCart(): void {
    const product = this.product();
    const size = this.selectedSize();
    const variant = product?.variants.find((item) => item.size === size && item.stock > 0);
    if (!product || !variant) return;
    this.cart.add(product, variant);
    this.added.set(true);
  }
}
