import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { CartStore } from '../../core/cart/cart.store';
import type { CartIssueDto } from '@bruny/data-access';
import type { CartLine } from '../../core/cart/cart.model';
import { CartPage } from './cart-page';

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
  imageUrl: '/mocassin.jpg',
  imageAlt: 'Mocassin Cuir',
  addedAt: '2026-11-13T10:00:00.000Z',
};

function createCart(initial: CartLine[] = [LINE]) {
  const lines = signal(initial);
  const loading = signal(false);
  const error = signal<string | null>(null);
  const issues = signal<CartIssueDto[]>([]);
  const itemCount = computed(() => lines().reduce((sum, line) => sum + line.quantity, 0));
  const isEmpty = computed(() => lines().length === 0);
  const displayTotal = computed(() =>
    lines().reduce((sum, line) => sum + line.unitPriceAtAdd * line.quantity, 0),
  );

  const store = {
    lines: lines.asReadonly(),
    loading: loading.asReadonly(),
    error: error.asReadonly(),
    issues: issues.asReadonly(),
    itemCount,
    isEmpty,
    displayTotal,
    subtotal: displayTotal,
    discount: computed(() => 0),
    hasIssues: computed(() => issues().length > 0),
    lineTotal: (variantId: string) => {
      const line = lines().find((item) => item.variantId === variantId);
      return line === undefined ? 0 : line.unitPriceAtAdd * line.quantity;
    },
    updateQuantity: vi.fn(),
    removeLine: vi.fn(),
    validate: vi.fn(async () => null),
  };

  return { store, lines, loading, error, issues, itemCount };
}

function createPage(cart = createCart()) {
  TestBed.configureTestingModule({
    imports: [CartPage],
    providers: [provideRouter([]), { provide: CartStore, useValue: cart.store }],
  });
  const fixture = TestBed.createComponent(CartPage);
  fixture.detectChanges();
  return { fixture, cart };
}

describe('CartPage', () => {
  it('validates the cart when the page opens', () => {
    const { cart } = createPage();

    expect(cart.store.validate).toHaveBeenCalledOnce();
  });

  it('renders the lines, quantities and summary', () => {
    const { fixture } = createPage();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Mon panier');
    expect(element.textContent).toContain('Mocassin Cuir');
    expect(element.textContent).toContain('Noir · Pointure 42');
    expect(element.textContent?.replace(/\s/g, ' ')).toContain('50 000 FCFA');
    expect(element.querySelector('output')?.textContent?.trim()).toBe('2');
  });

  it('updates the quantity from the stepper and removes a line', () => {
    const { fixture, cart } = createPage();
    const element = fixture.nativeElement as HTMLElement;

    (element.querySelector('button[aria-label^="Augmenter"]') as HTMLButtonElement).click();
    expect(cart.store.updateQuantity).toHaveBeenCalledWith('variant-1', 3);

    (element.querySelector('button[aria-label^="Retirer"]') as HTMLButtonElement).click();
    expect(cart.store.removeLine).toHaveBeenCalledWith('variant-1');
  });

  it('debounces the revalidation after a quantity change', () => {
    vi.useFakeTimers();
    const { fixture, cart } = createPage();
    (cart.store.validate as ReturnType<typeof vi.fn>).mockClear();
    const element = fixture.nativeElement as HTMLElement;

    (element.querySelector('button[aria-label^="Augmenter"]') as HTMLButtonElement).click();
    expect(cart.store.validate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(cart.store.validate).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('shows the empty state with a catalogue CTA', () => {
    const { fixture } = createPage(createCart([]));
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Votre panier est vide');
    expect(element.textContent).toContain('Ajoutez un produit pour commencer votre commande.');
    expect(element.querySelector('a[href="/boutique"]')?.textContent).toContain(
      'Découvrir la boutique',
    );
  });

  it('shows a persistent issue banner and retries validation', () => {
    const cart = createCart();
    cart.issues.set([
      {
        code: 'PRICE_CHANGED',
        message: 'Le prix de Mocassin Cuir a changé : 20 000 FCFA → 25 000 FCFA.',
        variantId: 'variant-1',
      },
    ]);
    cart.store.validate.mockClear();
    const { fixture } = createPage(cart);
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Votre panier a changé');
    expect(element.textContent).toContain('25 000 FCFA');
    (element.querySelector('.cart-page__issues button') as HTMLButtonElement).click();
    expect(cart.store.validate).toHaveBeenCalled();
  });

  it('keeps the issue banner visible when all lines were removed', () => {
    const cart = createCart([]);
    cart.issues.set([
      {
        code: 'OUT_OF_STOCK',
        message: 'Rupture de stock : Mocassin Cuir est indisponible.',
        variantId: 'variant-1',
      },
    ]);
    const { fixture } = createPage(cart);
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Votre panier a changé');
    expect(element.textContent).toContain('Rupture de stock');
    expect(element.textContent).toContain('Votre panier est vide');
  });

  it('shows the API error and a retry action', () => {
    const cart = createCart();
    cart.error.set('Impossible de vérifier votre panier. Vérifiez votre connexion.');
    const { fixture } = createPage(cart);
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Impossible de vérifier votre panier',
    );
    (element.querySelector('[role="alert"] button') as HTMLButtonElement).click();
    expect(cart.store.validate).toHaveBeenCalled();
  });
});
