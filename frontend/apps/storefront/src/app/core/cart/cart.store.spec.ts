import { Component, inject, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CartApi, type CartValidationResponseDto } from '@bruny/data-access';
import { ToastService } from '@bruny/core';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CART_STORAGE_KEY,
  LEGACY_CART_STORAGE_KEY,
  type CartLine,
  type CartSnapshot,
} from './cart.model';
import { CartStore } from './cart.store';

@Component({ standalone: true, template: '' })
class CartHostComponent {
  readonly store = inject(CartStore);
}

function line(overrides: Partial<CartLine> = {}): CartLine {
  return {
    variantId: 'variant-1',
    productId: 'product-1',
    productSlug: 'mocassin',
    productName: 'Mocassin Cuir',
    variantSku: 'SKU-1',
    size: '42',
    color: 'Noir',
    quantity: 1,
    unitPriceAtAdd: 25000,
    imageUrl: '/img/mocassin.jpg',
    imageAlt: 'Mocassin Cuir',
    addedAt: '2026-11-13T10:00:00.000Z',
    ...overrides,
  };
}

function snapshot(lines: CartLine[]): string {
  const value: CartSnapshot = {
    version: 1,
    lines,
    updatedAt: '2026-11-13T10:00:00.000Z',
  };
  return JSON.stringify(value);
}

function validation(overrides: Partial<CartValidationResponseDto> = {}): CartValidationResponseDto {
  return {
    valid: true,
    items: [
      {
        variantId: 'variant-1',
        productId: 'product-1',
        productName: 'Mocassin Cuir',
        variantSku: 'SKU-1',
        size: '42',
        color: 'Noir',
        quantity: 1,
        availableStock: 10,
        unitPrice: 25000,
        lineTotal: 25000,
        issues: [],
      },
    ],
    subtotal: 25000,
    discount: 0,
    total: 25000,
    issues: [],
    meta: {
      validatedAt: '2026-11-13T10:05:00.000Z',
      itemCount: 1,
      totalQuantity: 1,
    },
    ...overrides,
  };
}

function setup(options: { platform?: string } = {}) {
  const validate = vi.fn(() => of(validation()));
  const toast = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  };
  TestBed.configureTestingModule({
    providers: [
      ...(options.platform !== undefined
        ? [{ provide: PLATFORM_ID, useValue: options.platform }]
        : []),
      { provide: CartApi, useValue: { validate } },
      { provide: ToastService, useValue: toast },
    ],
  });
  return { store: TestBed.inject(CartStore), validate, toast };
}

