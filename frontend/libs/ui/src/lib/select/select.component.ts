import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { SpinnerComponent } from '../spinner/spinner.component';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'bruny-select',
  standalone: true,
  imports: [IconComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
})
export class SelectComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) name = '';
  @Input() id = '';
  @Input() options: SelectOption[] = [];
  @Input() value = '';
  @Input() placeholder = 'Sélectionner…';
  @Input() hint = '';
  @Input() error = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() loading = false;
  @Output() valueChange = new EventEmitter<string>();

  get fieldId(): string {
    return this.id || this.name;
  }

  get errorId(): string {
    return `${this.fieldId}-error`;
  }

  get hintId(): string {
    return `${this.fieldId}-hint`;
  }

  get describedBy(): string | null {
    if (this.error) return this.errorId;
    if (this.hint) return this.hintId;
    return null;
  }

  onChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.value = target.value;
    this.valueChange.emit(this.value);
  }
}
