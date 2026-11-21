import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogSort } from '../../catalog-query';
import { SortSelectComponent } from '../sort-select/sort-select.component';

/**
 * En-tête du catalogue : fil d'Ariane, titre, compteur, recherche, tri et
 * bouton d'ouverture du tiroir de filtres sur mobile.
 */
@Component({
  selector: 'bruny-catalog-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SortSelectComponent],
  templateUrl: './catalog-header.component.html',
  styleUrl: './catalog-header.component.scss',
})
export class CatalogHeaderComponent {
  readonly title = input.required<string>();
  readonly total = input(0);
  readonly activeFilterCount = input(0);
  readonly search = input('');
  readonly sort = input<CatalogSort>('newest');
  readonly filtersOpen = input(false);

  readonly searchChange = output<string>();
  readonly sortChange = output<CatalogSort>();
  readonly openFilters = output<void>();

  readonly resultLabel = computed(() => {
    const total = this.total();
    return total === 1 ? '1 produit' : `${total} produits`;
  });

  onSearch(event: Event): void {
    this.searchChange.emit((event.target as HTMLInputElement).value);
  }
}
