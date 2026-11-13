import { computed, inject, Injectable, signal } from '@angular/core';
import { CatalogApi, CatalogFacets, CatalogProduct } from '@bruny/data-access';
import {
  CATALOG_PAGE_SIZE,
  CatalogFilters,
  countActiveFilters,
  DEFAULT_CATALOG_FILTERS,
} from './catalog-query';

export interface CatalogMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/** Message réseau canonique du glossaire DSG-07. */
export const CATALOG_ERROR = 'Connexion impossible. Vérifiez votre réseau et réessayez.';

/**
 * État du catalogue (CAT-08).
 *
 * Le store ne connaît ni l'URL ni le Router : il reçoit les filtres déjà
 * parsés et charge la page correspondante. Ce découplage supprime les boucles
 * URL ↔ état et rend le retour arrière trivial (l'URL redevient autoritaire).
 */
@Injectable()
export class CatalogStore {
  private readonly api = inject(CatalogApi);
  /** Jeton de requête : une réponse obsolète ne doit jamais écraser la suivante. */
  private requestId = 0;
  /** Mémorise le mode du dernier chargement pour que `retry()` le respecte. */
  private lastAppend = false;

  private readonly filtersState = signal<CatalogFilters>({ ...DEFAULT_CATALOG_FILTERS });
  private readonly productsState = signal<CatalogProduct[]>([]);
  private readonly metaState = signal<CatalogMeta | null>(null);
  private readonly facetsState = signal<CatalogFacets | null>(null);
  private readonly loadingState = signal(false);
  private readonly loadingMoreState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly filters = this.filtersState.asReadonly();
  readonly products = this.productsState.asReadonly();
  readonly meta = this.metaState.asReadonly();
  readonly facets = this.facetsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly loadingMore = this.loadingMoreState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly total = computed(() => this.metaState()?.total ?? 0);
  readonly totalPages = computed(() => this.metaState()?.pages ?? 0);
  readonly hasResults = computed(() => this.productsState().length > 0);
  readonly isEmpty = computed(
    () => !this.loadingState() && !this.errorState() && this.productsState().length === 0,
  );
  readonly activeFilterCount = computed(() => countActiveFilters(this.filtersState()));

  /**
   * Charge une page. `append` est utilisé par « Voir plus » : la nouvelle page
   * s'ajoute à la liste, alors qu'une navigation classique la remplace.
   */
  load(filters: CatalogFilters, append = false): void {
    const requestId = ++this.requestId;
    this.lastAppend = append;
    this.filtersState.set(filters);
    this.errorState.set(null);
    this.loadingState.set(!append);
    this.loadingMoreState.set(append);

    this.api
      .list({
        category: filters.category,
        brand: filters.brand,
        size: filters.size,
        color: filters.color,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        inStock: filters.inStock,
        promo: filters.promo,
        q: filters.q,
        sort: filters.sort,
        page: filters.page,
        limit: CATALOG_PAGE_SIZE,
      })
      .subscribe({
        next: (response) => {
          if (requestId !== this.requestId) return;
          this.productsState.update((current) =>
            append ? [...current, ...response.items] : response.items,
          );
          this.metaState.set(response.pagination);
          this.facetsState.set(response.facets);
          this.loadingState.set(false);
          this.loadingMoreState.set(false);
        },
        error: () => {
          if (requestId !== this.requestId) return;
          // En ajout, on conserve les produits déjà affichés et on expose
          // l'erreur au lieu de vider la grille sous les yeux du client.
          this.errorState.set(CATALOG_ERROR);
          this.loadingState.set(false);
          this.loadingMoreState.set(false);
        },
      });
  }

  retry(): void {
    this.load(this.filtersState(), this.lastAppend);
  }
}
