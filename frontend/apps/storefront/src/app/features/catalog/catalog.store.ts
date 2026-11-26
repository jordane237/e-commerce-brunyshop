import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CatalogApi, CatalogFacets, CatalogProduct } from '@bruny/data-access';
import { catchError, EMPTY, map, switchMap } from 'rxjs';
import { Subject } from 'rxjs';
import {
  CATALOG_PAGE_SIZE,
  CatalogFilters,
  countActiveFilters,
  DEFAULT_CATALOG_FILTERS,
  withFilterPatch,
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
  private readonly loadRequests$ = new Subject<{
    filters: CatalogFilters;
    append: boolean;
  }>();

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

  constructor() {
    this.loadRequests$
      .pipe(
        switchMap(({ filters, append }) => {
          const requestId = ++this.requestId;
          this.lastAppend = append;
          this.filtersState.set(filters);
          this.errorState.set(null);
          this.loadingState.set(!append);
          this.loadingMoreState.set(append);

          return this.api
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
            .pipe(
              map((response) => ({ response, append, requestId })),
              catchError(() => {
                if (requestId !== this.requestId) return EMPTY;
                this.errorState.set(CATALOG_ERROR);
                this.loadingState.set(false);
                this.loadingMoreState.set(false);
                return EMPTY;
              }),
            );
        }),
        takeUntilDestroyed(),
      )
      .subscribe(({ response, append, requestId }) => {
        if (requestId !== this.requestId) return;
        this.productsState.update((current) =>
          append ? [...current, ...response.items] : response.items,
        );
        this.metaState.set(response.pagination);
        this.facetsState.set(response.facets);
        this.loadingState.set(false);
        this.loadingMoreState.set(false);
      });
  }

  /**
   * Charge une page. `append` est utilisé par « Voir plus » : la nouvelle page
   * s'ajoute à la liste, alors qu'une navigation classique la remplace.
   */
  load(filters: CatalogFilters, append = false): void {
    this.loadRequests$.next({ filters, append });
  }

  /** Applique un patch de filtre en repartant de l'état courant (page 1 sauf patch explicite). */
  setFilters(patch: Partial<CatalogFilters>): void {
    this.load(withFilterPatch(this.filtersState(), patch));
  }

  retry(): void {
    this.load(this.filtersState(), this.lastAppend);
  }
}
