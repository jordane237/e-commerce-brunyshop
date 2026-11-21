import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Vérifie que le contrôle courant est identique au contrôle nommé. */
export function matchValidator(otherControlName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const other = control.parent?.get(otherControlName);
    if (other === undefined || other === null) return null;
    if (control.value === other.value) return null;
    return { mismatch: true };
  };
}
