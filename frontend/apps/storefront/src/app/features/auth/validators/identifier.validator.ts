import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+237[0-9]{9}$/;
const LOCAL_PHONE_RE = /^[0-9]{9}$/;

/** Accepte un e-mail ou un numéro camerounais complet ou local (9 chiffres). */
export const identifierValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (value === '') return null;

  if (EMAIL_RE.test(value) || PHONE_RE.test(value) || LOCAL_PHONE_RE.test(value)) {
    return null;
  }
  return { identifier: true };
};

/** Normalise un numéro local vers le format backend `+237XXXXXXXXX`. */
export function normalizeIdentifier(value: string): string {
  const trimmed = value.trim();
  if (LOCAL_PHONE_RE.test(trimmed)) return `+237${trimmed}`;
  if (EMAIL_RE.test(trimmed)) return trimmed.toLowerCase();
  return trimmed;
}
