import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const cameroonPhoneValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  return !value || /^\+237[26][0-9]{8}$/.test(value) ? null : { cameroonPhone: true };
};
