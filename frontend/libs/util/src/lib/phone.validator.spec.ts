import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import {
  formatCameroonPhone,
  localPhoneValidator,
  normalizeCameroonPhone,
  phoneValidator,
  toInternationalPhone,
  PHONE_ERROR_MESSAGE,
} from './phone.validator';

describe('phoneValidator', () => {
  it('accepte un numéro international complet', () => {
    expect(phoneValidator(new FormControl('+237699123456'))).toBeNull();
  });

  it('accepte les espaces, tirets, points et parenthèses', () => {
    expect(phoneValidator(new FormControl('+237 (6) 99-12.34.56'))).toBeNull();
  });

  it('tolère un champ vide sans le rendre obligatoire', () => {
    expect(phoneValidator(new FormControl(''))).toBeNull();
  });

  it('refuse un numéro local sans +237', () => {
    expect(phoneValidator(new FormControl('699123456'))).toEqual({
      phone: { message: PHONE_ERROR_MESSAGE },
    });
  });

  it('refuse un numéro trop court', () => {
    expect(phoneValidator(new FormControl('+23769912345'))).not.toBeNull();
  });

  it('refuse un numéro trop long', () => {
    expect(phoneValidator(new FormControl('+2376991234567'))).not.toBeNull();
  });

  it('refuse un préfixe commençant par zéro', () => {
    expect(phoneValidator(new FormControl('+237069912345'))).not.toBeNull();
  });

  it('refuse 237 sans le signe plus', () => {
    expect(phoneValidator(new FormControl('237699123456'))).not.toBeNull();
  });

  it('refuse les lettres', () => {
    expect(phoneValidator(new FormControl('+237ABC123456'))).not.toBeNull();
  });
});

describe('localPhoneValidator', () => {
  it('accepte les 9 chiffres avec séparateurs', () => {
    expect(localPhoneValidator(new FormControl('6 99 12 34 56'))).toBeNull();
  });

  it('refuse un numéro international dans un champ local', () => {
    expect(localPhoneValidator(new FormControl('+237699123456'))).not.toBeNull();
  });
});

describe('helpers téléphone', () => {
  it('normalise un numéro local vers le format backend', () => {
    expect(normalizeCameroonPhone('6 99 12 34 56')).toBe('+237699123456');
    expect(toInternationalPhone('6 99 12 34 56')).toBe('+237699123456');
  });

  it('compacte un numéro international déjà préfixé', () => {
    expect(normalizeCameroonPhone('+237 6 99 12 34 56')).toBe('+237699123456');
  });

  it('affiche le format DSG-07', () => {
    expect(formatCameroonPhone('+237699123456')).toBe('+237 6 99 12 34 56');
    expect(formatCameroonPhone('699123456')).toBe('+237 6 99 12 34 56');
  });

  it('retourne la valeur d’origine si elle est invalide', () => {
    expect(formatCameroonPhone('123')).toBe('123');
    expect(formatCameroonPhone(null)).toBe('');
  });
});
