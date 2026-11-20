import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CatalogFacets } from '@bruny/data-access';
import { formatFcfa } from '@bruny/util';
import { CatalogFilterKey, CatalogFilters, colorLabel } from '../../catalog-query';

interface FilterChip {
  key: CatalogFilterKey;
  label: string;
}

/** Puces des filtres actifs, chacune supprimable individuellement. */
@Component({
  selector: 'bruny-active-filters-chips',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './active-filters-chips.component.html',
  styleUrl: './active-filters-chips.component.scss',
})
export class ActiveFiltersChipsComponent {
  readonly filters = input.required<CatalogFilters>();
  readonly facets = input<CatalogFacets | null>(null);

  readonly remove = output<CatalogFilterKey>();
  readonly reset = output<void>();

  readonly chips = computed<FilterChip[]>(() => {
    const filters = this.filters();
    const facets = this.facets();
    const chips: FilterChip[] = [];

    if (filters.category) {
      chips.push({
        key: 'category',
        label:
          facets?.categories.find((category) => category.slug === filters.category)?.name ??
          filters.category,
      });
    }
    if (filters.brand) {
      chips.push({
        key: 'brand',
        label: facets?.brands.find((brand) => brand.slug === filters.brand)?.name ?? filters.brand,
      });
    }
    if (filters.size) chips.push({ key: 'size', label: `Pointure ${filters.size}` });
    if (filters.color) chips.push({ key: 'color', label: colorLabel(filters.color) });
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      chips.push({ key: 'price', label: this.priceLabel(filters) });
    }
    if (filters.inStock === true) chips.push({ key: 'inStock', label: 'En stock' });
    if (filters.promo === true) chips.push({ key: 'promo', label: 'En promotion' });
    if (filters.q) chips.push({ key: 'q', label: `Recherche : « ${filters.q} »` });

    return chips;
  });

  private priceLabel(filters: CatalogFilters): string {
    if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
      return `${formatFcfa(filters.minPrice)} – ${formatFcfa(filters.maxPrice)}`;
    }
    if (filters.minPrice !== undefined) return `À partir de ${formatFcfa(filters.minPrice)}`;
    return `Jusqu'à ${formatFcfa(filters.maxPrice)}`;
  }
}
