import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'bruny-checkbox',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
})
export class CheckboxComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) name = '';
  @Input() id = '';
  @Input() checked = false;
  @Input() indeterminate = false;
  @Input() hint = '';
  @Input() error = '';
  @Input() disabled = false;
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
    this.indeterminate = false;
    this.checkedChange.emit(this.checked);
  }
}
