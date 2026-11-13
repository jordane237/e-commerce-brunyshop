import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CartStore } from '../../../core/cart/cart.store';
import type { CartLine } from '../../../core/cart/cart.model';
import { MiniCartComponent } from './mini-cart.component';

const LINE: CartLine = {
  variantId: 'variant-1',
  productId: 'product-1',
  productSlug: 'mocassin',
  productName: 'Mocassin Cuir',
  variantSku: 'SKU-1',
  size: '42',
  color: 'Noir',
  quantity: 2,
  unitPriceAtAdd: 25000,
  imageUrl: null,
  imageAlt: null,
  addedAt: '2026-11-13T10:00:00.000Z',
};

function createCart(initial: CartLine[] = [LINE]) {
  const lines = signal(initial);
  const loading = signal(false);
  const error = signal<string | null>(null);
  const issues = signal([]);
  const itemCount = computed(() => lines().reduce((sum, line) => sum + line.quantity, 0));
  const isEmpty = computed(() => lines().length === 0);
  const displayTotal = computed(() =>
    lines().reduce((sum, line) => sum + line.unitPriceAtAdd * line.quantity, 0),
  );

  return {
    lines: lines.asReadonly(),
    loading: loading.asReadonly(),
    error: error.asReadonly(),
    issues: issues.asReadonly(),
    itemCount,
    isEmpty,
    displayTotal,
    hasIssues: computed(() => false),
    isStale: vi.fn(() => true),
    lineTotal: (variantId: string) => {
      const line = lines().find((item) => item.variantId === variantId);
      return line === undefined ? 0 : line.unitPriceAtAdd * line.quantity;
    },
    removeLine: vi.fn(),
    validate: vi.fn(async () => null),
  };
}

function create(cart = createCart()) {
  TestBed.configureTestingModule({
    imports: [MiniCartComponent],
    providers: [provideRouter([]), { provide: CartStore, useValue: cart }],
  });
  const fixture = TestBed.createComponent(MiniCartComponent);
  fixture.detectChanges();
  return { fixture, cart };
}

afterEach(() => {
  document.body.style.overflow = '';
});

describe('MiniCartComponent', () => {
  it('shows the item count in an accessible cart button', () => {
    const { fixture } = create();
    const element = fixture.nativeElement as HTMLElement;
    const button = element.querySelector('.mini-cart__trigger') as HTMLButtonElement;

    expect(button.getAttribute('aria-label')).toBe('Panier : 2 articles');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelector('.mini-cart__badge')?.textContent?.trim()).toBe('2');
  });

  it('opens the drawer, revalidates when stale and renders the lines', () => {
    const { fixture, cart } = create();
    const element = fixture.nativeElement as HTMLElement;

    (element.querySelector('.mini-cart__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(element.querySelector('[role="dialog"]')).not.toBeNull();
    expect(element.textContent).toContain('Mocassin Cuir');
    expect(element.textContent?.replace(/\s/g, ' ')).toContain('50 000 FCFA');
    expect(element.querySelector('a[href="/panier"]')?.textContent).toContain('Voir le panier');
    expect(cart.validate).toHaveBeenCalledOnce();
  });

  it('removes a line and shows the empty state', () => {
    const { fixture, cart } = create();
    const element = fixture.nativeElement as HTMLElement;
    (element.querySelector('.mini-cart__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();

    (element.querySelector('.mini-cart__remove') as HTMLButtonElement).click();
    expect(cart.removeLine).toHaveBeenCalledWith('variant-1');
  });

  it('shows the empty state with a catalogue link', () => {
    const { fixture } = create(createCart([]));
    const element = fixture.nativeElement as HTMLElement;
    (element.querySelector('.mini-cart__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(element.textContent).toContain('Votre panier est vide');
    expect(element.querySelector('a[href="/boutique"]')?.textContent).toContain(
      'Découvrir la boutique',
    );
  });
});
