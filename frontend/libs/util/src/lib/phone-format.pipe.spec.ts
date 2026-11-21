import { describe, expect, it } from 'vitest';
import { PhoneFormatPipe } from './phone-format.pipe';

describe('PhoneFormatPipe', () => {
  const pipe = new PhoneFormatPipe();

  it('affiche un numéro international groupé', () => {
    expect(pipe.transform('+237699123456')).toBe('+237 6 99 12 34 56');
  });

  it('accepte un numéro local', () => {
    expect(pipe.transform('699123456')).toBe('+237 6 99 12 34 56');
  });

  it('préserve une valeur invalide', () => {
    expect(pipe.transform('123')).toBe('123');
  });
});
