import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

export interface SizeSelectorItem {
  id: string;
  size: string;
  stock: number;
}

@Component({
  selector: 'bruny-size-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './size-selector.component.html',
  styleUrl: './size-selector.component.scss',
})
export class SizeSelectorComponent {
  readonly items = input.required<SizeSelectorItem[]>();
  readonly selected = input<{ id: string; size: string } | null>(null);
  readonly readonly = input(false);
  readonly maxItems = input<number | null>(null);
  readonly loading = input(false);
  readonly select = output<{ id: string; size: string }>();

  readonly more = signal(false);
  readonly visibleItems = computed(() => {
    const items = this.items();
    const limit = this.maxItems();
    if (limit === null || items.length <= limit) {
      return items;
    }
    if (!this.more()) {
      return items.slice(0, limit - 1);
    }
    return items;
  });

  readonly showMore = computed(() => {
    const items = this.items();
    const limit = this.maxItems();
    if (limit === null) {
      return false;
    }
    return items.length > limit && this.visibleItems().length < items.length;
  });

  readonly moreLabel = computed(() => {
    if (!this.showMore()) {
      return '';
    }
    const remaining = this.items().length - (this.visibleItems().length - 1);
    return `+${remaining} autres pointures`;
  });

  isAvailable(item: SizeSelectorItem): boolean {
    return item.stock > 0;
  }

  ariaLabel(item: SizeSelectorItem): string {
    if (!this.isAvailable(item)) {
      return `Taille ${item.size}`;
    }
    return `Taille ${item.size}, ${item.stock} en stock`;
  }

  onSelect(item: SizeSelectorItem): void {
    if (this.readonly() || !this.isAvailable(item)) {
      return;
    }
    const current = this.selected();
    if (current?.id === item.id) {
      return;
    }
    this.select.emit(item);
  }

  toggleMore(): void {
    if (this.readonly()) {
      return;
    }
    this.more.update((value) => !value);
  }
}
