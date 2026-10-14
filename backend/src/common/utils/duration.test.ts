import { describe, expect, it } from 'vitest';

import { parseDuration } from './duration';

describe('parseDuration', () => {
  it('parse les unités du cahier (.env.example)', () => {
    expect(parseDuration('15m')).toBe(15 * 60_000);
    expect(parseDuration('30d')).toBe(30 * 86_400_000);
    expect(parseDuration('45s')).toBe(45_000);
    expect(parseDuration('2h')).toBe(2 * 3_600_000);
  });

  it('interprète un nombre nu comme des minutes', () => {
    expect(parseDuration('30')).toBe(30 * 60_000);
  });

  it('rejette les formats invalides', () => {
    expect(() => parseDuration('bientôt')).toThrow();
    expect(() => parseDuration('15x')).toThrow();
  });
});
