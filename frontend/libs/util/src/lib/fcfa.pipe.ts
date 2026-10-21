import { Pipe, PipeTransform } from '@angular/core';
import { formatFcfa } from './money';

@Pipe({ name: 'fcfa', standalone: true, pure: true })
export class FcfaPipe implements PipeTransform {
  transform(amount: number | null | undefined): string {
    return formatFcfa(amount);
  }
}
