import { describe, expect, it } from 'vitest';

import { CartPricingService } from './cart-pricing.service';
import { CartIssueCode } from './dto/cart-validation-response.dto';

const service = new CartPricingService();

const at = new Date('2026-11-09T12:00:00.000Z');

function product(overrides: Partial<Parameters<CartPricingService['calculatePrice']>[0]> = {}) {
  return {
    basePrice: 35000,
    promoPrice: null,
    promoStart: null,
    promoEnd: null,
    ...overrides,
  };
}

describe('CartPricingService.calculatePrice', () => {
  it('utilise le prix de base du produit sans promotion ni override', () => {
    const quote = service.calculatePrice(product(), { price: null }, at);
    expect(quote).toEqual({ unitPrice: 35000, listPrice: 35000, appliedPromo: false });
  });

  it('donne la priorité au prix override de la variante', () => {
    const quote = service.calculatePrice(product(), { price: 30000 }, at);
    expect(quote).toEqual({ unitPrice: 30000, listPrice: 30000, appliedPromo: false });
  });

  it('applique la promotion produit dans la fenêtre active (bornes incluses)', () => {
    const atStart = service.calculatePrice(
      product({
        promoPrice: 28000,
        promoStart: at,
        promoEnd: new Date('2026-11-10T12:00:00.000Z'),
      }),
      { price: null },
      at,
    );
    const atEnd = service.calculatePrice(
      product({
        promoPrice: 28000,
        promoStart: new Date('2026-11-08T12:00:00.000Z'),
        promoEnd: at,
      }),
      { price: null },
      at,
    );
    expect(atStart.unitPrice).toBe(28000);
    expect(atStart.appliedPromo).toBe(true);
    expect(atEnd.unitPrice).toBe(28000);
  });

  it('ignore une promotion expirée', () => {
    const quote = service.calculatePrice(
      product({
        promoPrice: 28000,
        promoStart: new Date('2026-10-01T00:00:00.000Z'),
        promoEnd: new Date('2026-10-31T00:00:00.000Z'),
      }),
      { price: null },
      at,
    );
    expect(quote).toEqual({ unitPrice: 35000, listPrice: 35000, appliedPromo: false });
  });

  it('ignore une promotion future', () => {
    const quote = service.calculatePrice(
      product({
        promoPrice: 28000,
        promoStart: new Date('2026-12-01T00:00:00.000Z'),
        promoEnd: new Date('2026-12-31T00:00:00.000Z'),
      }),
      { price: null },
      at,
    );
    expect(quote.unitPrice).toBe(35000);
  });

  it('ignore une promotion incomplète (sans dates)', () => {
    const quote = service.calculatePrice(product({ promoPrice: 28000 }), { price: null }, at);
    expect(quote.unitPrice).toBe(35000);
    expect(quote.appliedPromo).toBe(false);
  });

  it('fait primer le prix override variante sur la promotion produit', () => {
    const quote = service.calculatePrice(
      product({
        promoPrice: 28000,
        promoStart: new Date('2026-11-01T00:00:00.000Z'),
        promoEnd: new Date('2026-11-30T00:00:00.000Z'),
      }),
      { price: 31000 },
      at,
    );
    expect(quote.unitPrice).toBe(31000);
    expect(quote.appliedPromo).toBe(false);
  });
});

describe('CartPricingService.evaluateCoupon', () => {
  const coupon = {
    code: 'WELCOME10',
    type: 'PERCENTAGE' as const,
    value: 10,
    minAmount: 20000,
    startsAt: null,
    endsAt: null,
    maxUses: null,
    usedCount: 0,
  };

  it('calcule une remise en pourcentage', () => {
    const evaluation = service.evaluateCoupon(coupon, 60000, at, 'WELCOME10');
    expect(evaluation.discount).toBe(6000);
    expect(evaluation.issue).toBeNull();
  });

  it('arrondit la remise en pourcentage à l’entier XAF', () => {
    const evaluation = service.evaluateCoupon(coupon, 33333, at, 'WELCOME10');
    expect(evaluation.discount).toBe(3333);
  });

  it('plafonne une remise fixe au sous-total (total jamais négatif)', () => {
    const evaluation = service.evaluateCoupon(
      { ...coupon, type: 'FIXED_AMOUNT', value: 50000, minAmount: null },
      20000,
      at,
      'FREESHIP',
    );
    expect(evaluation.discount).toBe(20000);
    expect(evaluation.issue).toBeNull();
  });

  it('rend un coupon inconnu bloquant et sans remise', () => {
    const evaluation = service.evaluateCoupon(null, 60000, at, 'NOPE');
    expect(evaluation.discount).toBe(0);
    expect(evaluation.issue?.code).toBe(CartIssueCode.COUPON_INVALID);
    expect(evaluation.issue?.couponCode).toBe('NOPE');
  });

  it('rend un coupon expiré bloquant', () => {
    const evaluation = service.evaluateCoupon(
      { ...coupon, endsAt: new Date('2026-10-01T00:00:00.000Z') },
      60000,
      at,
      'WELCOME10',
    );
    expect(evaluation.discount).toBe(0);
    expect(evaluation.issue?.code).toBe(CartIssueCode.COUPON_INVALID);
  });

  it('rend un coupon pas encore actif bloquant', () => {
    const evaluation = service.evaluateCoupon(
      { ...coupon, startsAt: new Date('2026-12-01T00:00:00.000Z') },
      60000,
      at,
      'WELCOME10',
    );
    expect(evaluation.issue?.code).toBe(CartIssueCode.COUPON_INVALID);
  });

  it('rend un coupon épuisé bloquant', () => {
    const evaluation = service.evaluateCoupon(
      { ...coupon, maxUses: 10, usedCount: 10 },
      60000,
      at,
      'WELCOME10',
    );
    expect(evaluation.discount).toBe(0);
    expect(evaluation.issue?.code).toBe(CartIssueCode.COUPON_INVALID);
  });

  it('signale un montant minimum non atteint sans invalider le panier', () => {
    const evaluation = service.evaluateCoupon(coupon, 15000, at, 'WELCOME10');
    expect(evaluation.discount).toBe(0);
    expect(evaluation.issue?.code).toBe(CartIssueCode.COUPON_MIN_AMOUNT_NOT_REACHED);
    expect(evaluation.issue?.minAmount).toBe(20000);
    expect(evaluation.issue?.subtotal).toBe(15000);
  });
});
