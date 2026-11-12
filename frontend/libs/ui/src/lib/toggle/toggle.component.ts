import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'bruny-toggle',
  standalone: true,
  imports: [SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toggle.component.html',
  styleUrl: './toggle.component.scss',
})
export class ToggleComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) name = '';
  @Input() id = '';
  @Input() checked = false;
  @Input() hint = '';
  @Input() error = '';
  @Input() disabled = false;
  @Input() loading = false;
  @Output() checkedChange = new EventEmitter<boolean>();

  get fieldId(): string {
    return this.id || this.name;
  }

  get describedBy(): string | null {
    if (this.error) return `${this.fieldId}-error`;
    if (this.hint) return `${this.fieldId}-hint`;
    return null;
  }

  onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.checked = target.checked;
    this.checkedChange.emit(this.checked);
  }
}
