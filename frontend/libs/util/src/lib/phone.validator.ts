import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Message validé dans DSG-07, section « Messages d’erreur ». */
export const PHONE_ERROR_MESSAGE =
  'Saisissez un numéro camerounais à 9 chiffres (ex. 6 71 23 45 67).';

const FULL_PHONE_RE = /^\+237[1-9][0-9]{8}$/;
const LOCAL_PHONE_RE = /^[1-9][0-9]{8}$/;

/** Retire les séparateurs autorisés sans modifier les chiffres saisis. */
export function compactPhone(value: string): string {
  return value.trim().replace(/[\s.\-()]/g, '');
}

export function isCameroonPhoneNumber(value: string): boolean {
  return FULL_PHONE_RE.test(compactPhone(value));
}

export function isCameroonLocalPhoneNumber(value: string): boolean {
  return LOCAL_PHONE_RE.test(compactPhone(value));
}

/**
 * Normalise un numéro complet ou local vers le format backend
 * `+237XXXXXXXXX`. Une valeur non reconnue est seulement compactée.
 */
export function normalizeCameroonPhone(value: string): string {
  const compact = compactPhone(value);
  if (FULL_PHONE_RE.test(compact)) return compact;
  if (LOCAL_PHONE_RE.test(compact)) return `+237${compact}`;
  return compact;
}

/** Convertit les 9 chiffres affichés derrière le préfixe `+237`. */
export function toInternationalPhone(local: string): string {
  const compact = compactPhone(local);
  return compact.startsWith('+237') ? compact : `+237${compact}`;
}

/** Affiche un numéro au format DSG-07, ou la valeur d’origine si invalide. */
export function formatCameroonPhone(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const normalized = normalizeCameroonPhone(value);
  const match = /^\+237([0-9])([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})$/.exec(normalized);
  if (!match) return value.trim();
  return `+237 ${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]}`;
}

/**
 * Valide un numéro international complet. Un champ vide est toléré :
 * `Validators.required` reste responsable de l’obligation conditionnelle.
 */
export const phoneValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (value === '') return null;
  return isCameroonPhoneNumber(value) ? null : { phone: { message: PHONE_ERROR_MESSAGE } };
};

/**
 * Valide les 9 chiffres d’un champ dont le préfixe `+237` est affiché à part
 * (formulaires P15 et P22). Les séparateurs de saisie sont acceptés.
 */
export const localPhoneValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (value === '') return null;
  return isCameroonLocalPhoneNumber(value) ? null : { phone: { message: PHONE_ERROR_MESSAGE } };
};

/** Nom historique conservé pour les imports existants. */
export const cameroonPhoneValidator = phoneValidator;
