import { PLATFORM_ID, signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import type { CatalogProductDetail } from '@bruny/data-access';
import { APP_CONFIG, DEFAULT_APP_CONFIG } from '../app-config';
import { ConsentService } from './consent.service';
import { MetaPixelService } from './meta-pixel.service';

const product: CatalogProductDetail = {
  id: 'product-1',
  slug: 'mocassin-cuir',
  name: 'Mocassin Cuir',
  description: 'Mocassin confortable.',
  seoTitle: null,
  seoDescription: null,
  basePrice: 30000,
  effectivePrice: 25000,
  promoPrice: null,
  promoStart: null,
  promoEnd: null,
  isPromoActive: false,
  inStock: true,
  category: { id: 'cat-1', name: 'Mocassins', slug: 'mocassins' },
  brand: { id: 'brand-1', name: 'Bruny', slug: 'bruny', logo: null },
  images: [],
  colors: [],
  sizes: [{ size: '41', availableStock: 3, isAvailable: true, isLowStock: true }],
  variants: [
    {
      id: 'variant-1',
      sku: 'SKU-41-NOIR',
      size: '41',
      color: 'NOIR',
      effectivePrice: 25000,
      availableStock: 3,
      isAvailable: true,
    },
  ],
  similarProducts: [],
};

function installFbqStub(): unknown[][] {
  const calls: unknown[][] = [];
  const fbq = (...args: unknown[]): void => {
    calls.push(args);
  };
  window.fbq = fbq as Window['fbq'];
  return calls;
}

function create(
  marketing = true,
  platform: 'browser' | 'server' = 'browser',
): { service: MetaPixelService; calls: unknown[][]; marketing: WritableSignal<boolean> } {
  const marketingState = signal(marketing);
  const calls = installFbqStub();

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: PLATFORM_ID, useValue: platform === 'server' ? 'server' : 'browser' },
      {
        provide: APP_CONFIG,
        useValue: { ...DEFAULT_APP_CONFIG, metaPixelId: '123456789012345' },
      },
      {
        provide: ConsentService,
        useValue: {
          marketingConsent: marketingState.asReadonly(),
          analyticsConsent: signal(marketing).asReadonly(),
        },
      },
    ],
  });

  const service = TestBed.inject(MetaPixelService);
  service.start();
  return { service, calls, marketing: marketingState };
}

function event(calls: unknown[][], name: string): unknown[] | undefined {
  return calls.find((call) => call[1] === name);
}

describe('MetaPixelService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = '_fbp=abc; path=/';
    document.cookie = '_fbc=def; path=/';
    delete window.fbq;
    delete window.__BRUNY_META_PIXEL_ID__;
  });

  it('ne charge ni ne trace rien sans consentement marketing', () => {
    const { service, calls } = create(false);

    service.syncConsent();
    service.trackViewContent(product);

    expect(calls).toHaveLength(0);
  });

  it('initialise le pixel et envoie PageView après consentement', () => {
    const { service, calls } = create(true);

    service.syncConsent();

    expect(calls[0]).toEqual(['init', '123456789012345']);
    expect(event(calls, 'PageView')).toEqual(['track', 'PageView']);
  });

  it('envoie ViewContent avec les SKU et le prix XAF', () => {
    const { service, calls } = create();

    service.trackViewContent(product);

    expect(event(calls, 'ViewContent')).toEqual([
      'track',
      'ViewContent',
      {
        content_name: 'Mocassin Cuir',
        content_ids: ['SKU-41-NOIR'],
        content_type: 'product',
        value: 25000,
        currency: 'XAF',
      },
    ]);
  });

  it('envoie AddToCart avec value = prix unitaire × quantité', () => {
    const { service, calls } = create();

    service.trackAddToCart(product, product.variants[0], 2);

    expect(event(calls, 'AddToCart')?.[2]).toMatchObject({
      content_ids: ['SKU-41-NOIR'],
      value: 50000,
      currency: 'XAF',
      num_items: 2,
    });
  });

  it('envoie InitiateCheckout avec le total du panier', () => {
    const { service, calls } = create();

    service.trackInitiateCheckout({
      items: [
        { sku: 'SKU-41-NOIR', quantity: 1 },
        { sku: 'SKU-42-NOIR', quantity: 2 },
      ],
      total: 75000,
    });

    expect(event(calls, 'InitiateCheckout')?.[2]).toMatchObject({
      content_ids: ['SKU-41-NOIR', 'SKU-42-NOIR'],
      value: 75000,
      currency: 'XAF',
      num_items: 3,
    });
  });

  it('n’envoie Purchase qu’une seule fois par référence', () => {
    const { service, calls } = create();
    const order = {
      reference: 'BRN-2611-7K3F',
      total: 31500,
      items: [{ sku: 'SKU-41-NOIR', quantity: 1 }],
    };

    service.trackPurchaseOnce(order);
    service.trackPurchaseOnce(order);

    expect(calls.filter((call) => call[1] === 'Purchase')).toHaveLength(1);
    expect(localStorage.getItem('brunyshop.pixel.purchase.BRN-2611-7K3F')).toBe('1');
  });

  it('ne renvoie pas Purchase après rechargement de la confirmation', () => {
    const first = create();
    const order = {
      reference: 'BRN-2611-ABCD',
      total: 31500,
      items: [{ sku: 'SKU-41-NOIR', quantity: 1 }],
    };
    first.service.trackPurchaseOnce(order);

    const second = create();

    second.service.trackPurchaseOnce(order);

    expect(event(second.calls, 'Purchase')).toBeUndefined();
  });

  it('supprime les cookies Meta au retrait du consentement', () => {
    const { service, marketing } = create(true);
    service.syncConsent();

    marketing.set(false);
    service.syncConsent();

    expect(document.cookie).not.toContain('_fbp=abc');
    expect(document.cookie).not.toContain('_fbc=def');
  });

  it('ne touche pas à window.fbq côté serveur', () => {
    const { service, calls } = create(true, 'server');

    service.syncConsent();
    service.trackViewContent(product);

    expect(calls).toHaveLength(0);
  });

  it('ignore un ID de pixel placeholder', () => {
    TestBed.resetTestingModule();
    const calls = installFbqStub();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: APP_CONFIG, useValue: { ...DEFAULT_APP_CONFIG, metaPixelId: 'CHANGEME_test' } },
        {
          provide: ConsentService,
          useValue: { marketingConsent: signal(true).asReadonly() },
        },
      ],
    });
    const service = TestBed.inject(MetaPixelService);
    service.start();
    service.syncConsent();

    expect(calls).toHaveLength(0);
  });
});
