import { FormControl, FormGroup } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import { commonPasswordValidator, passwordPolicyValidator } from './common-password.validator';
import { identifierValidator, normalizeIdentifier } from './identifier.validator';
import { matchValidator } from './match.validator';
import { localPhoneValidator, toInternationalPhone } from './phone.validator';

describe('validateurs AUT-09', () => {
  it('accepte un e-mail et un numéro +237 valides', () => {
    expect(identifierValidator(new FormControl('client@exemple.cm'))).toBeNull();
    expect(identifierValidator(new FormControl('+237612345678'))).toBeNull();
    expect(identifierValidator(new FormControl('612345678'))).toBeNull();
  });

  it('refuse un identifiant qui n’est ni e-mail ni téléphone', () => {
    expect(identifierValidator(new FormControl('client'))).toEqual({ identifier: true });
    expect(identifierValidator(new FormControl('+237123'))).toEqual({ identifier: true });
  });

  it('normalise un numéro local et un e-mail', () => {
    expect(normalizeIdentifier('612345678')).toBe('+237612345678');
    expect(normalizeIdentifier(' CLIENT@EXEMPLE.CM ')).toBe('client@exemple.cm');
  });

  it('applique la politique backend de mot de passe', () => {
    expect(commonPasswordValidator(new FormControl('password123'))).toEqual({
      commonPassword: true,
    });
    expect(passwordPolicyValidator(new FormControl('short'))).toHaveProperty('minlength');
    expect(passwordPolicyValidator(new FormControl('aaaaaaaaaa'))).toEqual({
      passwordVariety: true,
    });
    expect(passwordPolicyValidator(new FormControl('password123'))).toHaveProperty(
      'commonPassword',
    );
    expect(passwordPolicyValidator(new FormControl('Brune!2026'))).toBeNull();
  });

  it('valide un téléphone local de 9 chiffres', () => {
    expect(localPhoneValidator(new FormControl('612345678'))).toBeNull();
    expect(localPhoneValidator(new FormControl('6123'))).toEqual({ localPhone: true });
    expect(toInternationalPhone('612345678')).toBe('+237612345678');
  });

  it('refuse une confirmation différente', () => {
    const group = new FormGroup({
      password: new FormControl('Brune!2026'),
      confirmPassword: new FormControl('Brune!2026', {
        validators: [matchValidator('password')],
      }),
    });

    expect(group.controls.confirmPassword.valid).toBe(true);
    group.controls.password.setValue('Autre!2026');
    group.controls.confirmPassword.updateValueAndValidity();
    expect(group.controls.confirmPassword.hasError('mismatch')).toBe(true);
  });
});
