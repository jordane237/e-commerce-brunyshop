import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent, type IconName } from '../icon/icon.component';
import { SpinnerComponent } from '../spinner/spinner.component';

export type InputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'number' | 'url';

@Component({
  selector: 'bruny-input',
  standalone: true,
  imports: [IconComponent, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
})
export class InputComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) name = '';
  @Input() id = '';
  @Input() type: InputType = 'text';
  @Input() value = '';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() prefix = '';
  @Input() icon: IconName | null = null;
  @Input() autocomplete = 'off';
  @Input() inputMode: 'text' | 'tel' | 'email' | 'numeric' | 'search' | null = null;
  @Input() required = false;
  @Input() disabled = false;
  @Input() loading = false;
  @Output() valueChange = new EventEmitter<string>();

  revealed = false;

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

  get inputType(): InputType {
    if (this.type === 'password' && this.revealed) return 'text';
    return this.type;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.valueChange.emit(this.value);
  }

  toggleReveal(): void {
    this.revealed = !this.revealed;
  }
}
