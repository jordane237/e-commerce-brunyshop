import { describe, expect, it } from 'vitest';
import { FcfaPipe } from './fcfa.pipe';

const NBSP = '\u00a0';

describe('FcfaPipe', () => {
  const pipe = new FcfaPipe();

  it('formate 15 000 avec des espaces insécables U+00A0', () => {
    const result = pipe.transform(15000);
    expect(result).toBe(`15${NBSP}000${NBSP}FCFA`);
    expect(result).not.toContain('\u202f');
    expect(result).not.toContain(' ');
  });

  it('formate zéro', () => {
    expect(pipe.transform(0)).toBe(`0${NBSP}FCFA`);
  });

  it('groupe les millions', () => {
    expect(pipe.transform(1250000)).toBe(`1${NBSP}250${NBSP}000${NBSP}FCFA`);
  });

  it('arrondit sans afficher de décimale', () => {
    expect(pipe.transform(15000.7)).toBe(`15${NBSP}001${NBSP}FCFA`);
  });

  it('conserve le signe des montants négatifs', () => {
    expect(pipe.transform(-5000)).toBe(`-5${NBSP}000${NBSP}FCFA`);
  });

  it('affiche un tiret pour null', () => {
    expect(pipe.transform(null)).toBe('—');
  });

  it('affiche un tiret pour undefined', () => {
    expect(pipe.transform(undefined)).toBe('—');
  });

  it('affiche un tiret pour NaN', () => {
    expect(pipe.transform(Number.NaN)).toBe('—');
  });

  it('affiche un tiret pour l’infini', () => {
    expect(pipe.transform(Number.POSITIVE_INFINITY)).toBe('—');
  });
});
