import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { isCatalogSort, SORT_LABELS, CATALOG_SORTS, CatalogSort } from '../../catalog-query';

/**
 * Sélecteur de tri natif : accessible au clavier et au lecteur d'écran sans
 * recoder un listbox. Les quatre options correspondent exactement au contrat
 * backend CAT-02 (`newest`, `price_asc`, `price_desc`, `name`).
 */
@Component({
  selector: 'bruny-sort-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="sort">
      <span class="sort__label">Trier par</span>
      <select class="sort__select" [value]="value()" (change)="onChange($event)">
        @for (option of options; track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
    </label>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .sort {
        display: grid;
        gap: var(--bs-space-1);
      }
      .sort__label {
        font-size: var(--bs-font-size-xs);
        font-weight: var(--bs-font-weight-semibold);
        color: var(--bs-color-text-muted);
      }
      .sort__select {
        min-height: var(--bs-touch-target);
        padding: 0 var(--bs-space-8) 0 var(--bs-space-3);
        border: 1px solid var(--bs-color-neutral-600);
        border-radius: var(--bs-radius-md);
        background: var(--bs-color-surface);
        color: var(--bs-color-text);
        font: inherit;
        cursor: pointer;
      }
      .sort__select:focus-visible {
        outline: none;
        box-shadow: var(--bs-shadow-focus);
      }
    `,
  ],
})
export class SortSelectComponent {
  readonly value = input<CatalogSort>('newest');
  readonly sortChange = output<CatalogSort>();

  readonly options = CATALOG_SORTS.map((value) => ({ value, label: SORT_LABELS[value] }));

  onChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (isCatalogSort(value)) this.sortChange.emit(value);
  }
}
