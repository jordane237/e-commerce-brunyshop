import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Le champ téléphone P15 stocke 9 chiffres ; le backend reçoit +237XXXXXXXXX. */
export const localPhoneValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (value === '') return null;
  return /^[0-9]{9}$/.test(value) ? null : { localPhone: true };
};

export function toInternationalPhone(local: string): string {
  return `+237${local.trim()}`;
}
