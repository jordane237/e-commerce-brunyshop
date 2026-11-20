import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  inject,
  Input,
  Output,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
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
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
})
export class InputComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);

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
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

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
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }

  toggleReveal(): void {
    this.revealed = !this.revealed;
  }

  writeValue(value: string | null): void {
    this.value = value ?? '';
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }
}
