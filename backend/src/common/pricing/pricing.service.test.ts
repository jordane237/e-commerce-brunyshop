import { describe, expect, it } from 'vitest';

import { PricingService } from './pricing.service';

const service = new PricingService();

// Fenêtre de référence : bornes inclusives (CA #1).
const promoStart = new Date('2026-01-15T00:00:00.000Z');
const promoEnd = new Date('2026-01-20T23:59:59.000Z');

function product(overrides: Partial<Parameters<PricingService['calculatePrice']>[0]> = {}) {
  return {
    basePrice: 30000,
    promoPrice: 25000,
    promoStart,
    promoEnd,
    ...overrides,
  };
}

describe('PricingService.calculatePrice — bornes de dates (CA #1)', () => {
  it('est inactif 1 s avant promoStart', () => {
    const at = new Date(promoStart.getTime() - 1000);
    const result = service.calculatePrice(product(), at);
    expect(result.isPromoActive).toBe(false);
    expect(result.effectivePrice).toBe(30000);
    expect(result.discountPercent).toBeNull();
  });

  it('est actif à promoStart (borne inclusive)', () => {
    const result = service.calculatePrice(product(), promoStart);
    expect(result.isPromoActive).toBe(true);
    expect(result.effectivePrice).toBe(25000);
  });

  it('est actif 1 s après promoStart', () => {
    const at = new Date(promoStart.getTime() + 1000);
    expect(service.calculatePrice(product(), at).effectivePrice).toBe(25000);
  });

  it('est actif 1 s avant promoEnd', () => {
    const at = new Date(promoEnd.getTime() - 1000);
    expect(service.calculatePrice(product(), at).effectivePrice).toBe(25000);
  });

  it('est actif à promoEnd (borne inclusive)', () => {
    const result = service.calculatePrice(product(), promoEnd);
    expect(result.isPromoActive).toBe(true);
    expect(result.effectivePrice).toBe(25000);
  });

  it('est inactif 1 s après promoEnd', () => {
    const at = new Date(promoEnd.getTime() + 1000);
    const result = service.calculatePrice(product(), at);
    expect(result.isPromoActive).toBe(false);
    expect(result.effectivePrice).toBe(30000);
    expect(result.discountPercent).toBeNull();
  });
});

describe('PricingService.calculatePrice — cas défensifs et pourcentage (CA #3, #4)', () => {
  const midWindow = new Date('2026-01-17T12:00:00.000Z');

  it('ignore une promotion sans prix promo', () => {
    const result = service.calculatePrice(product({ promoPrice: null }), midWindow);
    expect(result.isPromoActive).toBe(false);
    expect(result.effectivePrice).toBe(30000);
  });

  it('ignore une promotion dont le prix est supérieur ou égal au prix de base (CA #4)', () => {
    expect(service.calculatePrice(product({ promoPrice: 30000 }), midWindow).isPromoActive).toBe(
      false,
    );
    expect(service.calculatePrice(product({ promoPrice: 35000 }), midWindow).effectivePrice).toBe(
      30000,
    );
  });

  it('ignore une promotion sans date de début ou sans date de fin', () => {
    expect(service.calculatePrice(product({ promoStart: null }), midWindow).isPromoActive).toBe(
      false,
    );
    expect(service.calculatePrice(product({ promoStart: null }), midWindow).effectivePrice).toBe(
      30000,
    );
    expect(service.calculatePrice(product({ promoEnd: null }), midWindow).isPromoActive).toBe(
      false,
    );
  });

  it('calcule le pourcentage arrondi et le prix promo exposé', () => {
    const result = service.calculatePrice(product(), midWindow);
    // (30000 - 25000) / 30000 * 100 = 16,67 → 17
    expect(result.discountPercent).toBe(17);
    expect(result.promoPrice).toBe(25000);
    expect(result.basePrice).toBe(30000);
  });

  it('utilise « maintenant » par défaut', () => {
    const now = Date.now();
    const active = service.calculatePrice(
      product({
        promoStart: new Date(now - 60_000),
        promoEnd: new Date(now + 60_000),
      }),
    );
    expect(active.isPromoActive).toBe(true);
    expect(active.effectivePrice).toBe(25000);
  });
});