async function setupRestored(raw: string) {
  localStorage.setItem(CART_STORAGE_KEY, raw);
  const validate = vi.fn(() => of(validation()));
  const toast = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  };
  TestBed.configureTestingModule({
    imports: [CartHostComponent],
    providers: [
      { provide: CartApi, useValue: { validate } },
      { provide: ToastService, useValue: toast },
    ],
  });
  const fixture = TestBed.createComponent(CartHostComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  return { store: fixture.componentInstance.store, validate, toast, fixture };
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('CartStore — lignes et quantités', () => {
  it('adds a line, updates signals and persists it', () => {
    const { store, toast } = setup();

    store.addLine(line());

    expect(store.lines()).toHaveLength(1);
    expect(store.itemCount()).toBe(1);
    expect(store.lineCount()).toBe(1);
    expect(store.isEmpty()).toBe(false);
    expect(toast.success).toHaveBeenCalledWith('Produit ajouté au panier.');
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '{}')).toMatchObject({
      version: 1,
      lines: [expect.objectContaining({ variantId: 'variant-1', quantity: 1 })],
    });
  });

  it('merges an existing variant without duplicate and caps at 100', () => {
    const { store } = setup();
    store.addLine(line({ quantity: 99 }));

    store.addLine(line({ quantity: 5 }));

    expect(store.lines()).toHaveLength(1);
    expect(store.lines()[0]?.quantity).toBe(100);
  });

  it('rejects a quantity outside 1..100', () => {
    const { store, toast } = setup();

    store.addLine(line({ quantity: 0 }));
    store.addLine(line({ quantity: 101 }));

    expect(store.lines()).toHaveLength(0);
    expect(toast.error).toHaveBeenCalledWith('Quantité invalide (1 à 100).');
  });

  it('rejects the 51st line', () => {
    const { store, toast } = setup();
    for (let index = 0; index < 50; index += 1) {
      store.addLine(line({ variantId: `variant-${index}` }));
    }

    store.addLine(line({ variantId: 'variant-50' }));

    expect(store.lines()).toHaveLength(50);
    expect(toast.error).toHaveBeenCalledWith('Votre panier est plein (50 articles maximum).');
  });

  it('updates a quantity, removes at zero and clears the cart', () => {
    const { store, toast } = setup();
    store.addLine(line());

    store.updateQuantity('variant-1', 3);
    expect(store.itemCount()).toBe(3);

    store.updateQuantity('variant-1', 0);
    expect(store.isEmpty()).toBe(true);
    expect(toast.warning).toHaveBeenCalledWith('Produit retiré du panier.');

    store.addLine(line({ quantity: 2 }));
    store.clear();
    expect(store.isEmpty()).toBe(true);
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '{}').lines).toEqual([]);
  });

  it('removes a line directly', () => {
    const { store } = setup();
    store.addLine(line());

    store.removeLine('variant-1');

    expect(store.isEmpty()).toBe(true);
  });

  it('adds the first available variant from a catalogue card', () => {
    const { store, toast } = setup();

    const added = store.addProduct({
      id: 'product-1',
      name: 'Mocassin',
      slug: 'mocassin',
      description: '',
      basePrice: 25000,
      effectivePrice: 24000,
      promoPrice: 24000,
      promoStart: null,
      promoEnd: null,
      isPromoActive: true,
      inStock: true,
      category: { id: 'c1', name: 'Mocassins', slug: 'mocassins' },
      brand: { id: 'b1', name: 'Bruny', slug: 'bruny', logo: null },
      images: [],
      variants: [
        {
          id: 'sold-out',
          sku: 'SKU-0',
          color: 'Noir',
          size: '41',
          availableStock: 0,
          isAvailable: false,
        },
        {
          id: 'available',
          sku: 'SKU-1',
          color: 'Noir',
          size: '42',
          availableStock: 3,
          isAvailable: true,
        },
      ],
    });

    expect(added).toBe(true);
    expect(store.lines()[0]).toMatchObject({
      variantId: 'available',
      size: '42',
      unitPriceAtAdd: 24000,
    });
    expect(toast.success).toHaveBeenCalledWith('Produit ajouté au panier.');
  });

  it('refuses a product without available variant', () => {
    const { store, toast } = setup();

    const added = store.addProduct({
      id: 'p',
      name: 'Rupture',
      slug: 'rupture',
      description: '',
      basePrice: 1,
      effectivePrice: 1,
      promoPrice: null,
      promoStart: null,
      promoEnd: null,
      isPromoActive: false,
      inStock: false,
      category: { id: 'c', name: 'C', slug: 'c' },
      brand: { id: 'b', name: 'B', slug: 'b', logo: null },
      images: [],
      variants: [],
    });

    expect(added).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Ce produit n'est pas disponible.");
  });
});

