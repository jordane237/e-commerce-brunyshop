import { Pipe, PipeTransform } from '@angular/core';
import { formatCameroonPhone } from './phone.validator';

/** Affiche un numéro camerounais au format `+237 6 71 23 45 67`. */
@Pipe({ name: 'phoneFormat', standalone: true, pure: true })
export class PhoneFormatPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return formatCameroonPhone(value);
  }
}
