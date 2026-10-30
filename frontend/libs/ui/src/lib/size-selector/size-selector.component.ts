import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'bruny-size-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './size-selector.component.html',
  styleUrl: './size-selector.component.scss',
})
export class SizeSelectorComponent {
  @Input() label = 'Choisir une pointure';
  @Input() sizes: string[] = [];
  @Input() selected: string | null = null;
  @Input() unavailable: string[] = [];
  @Input() lowStock: string[] = [];
  @Input() disabled = false;
  @Output() selectedSize = new EventEmitter<string>();

  isUnavailable(size: string): boolean {
    return this.unavailable.includes(size);
  }

  isLowStock(size: string): boolean {
    return this.lowStock.includes(size);
  }

  select(size: string): void {
    if (this.disabled || this.isUnavailable(size)) return;
    this.selected = size;
    this.selectedSize.emit(size);
  }
}
