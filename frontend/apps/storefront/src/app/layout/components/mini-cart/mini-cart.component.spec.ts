import { computed, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CartStore } from '../../../core/cart/cart.store';
import type { CartLine, CartValidationIssue } from '../../../core/cart/cart.model';
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

async function tick(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

interface CartOptions {
  lines?: CartLine[];
  loading?: boolean;
  error?: string | null;
  issues?: CartValidationIssue[];
  stale?: boolean;
}

function createCart(options: CartOptions = {}) {
  const lines = signal(options.lines ?? [LINE]);
  const loading = signal(options.loading ?? false);
  const error = signal<string | null>(options.error ?? null);
  const issues = signal<CartValidationIssue[]>(options.issues ?? []);
  const lastAddedAt = signal<string | null>(null);
  const itemCount = computed(() => lines().reduce((sum, line) => sum + line.quantity, 0));
  const isEmpty = computed(() => lines().length === 0);
  const subtotal = computed(() =>
    lines().reduce((sum, line) => sum + line.unitPriceAtAdd * line.quantity, 0),
  );
  const discount = signal(0);

  return {
    lines: lines.asReadonly(),
    loading: loading.asReadonly(),
    error: error.asReadonly(),
    issues: issues.asReadonly(),
    lastAddedAt: lastAddedAt.asReadonly(),
    itemCount,
    isEmpty,
    subtotal,
    discount: discount.asReadonly(),
    displayTotal: computed(() => subtotal() - discount()),
    hasIssues: computed(() => issues().length > 0),
    isStale: vi.fn(() => options.stale ?? true),
    lineTotal: (variantId: string) => {
      const line = lines().find((item) => item.variantId === variantId);
      return line === undefined ? 0 : line.unitPriceAtAdd * line.quantity;
    },
    removeLine: vi.fn(),
    validate: vi.fn(async () => null),
    setLines: (next: CartLine[]) => lines.set(next),
    markAdded: () => lastAddedAt.set(new Date().toISOString()),
  };
}

function dialog(): HTMLElement | null {
  return document.querySelector('.bruny-drawer');
}

describe('MiniCartComponent', () => {
  let fixture: ComponentFixture<MiniCartComponent> | null = null;

  afterEach(() => {
    fixture?.destroy();
    fixture = null;
    document.body.style.overflow = '';
  });

  async function create(cart = createCart()) {
    await TestBed.configureTestingModule({
      imports: [MiniCartComponent],
      providers: [provideRouter([]), { provide: CartStore, useValue: cart }],
    }).compileComponents();
    const created = TestBed.createComponent(MiniCartComponent);
    created.detectChanges();
    await created.whenStable();
    await tick();
    fixture = created;
    return { fixture: created, cart };
  }

  async function open(created: ComponentFixture<MiniCartComponent>) {
    (created.nativeElement.querySelector('.mini-cart__trigger') as HTMLButtonElement).click();
    created.detectChanges();
    await created.whenStable();
    await tick();
    created.detectChanges();
  }

  it('shows an accessible item count in the header trigger', async () => {
    const { fixture: created } = await create();
    const element = created.nativeElement as HTMLElement;
    const button = element.querySelector('.mini-cart__trigger') as HTMLButtonElement;

    expect(button.getAttribute('aria-label')).toBe('Ouvrir le panier (2 articles)');
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelector('.mini-cart__badge')?.textContent?.trim()).toBe('2');
    expect(element.querySelector('.sr-only')?.textContent).toContain('2 articles dans le panier.');
  });

  it('updates the header badge when cart lines change', async () => {
    const cart = createCart();
    const { fixture: created } = await create(cart);
    const element = created.nativeElement as HTMLElement;

    cart.setLines([LINE, { ...LINE, variantId: 'variant-2', quantity: 1 }]);
    created.detectChanges();
    expect(element.querySelector('.mini-cart__badge')?.textContent?.trim()).toBe('3');
    expect(element.querySelector('.mini-cart__trigger')?.getAttribute('aria-label')).toBe(
      'Ouvrir le panier (3 articles)',
    );

    cart.setLines([]);
    created.detectChanges();
    expect(element.querySelector('.mini-cart__badge')?.textContent?.trim()).toBe('0');
    expect(element.querySelector('.mini-cart__trigger')?.getAttribute('aria-label')).toBe(
      'Ouvrir le panier (0 article)',
    );
  });

  it('opens the drawer, revalidates when stale and renders the lines', async () => {
    const { fixture: created, cart } = await create();
    await open(created);

    const element = dialog();
    expect(element).not.toBeNull();
    expect(element?.getAttribute('role')).toBe('dialog');
    expect(element?.getAttribute('aria-modal')).toBe('true');
    expect(element?.textContent).toContain('Mocassin Cuir');
    expect(element?.textContent?.replace(/\s/g, ' ')).toContain('50 000 FCFA');
    expect(element?.querySelector('a[href="/panier"]')?.textContent).toContain('Voir le panier');
    expect(element?.querySelector('.mini-cart__secondary')?.textContent).toContain(
      'Continuer mes achats',
    );
    expect(element?.textContent).toContain('Sous-total');
    expect(element?.textContent).toContain('Total');
    expect(
      (element?.querySelector('.mini-cart__primary .bs-button') as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(element?.textContent).toContain('Le paiement sera disponible prochainement.');
    expect(cart.validate).toHaveBeenCalledOnce();
  });

  it('closes the drawer and navigates to the shop with Continuer mes achats', async () => {
    const { fixture: created } = await create();
    await open(created);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    (dialog()?.querySelector('.mini-cart__secondary') as HTMLElement).click();
    await created.whenStable();
    await tick();

    expect(navigate).toHaveBeenCalledWith(['/boutique']);
    expect(dialog()).toBeNull();
  });

  it('shows the empty state without a checkout action', async () => {
    const { fixture: created } = await create(createCart({ lines: [] }));
    await open(created);

    const element = dialog();
    expect(element?.textContent).toContain('Votre panier est vide');
    expect(element?.textContent).toContain('Ajoutez un produit pour commencer votre commande.');
    expect(element?.querySelector('a[href="/boutique"]')?.textContent).toContain(
      'Découvrir la boutique',
    );
    expect(element?.querySelector('.mini-cart__primary')).toBeNull();
  });

  it('shows skeletons while loading an empty cart', async () => {
    const { fixture: created } = await create(createCart({ lines: [], loading: true }));
    await open(created);

    const element = dialog();
    expect(element?.querySelector('.mini-cart__skeletons')?.getAttribute('aria-busy')).toBe('true');
    expect(element?.querySelectorAll('bruny-skeleton')).toHaveLength(3);
  });

  it('shows the validation issues in the drawer', async () => {
    const { fixture: created } = await create(
      createCart({
        issues: [
          {
            code: 'OUT_OF_STOCK',
            message: 'Rupture de stock : Mocassin Cuir est indisponible.',
          },
        ],
      }),
    );
    await open(created);

    const element = dialog();
    expect(element?.textContent).toContain('Votre panier a changé');
    expect(element?.textContent).toContain('Rupture de stock');
  });

  it('renders the API error and retries', async () => {
    const { fixture: created, cart } = await create(
      createCart({ error: 'Impossible de vérifier votre panier.' }),
    );
    await open(created);

    const retry = dialog()?.querySelector('.mini-cart__error button') as HTMLButtonElement;
    expect(dialog()?.textContent).toContain('Impossible de vérifier votre panier.');
    retry.click();
    expect(cart.validate).toHaveBeenCalledTimes(2);
  });

  it('removes a line', async () => {
    const { fixture: created, cart } = await create();
    await open(created);

    (dialog()?.querySelector('.mini-cart__remove') as HTMLButtonElement).click();
    expect(cart.removeLine).toHaveBeenCalledWith('variant-1');
  });

  it('opens automatically after a successful add and stays closed after dismissal', async () => {
    const cart = createCart();
    const { fixture: created } = await create(cart);
    expect(dialog()).toBeNull();

    cart.markAdded();
    created.detectChanges();
    await created.whenStable();
    await tick();
    created.detectChanges();

    expect(dialog()).not.toBeNull();
    expect(cart.validate).toHaveBeenCalledOnce();

    cart.markAdded();
    created.detectChanges();
    await created.whenStable();
    await tick();
    expect(dialog()).not.toBeNull();

    (dialog()?.querySelector('.bruny-drawer__close') as HTMLButtonElement).click();
    await created.whenStable();
    await tick();

    expect(dialog()).toBeNull();
    expect(
      (created.nativeElement.querySelector('.mini-cart__trigger') as HTMLElement).getAttribute(
        'aria-expanded',
      ),
    ).toBe('false');
  });

  it('closes on Escape', async () => {
    const { fixture: created } = await create();
    await open(created);

    dialog()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await created.whenStable();
    await tick();
    created.detectChanges();

    expect(dialog()).toBeNull();
    expect(
      (created.nativeElement.querySelector('.mini-cart__trigger') as HTMLElement).getAttribute(
        'aria-expanded',
      ),
    ).toBe('false');
  });
});
