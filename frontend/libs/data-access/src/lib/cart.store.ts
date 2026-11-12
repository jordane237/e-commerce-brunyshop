import { isPlatformBrowser } from '@angular/common';
import { afterNextRender, computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

// Minimal product/variant shapes the cart needs. Prices are always the ones
// computed server-side (`effectivePrice`, already promotion-aware), so the cart
// never recomputes a price the API did not confirm.
export interface CartAddProduct {
  id: string;
  name: string;
  slug: string;
  images: Array<{ url: string }>;
}

export interface CartAddVariant {
  id: string;
  size: string;
  color: string;
  unitPrice: number;
  availableStock: number;
}

export interface CartLine {
  variantId: string;
  productId: string;
  name: string;
  slug: string;
  size: string;
  color: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
}

const STORAGE_KEY = 'bruny-cart-v1';

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browser = isPlatformBrowser(this.platformId);
  private readonly lineState = signal<CartLine[]>([]);
  readonly lines = this.lineState.asReadonly();
  readonly count = computed(() =>
    this.lineState().reduce((total, line) => total + line.quantity, 0),
  );
  readonly total = computed(() =>
    this.lineState().reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
  );

  constructor() {
    afterNextRender(() => this.lineState.set(this.read()));
  }

  add(product: CartAddProduct, variant: CartAddVariant): void {
    if (variant.availableStock < 1) return;
    this.lineState.update((lines) => {
      const existing = lines.find((line) => line.variantId === variant.id);
      if (existing) {
        return lines.map((line) =>
          line.variantId === variant.id
            ? { ...line, quantity: Math.min(line.quantity + 1, variant.availableStock) }
            : line,
        );
      }
      return [
        ...lines,
        {
          variantId: variant.id,
          productId: product.id,
          name: product.name,
          slug: product.slug,
          size: variant.size,
          color: variant.color,
          image: product.images[0]?.url ?? null,
          unitPrice: variant.unitPrice,
          quantity: 1,
        },
      ];
    });
    this.persist();
  }

  remove(variantId: string): void {
    this.lineState.update((lines) => lines.filter((line) => line.variantId !== variantId));
    this.persist();
  }

  private read(): CartLine[] {
    if (!this.browser) return [];
    try {
      const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      return Array.isArray(value) ? (value as CartLine[]) : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    if (this.browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(this.lineState()));
  }
}
