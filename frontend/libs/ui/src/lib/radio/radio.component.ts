import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'bruny-radio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './radio.component.html',
  styleUrl: './radio.component.scss',
})
export class RadioComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) name = '';
  @Input({ required: true }) value = '';
  @Input() id = '';
  @Input() checked = false;
  @Input() hint = '';
  @Input() error = '';
  @Input() disabled = false;
  @Output() selected = new EventEmitter<string>();

  get fieldId(): string {
    return this.id || `${this.name}-${this.value}`;
  }

  get describedBy(): string | null {
    if (this.error) return `${this.fieldId}-error`;
    if (this.hint) return `${this.fieldId}-hint`;
    return null;
  }

  onChange(): void {
    this.selected.emit(this.value);
  }
}
