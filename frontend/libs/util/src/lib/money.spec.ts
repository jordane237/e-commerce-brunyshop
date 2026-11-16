import { describe, expect, it } from 'vitest';
import { effectiveProductPrice } from './money';

describe('effectiveProductPrice', () => {
  const product = {
    basePrice: 24000,
    promoPrice: 19000,
    promoStart: '2026-10-01T00:00:00.000Z',
    promoEnd: '2026-10-31T23:59:59.000Z',
  };

  it('applique une promotion uniquement dans sa plage', () => {
    expect(effectiveProductPrice(product, new Date('2026-10-14T12:00:00.000Z'))).toBe(19000);
    expect(effectiveProductPrice(product, new Date('2026-11-01T00:00:00.000Z'))).toBe(24000);
  });
});
