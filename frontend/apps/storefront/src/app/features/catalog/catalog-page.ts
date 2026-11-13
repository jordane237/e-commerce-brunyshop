import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, Subject } from 'rxjs';
import { SeoService } from '../../core/seo.service';
import {
  CATALOG_PAGE_SIZE,
  CatalogFilterKey,
  CatalogFilters,
  CatalogSort,
  hasSameFilters,
  parseCatalogFilters,
  resetCatalogFilters,
  toCatalogQueryParams,
  withFilterPatch,
  withoutFilter,
} from './catalog-query';
import { CatalogStore } from './catalog.store';
import { ActiveFiltersChipsComponent } from './components/active-filters-chips/active-filters-chips.component';
import { CatalogHeaderComponent } from './components/catalog-header/catalog-header.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { FilterDrawerComponent } from './components/filter-drawer/filter-drawer.component';
import { FilterSidebarComponent } from './components/filter-sidebar/filter-sidebar.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { ProductGridComponent } from './components/product-grid/product-grid.component';

/**
 * Page boutique (CAT-08).
 *
 * L'URL est l'unique source de vérité : chaque changement de filtre écrit les
 * query params, puis l'abonnement `queryParamMap` recharge le store. Le retour
 * arrière restaure donc naturellement les filtres et la page précédents.
 */
@Component({
  selector: 'bruny-catalog-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CatalogHeaderComponent,
    FilterSidebarComponent,
    FilterDrawerComponent,
    ActiveFiltersChipsComponent,
    ProductGridComponent,
    EmptyStateComponent,
    PaginationComponent,
  ],
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.scss',
})
export class CatalogPage {
  readonly store = inject(CatalogStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);

  readonly pageSize = CATALOG_PAGE_SIZE;
  readonly drawerOpen = signal(false);
  readonly searchDraft = signal('');

  /** Vrai uniquement pour la navigation déclenchée par « Voir plus ». */
  private appendNext = false;
  private readonly search$ = new Subject<string>();

  readonly title = computed(() => {
    const category = this.store.filters().category;
    if (!category) return 'Boutique';
    return (
      this.store.facets()?.categories.find((item) => item.slug === category)?.name ?? 'Boutique'
    );
  });

  readonly suggestions = computed(
    () =>
      this.store
        .facets()
        ?.categories.slice(0, 3)
        .map(({ name, slug }) => ({ name, slug })) ?? [],
  );

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => this.applyUrl(params));

    // Recherche : seule saisie continue, donc la seule à mériter un debounce.
    this.search$
      .pipe(
        map((value) => value.trim()),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((value) => this.updateFilters({ q: value || undefined }));

    effect(() => {
      const name = this.title();
      this.seo.set(
        name,
        name === 'Boutique'
          ? 'Découvrez notre sélection de chaussures livrées partout au Cameroun.'
          : `Découvrez la sélection ${name} de BRUNY SHOPPING, livrée partout au Cameroun.`,
        '/boutique',
      );
    });
  }

  onSearch(value: string): void {
    this.searchDraft.set(value);
    this.search$.next(value);
  }

  onSort(sort: CatalogSort): void {
    this.navigate({ ...this.store.filters(), sort });
  }

  onPageChange(page: number): void {
    this.navigate({ ...this.store.filters(), page });
  }

  onLoadMore(): void {
    const filters = this.store.filters();
    this.navigate({ ...filters, page: filters.page + 1 }, true);
  }

  onFiltersChange(patch: Partial<CatalogFilters>): void {
    this.updateFilters(patch);
  }

  onRemoveFilter(key: CatalogFilterKey): void {
    this.navigate(withoutFilter(this.store.filters(), key));
  }

  onReset(): void {
    this.navigate(resetCatalogFilters(this.store.filters()));
  }

  openDrawer(): void {
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  retry(): void {
    this.store.retry();
  }

  private updateFilters(patch: Partial<CatalogFilters>): void {
    this.navigate(withFilterPatch(this.store.filters(), patch));
  }

  private applyUrl(params: ParamMap): void {
    const filters = parseCatalogFilters(params);
    const previous = this.store.filters();
    const append =
      this.appendNext &&
      filters.page === previous.page + 1 &&
      hasSameFilters(filters, previous, { ignorePage: true });
    this.appendNext = false;

    if (this.searchDraft() !== (filters.q ?? '')) this.searchDraft.set(filters.q ?? '');
    this.store.load(filters, append);
  }

  private navigate(filters: CatalogFilters, append = false): void {
    this.appendNext = append;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: toCatalogQueryParams(filters),
    });
  }
}
