import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { COMMON_PASSWORDS } from '@bruny/core';

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

/** Refuse les mots de passe présents dans la liste noire du backend. */
export const commonPasswordValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = String(control.value ?? '');
  if (value === '') return null;
  return COMMON_PASSWORDS.has(value.toLowerCase()) ? { commonPassword: true } : null;
};

/**
 * Politique backend AUT-01 : 10–128 caractères, pas un mot de passe courant
 * et au moins deux catégories de caractères (minuscules, majuscules, chiffres,
 * symboles). Aucune majuscule ou chiffre isolé n'est imposé.
 */
export const passwordPolicyValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = String(control.value ?? '');
  if (value === '') return null;

  const errors: ValidationErrors = {};
  if (value.length < PASSWORD_MIN_LENGTH) {
    errors['minlength'] = {
      requiredLength: PASSWORD_MIN_LENGTH,
      actualLength: value.length,
    };
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    errors['maxlength'] = {
      requiredLength: PASSWORD_MAX_LENGTH,
      actualLength: value.length,
    };
  }
  if (COMMON_PASSWORDS.has(value.toLowerCase())) {
    errors['commonPassword'] = true;
  }

  const classes =
    Number(/[a-z]/.test(value)) +
    Number(/[A-Z]/.test(value)) +
    Number(/[0-9]/.test(value)) +
    Number(/[^a-zA-Z0-9]/.test(value));
  if (classes < 2) {
    errors['passwordVariety'] = true;
  }

  return Object.keys(errors).length > 0 ? errors : null;
};