describe('CartStore — persistance et SSR', () => {
  it('restores a valid snapshot at boot', async () => {
    const { store } = await setupRestored(snapshot([line()]));

    expect(store.lines()).toHaveLength(1);
    expect(store.lines()[0]?.productName).toBe('Mocassin Cuir');
  });

  it('clears corrupted JSON and unknown versions', async () => {
    const corrupted = await setupRestored('{not-json');
    expect(corrupted.store.isEmpty()).toBe(true);
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();

    TestBed.resetTestingModule();
    localStorage.clear();
    const unknown = await setupRestored(JSON.stringify({ version: 99, lines: [] }));
    expect(unknown.store.isEmpty()).toBe(true);
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
  });

  it('migrates the legacy cart key', async () => {
    localStorage.setItem(
      LEGACY_CART_STORAGE_KEY,
      JSON.stringify([
        {
          variantId: 'legacy-1',
          productId: 'p1',
          name: 'Ancien produit',
          slug: 'ancien-produit',
          size: '40',
          color: 'Brun',
          image: null,
          unitPrice: 12000,
          quantity: 2,
        },
      ]),
    );

    const validate = vi.fn(() =>
      of(
        validation({
          items: [
            {
              variantId: 'legacy-1',
              productId: 'p1',
              productName: 'Ancien produit',
              variantSku: '',
              size: '40',
              color: 'Brun',
              quantity: 2,
              availableStock: 5,
              unitPrice: 12000,
              lineTotal: 24000,
              issues: [],
            },
          ],
          subtotal: 24000,
          total: 24000,
        }),
      ),
    );
    TestBed.configureTestingModule({
      imports: [CartHostComponent],
      providers: [
        { provide: CartApi, useValue: { validate } },
        {
          provide: ToastService,
          useValue: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
        },
      ],
    });
    const fixture = TestBed.createComponent(CartHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.store.lines()[0]).toMatchObject({
      variantId: 'legacy-1',
      productName: 'Ancien produit',
      quantity: 2,
    });
    expect(localStorage.getItem(LEGACY_CART_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(CART_STORAGE_KEY)).not.toBeNull();
  });

  it('never touches localStorage on the server', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { store } = setup({ platform: 'server' });

    store.addLine(line());

    expect(store.lines()).toHaveLength(1);
    expect(setItem).not.toHaveBeenCalled();
  });

  it('survives a quota error and keeps the cart in memory', () => {
    const { store } = setup();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    expect(() => store.addLine(line())).not.toThrow();
    expect(store.lines()).toHaveLength(1);
  });

  it('stores no token, PII or server total (CA #4)', () => {
    const { store } = setup();
    store.addLine(line());

    const stored = localStorage.getItem(CART_STORAGE_KEY) ?? '';
    expect(stored).not.toMatch(/token|authorization|email|phone|address|total/i);
    expect(stored).not.toContain('awa@bruny.cm');
    expect(stored).not.toContain('699000000');
  });
});

