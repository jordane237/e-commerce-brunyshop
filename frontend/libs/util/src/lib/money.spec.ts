import { describe, expect, it } from 'vitest';
import { effectiveProductPrice, formatFcfa } from './money';

describe('formatFcfa', () => {
  it('formats integer amounts in Cameroon French locale', () => {
    expect(formatFcfa(15000).replace(/\s/g, ' ')).toBe('15 000 FCFA');
  });

  it('renders null values as zero without decimals', () => {
    expect(formatFcfa(null)).toBe('0 FCFA');
  });
});

describe('effectiveProductPrice', () => {
  const product = {
    basePrice: 24000,
    promoPrice: 19000,
    promoStart: '2026-10-01T00:00:00.000Z',
    promoEnd: '2026-10-31T23:59:59.000Z',
  };

  it('applies a promotion only inside its schedule', () => {
    expect(effectiveProductPrice(product, new Date('2026-10-14T12:00:00.000Z'))).toBe(19000);
    expect(effectiveProductPrice(product, new Date('2026-11-01T00:00:00.000Z'))).toBe(24000);
  });
});
