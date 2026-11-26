import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'bruny-quantity-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './quantity-selector.component.html',
  styleUrl: './quantity-selector.component.scss',
})
export class QuantitySelectorComponent {
  readonly value = model.required<number>();
  readonly min = input<number>(1);
  readonly max = input<number>(100);
  readonly disabled = input<boolean>(false);
  readonly productName = input<string>('ce produit');

  decrement(): void {
    if (this.disabled() || this.value() <= this.min()) return;
    this.value.set(this.value() - 1);
  }

  increment(): void {
    if (this.disabled() || this.value() >= this.max()) return;
    this.value.set(this.value() + 1);
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const parsed = Number.parseInt(input.value, 10);
    if (Number.isNaN(parsed)) {
      input.value = String(this.value());
      return;
    }
    const clamped = Math.max(this.min(), Math.min(this.max(), parsed));
    this.value.set(clamped);
    input.value = String(clamped);
  }
}
