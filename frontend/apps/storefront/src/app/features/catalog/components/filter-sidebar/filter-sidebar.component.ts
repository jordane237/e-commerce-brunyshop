import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CatalogFacets } from '@bruny/data-access';
import { CatalogFilters, colorLabel, countActiveFilters } from '../../catalog-query';

/**
 * Filtres du catalogue, partagés entre la barre latérale desktop et le tiroir
 * mobile. Le composant est purement présentationnel : il émet un patch de
 * filtres, la page décide de la navigation.
 */
@Component({
  selector: 'bruny-filter-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './filter-sidebar.component.html',
  styleUrl: './filter-sidebar.component.scss',
})
export class FilterSidebarComponent {
  readonly filters = input.required<CatalogFilters>();
  readonly facets = input<CatalogFacets | null>(null);
  /** Évite les ids dupliqués quand la sidebar est aussi rendue dans le tiroir. */
  readonly idPrefix = input('desktop');

  readonly filtersChange = output<Partial<CatalogFilters>>();
  readonly reset = output<void>();

  readonly colorLabel = colorLabel;
  readonly activeFilterCount = computed(() => countActiveFilters(this.filters()));
  readonly categories = computed(() =>
    [...(this.facets()?.categories ?? [])].sort((left, right) =>
      left.name.localeCompare(right.name, 'fr'),
    ),
  );
  readonly brands = computed(() =>
    [...(this.facets()?.brands ?? [])].sort((left, right) =>
      left.name.localeCompare(right.name, 'fr'),
    ),
  );
  readonly sizes = computed(() =>
    [...(this.facets()?.sizes ?? [])].sort(
      (left, right) => Number(left.value) - Number(right.value),
    ),
  );
  readonly colors = computed(() =>
    [...(this.facets()?.colors ?? [])].sort((left, right) =>
      colorLabel(left.value).localeCompare(colorLabel(right.value), 'fr'),
    ),
  );

  selectCategory(value: string | undefined): void {
    this.filtersChange.emit({ category: value });
  }

  selectBrand(value: string | undefined): void {
    this.filtersChange.emit({ brand: value });
  }

  toggleSize(value: string): void {
    this.filtersChange.emit({
      size: this.filters().size === value ? undefined : value,
    });
  }

  toggleColor(value: string): void {
    this.filtersChange.emit({
      color: this.filters().color === value ? undefined : value,
    });
  }

  setStock(checked: boolean): void {
    this.filtersChange.emit({ inStock: checked ? true : undefined });
  }

  setPromo(checked: boolean): void {
    this.filtersChange.emit({ promo: checked ? true : undefined });
  }

  applyPrice(min: string, max: string): void {
    const minPrice = this.toPrice(min);
    const maxPrice = this.toPrice(max);
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      this.filtersChange.emit({ minPrice: maxPrice, maxPrice: minPrice });
      return;
    }
    this.filtersChange.emit({ minPrice, maxPrice });
  }

  private toPrice(value: string): number | undefined {
    if (value.trim() === '') return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) return undefined;
    return parsed;
  }
}
