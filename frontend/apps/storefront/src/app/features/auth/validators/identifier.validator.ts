import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import {
  isCameroonLocalPhoneNumber,
  isCameroonPhoneNumber,
  normalizeCameroonPhone,
} from '@bruny/util';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Accepte un e-mail ou un numéro camerounais complet ou local (9 chiffres). */
export const identifierValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (value === '') return null;

  if (EMAIL_RE.test(value) || isCameroonPhoneNumber(value) || isCameroonLocalPhoneNumber(value)) {
    return null;
  }
  return { identifier: true };
};

/** Normalise un numéro local vers le format backend `+237XXXXXXXXX`. */
export function normalizeIdentifier(value: string): string {
  const trimmed = value.trim();
  if (isCameroonPhoneNumber(trimmed) || isCameroonLocalPhoneNumber(trimmed)) {
    return normalizeCameroonPhone(trimmed);
  }
  if (EMAIL_RE.test(trimmed)) return trimmed.toLowerCase();
  return trimmed;
}
