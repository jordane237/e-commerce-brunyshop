import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SpinnerComponent } from '../spinner/spinner.component';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'whatsapp';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'bruny-button',
  standalone: true,
  imports: [SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.bs-button-host--block]': 'block' },
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() block = false;
  @Input() iconOnly = false;
  @Input() ariaLabel: string | null = null;
}