describe('CartStore — revalidation CRT-01', () => {
  it('does not call the API for an empty cart', async () => {
    const { store, validate } = setup();

    await expect(store.validate()).resolves.toBeNull();
    expect(validate).not.toHaveBeenCalled();
  });

  it('sends variant ids, quantities and the price hint', async () => {
    const { store, validate } = setup();
    store.addLine(line({ quantity: 2, unitPriceAtAdd: 24000 }));

    await store.validate();

    expect(validate).toHaveBeenCalledWith({
      items: [{ variantId: 'variant-1', quantity: 2, previousUnitPrice: 24000 }],
    });
  });

  it('stores the server total and validation timestamp', async () => {
    const { store } = setup();
    store.addLine(line());

    await store.validate();

    expect(store.validationResult()?.total).toBe(25000);
    expect(store.displayTotal()).toBe(25000);
    expect(store.lastValidatedAt()).toBe('2026-11-13T10:05:00.000Z');
    expect(store.loading()).toBe(false);
  });

  it('exposes an API error without crashing', async () => {
    const validate = vi.fn(() => throwError(() => new Error('offline')));
    const store = setupWithApi(validate);

    store.addLine(line());
    const result = await store.validate();

    expect(result).toBeNull();
    expect(store.error()).toBe('Impossible de vérifier votre panier. Vérifiez votre connexion.');
    expect(store.loading()).toBe(false);
  });

  it('adjusts an insufficient quantity and keeps the server line total', async () => {
    const validate = vi.fn(() =>
      of(
        validation({
          valid: false,
          items: [
            {
              variantId: 'variant-1',
              productId: 'product-1',
              productName: 'Mocassin Cuir',
              variantSku: 'SKU-1',
              size: '42',
              color: 'Noir',
              quantity: 2,
              availableStock: 2,
              unitPrice: 25000,
              lineTotal: 50000,
              issues: [
                {
                  code: 'INSUFFICIENT_STOCK',
                  message: 'Stock insuffisant : 2 disponible(s), 3 demandé(s).',
                  variantId: 'variant-1',
                  requestedQuantity: 3,
                  availableQuantity: 2,
                },
              ],
            },
          ],
          subtotal: 50000,
          total: 50000,
          issues: [
            {
              code: 'INSUFFICIENT_STOCK',
              message: 'Stock insuffisant pour Mocassin Cuir.',
              variantId: 'variant-1',
            },
          ],
        }),
      ),
    );
    const store = setupWithApi(validate);
    store.addLine(line({ quantity: 3 }));

    await store.validate();

    expect(store.lines()[0]?.quantity).toBe(2);
    expect(store.lineTotal('variant-1')).toBe(50000);
    expect(store.hasIssues()).toBe(true);
  });

  it('removes an unavailable line returned with quantity zero', async () => {
    const validate = vi.fn(() =>
      of(
        validation({
          valid: false,
          items: [
            {
              variantId: 'variant-1',
              productId: 'product-1',
              productName: 'Mocassin Cuir',
              variantSku: 'SKU-1',
              size: '42',
              color: 'Noir',
              quantity: 0,
              availableStock: 0,
              unitPrice: 25000,
              lineTotal: 0,
              issues: [
                {
                  code: 'OUT_OF_STOCK',
                  message: 'Rupture de stock : Mocassin Cuir est indisponible.',
                  variantId: 'variant-1',
                },
              ],
            },
          ],
          subtotal: 0,
          total: 0,
          issues: [
            {
              code: 'OUT_OF_STOCK',
              message: 'Rupture de stock pour Mocassin Cuir.',
              variantId: 'variant-1',
            },
          ],
        }),
      ),
    );
    const store = setupWithApi(validate);
    store.addLine(line());

    await store.validate();

    expect(store.isEmpty()).toBe(true);
    expect(store.hasIssues()).toBe(true);

    await store.validate();
    expect(store.hasIssues()).toBe(true);
  });

  it('warns on price change and memorises the new server price', async () => {
    const { store, toast, validate } = setup();
    store.addLine(line({ unitPriceAtAdd: 20000 }));

    const response = validation({
      valid: false,
      items: [
        {
          variantId: 'variant-1',
          productId: 'product-1',
          productName: 'Mocassin Cuir',
          variantSku: 'SKU-1',
          size: '42',
          color: 'Noir',
          quantity: 1,
          availableStock: 10,
          unitPrice: 25000,
          lineTotal: 25000,
          issues: [
            {
              code: 'PRICE_CHANGED',
              message: 'Le prix de Mocassin Cuir (42, Noir) a changé : 20 000 FCFA → 25 000 FCFA.',
              variantId: 'variant-1',
              previousPrice: 20000,
              currentPrice: 25000,
            },
          ],
        },
      ],
      issues: [],
    });
    validate.mockReturnValue(of(response));

    await store.validate();

    expect(toast.warning).toHaveBeenCalledWith(
      'Le prix de Mocassin Cuir (42, Noir) a changé : 20 000 FCFA → 25 000 FCFA.',
    );
    expect(store.lines()[0]?.unitPriceAtAdd).toBe(25000);
  });

  it('emits the right toast variants for promotions and coupon errors', async () => {
    const { store, toast, validate } = setup();
    store.addLine(line());
    validate.mockReturnValue(
      of(
        validation({
          valid: false,
          items: [],
          subtotal: 0,
          total: 0,
          issues: [
            {
              code: 'PROMO_APPLIED',
              message: "Une promotion s'applique à votre panier.",
            },
            {
              code: 'PROMO_EXPIRED',
              message: 'Une promotion a expiré.',
            },
            {
              code: 'COUPON_INVALID',
              message: "Votre code promo n'est pas valide.",
            },
          ],
        }),
      ),
    );

    await store.validate();

    expect(toast.success).toHaveBeenCalledWith("Une promotion s'applique à votre panier.");
    expect(toast.info).toHaveBeenCalledWith('Une promotion a expiré.');
    expect(toast.error).toHaveBeenCalledWith("Votre code promo n'est pas valide.");
  });

  it('recomputes the local fallback total and staleness', () => {
    const { store } = setup();
    store.addLine(line({ quantity: 2, unitPriceAtAdd: 30000 }));

    expect(store.displayTotal()).toBe(60000);
    expect(store.isStale()).toBe(true);
    expect(store.subtotal()).toBe(60000);
    expect(store.discount()).toBe(0);
  });
});

function setupWithApi(validate: ReturnType<typeof vi.fn>): CartStore {
  TestBed.configureTestingModule({
    providers: [
      { provide: CartApi, useValue: { validate } },
      {
        provide: ToastService,
        useValue: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
      },
    ],
  });
  return TestBed.inject(CartStore);
}
