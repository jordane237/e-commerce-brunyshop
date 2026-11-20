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
  /** Affiche la ligne « Sélectionner / 41 » au-dessus de la grille. */
  readonly showLabel = input(true);
  /** Terme accessible : « Taille » (défaut) ou « Pointure » sur la fiche produit. */
  readonly term = input<string>('Taille');
  /** Active le hint « Plus que X en stock » sous les pointures faibles. */
  readonly lowStockThreshold = input<number | null>(null);
  readonly listLabel = input('Les pointures disponibles');

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

  isEqual(item: SizeSelectorItem, selected: { id: string; size: string } | null): boolean {
    return selected !== null && selected.id === item.id;
  }

  isAvailable(item: SizeSelectorItem): boolean {
    return item.stock > 0;
  }

  isLowStock(item: SizeSelectorItem): boolean {
    const threshold = this.lowStockThreshold();
    return threshold !== null && item.stock > 0 && item.stock <= threshold;
  }

  ariaLabel(item: SizeSelectorItem): string {
    if (!this.isAvailable(item)) {
      return `${this.term()} ${item.size} (indisponible)`;
    }
    if (this.isLowStock(item)) {
      return `${this.term()} ${item.size}, plus que ${item.stock} en stock`;
    }
    return `${this.term()} ${item.size}, ${item.stock} en stock`;
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

  /** Navigation clavier attendue dans un radiogroup : flèches + Home/End. */
  onKeydown(event: KeyboardEvent): void {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    const current = event.target as HTMLElement;
    const list = current.closest('.bs-size-selector__list');
    if (list === null) return;

    const buttons = Array.from(list.querySelectorAll<HTMLButtonElement>('button.bs-size')).filter(
      (button) => !button.disabled,
    );
    if (buttons.length === 0) return;

    event.preventDefault();
    const index = buttons.indexOf(current as HTMLButtonElement);
    let nextIndex = index;
    if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = buttons.length - 1;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (index + 1) % buttons.length;
    } else {
      nextIndex = (index - 1 + buttons.length) % buttons.length;
    }
    const next = buttons[nextIndex];
    next?.focus();
    next?.click();
  }
}
