import { Component, input, output } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { CatalogProduct } from '@bruny/data-access';
import { effectiveProductPrice, FcfaPipe } from '@bruny/util';

@Component({
  selector: 'bruny-button',
  standalone: true,
  template: `<button class="button" [type]="type()" [disabled]="disabled()">
    <ng-content />
  </button>`,
  styles: [
    `
      .button {
        min-height: 44px;
        padding: 0 18px;
        border: 0;
        border-radius: 8px;
        background: #1f2a44;
        color: white;
        font-weight: 700;
        cursor: pointer;
      }
      .button:disabled {
        opacity: 0.5;
        cursor: default;
      }
    `,
  ],
})
export class ButtonComponent {
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
}

@Component({
  selector: 'bruny-input',
  standalone: true,
  template: `<label class="field"
    ><span>{{ label() }}</span
    ><input
      [type]="type()"
      [placeholder]="placeholder()"
      [attr.name]="name()"
      [required]="required()"
  /></label>`,
  styles: [
    `
      .field {
        display: grid;
        gap: 7px;
        font-size: 0.85rem;
        font-weight: 700;
      }
      .field input {
        height: 46px;
        border: 1px solid #dce0e7;
        border-radius: 8px;
        padding: 0 12px;
        font: inherit;
      }
    `,
  ],
})
export class InputComponent {
  readonly label = input.required<string>();
  readonly name = input.required<string>();
  readonly type = input<'text' | 'email' | 'tel' | 'password' | 'search'>('text');
  readonly placeholder = input('');
  readonly required = input(false);
}

@Component({
  selector: 'bruny-price-tag',
  standalone: true,
  template: `<strong class="price">{{ amount() | fcfa }}</strong>`,
  imports: [FcfaPipe],
})
export class PriceTagComponent {
  readonly amount = input.required<number>();
}

@Component({
  selector: 'bruny-badge',
  standalone: true,
  template: `<span class="badge"><ng-content /></span>`,
})
export class BadgeComponent {}

@Component({
  selector: 'bruny-skeleton',
  standalone: true,
  template: `<div class="skeleton" aria-hidden="true"></div>`,
})
export class SkeletonComponent {}

@Component({
  selector: 'bruny-size-selector',
  standalone: true,
  template: `
    <div class="sizes" role="group" aria-label="Choisir une pointure">
      @for (size of sizes(); track size) {
        <button
          type="button"
          [class.selected]="selected() === size"
          (click)="selectedSize.emit(size)"
        >
          {{ size }}
        </button>
      }
    </div>
  `,
})
export class SizeSelectorComponent {
  readonly sizes = input.required<string[]>();
  readonly selected = input<string | null>(null);
  readonly selectedSize = output<string>();
}

@Component({
  selector: 'bruny-product-card',
  standalone: true,
  imports: [NgOptimizedImage, RouterLink, PriceTagComponent, BadgeComponent],
  template: `
    <a class="product-card" [routerLink]="['/produit', product().slug]">
      <div class="image-wrap">
        @if (product().images[0]; as image) {
          <img [ngSrc]="image.url" [alt]="image.alt || product().name" width="600" height="600" />
        } @else {
          <div class="image-placeholder" aria-label="Image indisponible"></div>
        }
        @if (price() < product().basePrice) {
          <bruny-badge>Offre</bruny-badge>
        }
      </div>
      <div class="details">
        <p class="brand">{{ product().brand.name }}</p>
        <h3>{{ product().name }}</h3>
        <bruny-price-tag [amount]="price()" />
      </div>
    </a>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .product-card {
        color: inherit;
        text-decoration: none;
      }
      .image-wrap {
        position: relative;
        aspect-ratio: 1;
        background: #f4f3ef;
        border-radius: 12px;
        overflow: hidden;
      }
      .image-wrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .image-wrap bruny-badge {
        position: absolute;
        left: 12px;
        top: 12px;
      }
      .details {
        padding: 12px 2px;
      }
      .brand {
        color: #687087;
        font-size: 0.8rem;
        margin: 0 0 5px;
      }
      .details h3 {
        font-size: 1rem;
        margin: 0 0 8px;
      }
      .price {
        font-size: 1rem;
      }
      .badge {
        background: #c9a227;
        color: #1f2a44;
        border-radius: 999px;
        padding: 5px 10px;
        font-size: 0.75rem;
        font-weight: 700;
      }
      .image-placeholder {
        height: 100%;
        background: linear-gradient(135deg, #e9e8e4, #f5f4f1);
      }
    `,
  ],
})
export class ProductCardComponent {
  readonly product = input.required<CatalogProduct>();

  price(): number {
    return effectiveProductPrice(this.product());
  }
}

@Component({
  selector: 'bruny-toast',
  standalone: true,
  template: `@if (message()) {
    <p role="status" class="toast">{{ message() }}</p>
  }`,
  styles: [
    `
      .toast {
        position: fixed;
        z-index: 10;
        right: 20px;
        bottom: 20px;
        background: #1f2a44;
        color: white;
        padding: 12px 18px;
        border-radius: 10px;
      }
    `,
  ],
})
export class ToastComponent {
  readonly message = input('');
}
