import { inject, Injectable, signal } from '@angular/core';
import { CatalogApi, CatalogCategory, CatalogProduct } from '@bruny/data-access';

/**
 * Orchestration des appels API de la page d'accueil (CAT-07).
 *
 * Tous les appels passent par `CatalogApi` (`@bruny/data-access`, TEC-09) :
 * aucun `HttpClient` brut dans la feature. Chaque section expose ses propres
 * signaux `loading` / `error` afin d'isoler les erreurs (CA #4).
 */
@Injectable({ providedIn: 'root' })
export class HomeDataService {
  private readonly api = inject(CatalogApi);

  /** Nombre de produits par section (grille P01 : 2 colonnes mobile). */
  private readonly sectionSize = 8;

  readonly categories = signal<CatalogCategory[] | null>(null);
  readonly categoriesLoading = signal(false);
  readonly categoriesError = signal<string | null>(null);

  readonly newProducts = signal<CatalogProduct[] | null>(null);
  readonly newProductsLoading = signal(false);
  readonly newProductsError = signal<string | null>(null);

  readonly bestSellers = signal<CatalogProduct[] | null>(null);
  readonly bestSellersLoading = signal(false);
  readonly bestSellersError = signal<string | null>(null);

  readonly promotions = signal<CatalogProduct[] | null>(null);
  readonly promotionsLoading = signal(false);
  readonly promotionsError = signal<string | null>(null);

  loadCategories(): void {
    this.categoriesLoading.set(true);
    this.categoriesError.set(null);
    this.api.categories().subscribe({
      next: (items) => {
        // P01 n'affiche que les rayons de premier niveau.
        this.categories.set(items.filter((category) => category.parent === null));
        this.categoriesLoading.set(false);
      },
      error: () => {
        this.categoriesError.set('Impossible de charger les catégories. Réessayez.');
        this.categoriesLoading.set(false);
      },
    });
  }

  loadNewProducts(): void {
    this.newProductsLoading.set(true);
    this.newProductsError.set(null);
    this.api.list({ sort: 'newest', limit: this.sectionSize }).subscribe({
      next: (page) => {
        this.newProducts.set(page.items);
        this.newProductsLoading.set(false);
      },
      error: () => {
        this.newProductsError.set('Impossible de charger les nouveautés. Réessayez.');
        this.newProductsLoading.set(false);
      },
    });
  }

  loadBestSellers(): void {
    // Réserve : le backend CAT-02 n'expose pas de tri `popular`.
    // En attendant, on retombe sur `newest` (documenté dans ANALYSE-DESIGN.md).
    this.bestSellersLoading.set(true);
    this.bestSellersError.set(null);
    this.api.list({ sort: 'newest', limit: this.sectionSize }).subscribe({
      next: (page) => {
        this.bestSellers.set(page.items);
        this.bestSellersLoading.set(false);
      },
      error: () => {
        this.bestSellersError.set('Impossible de charger les meilleures ventes. Réessayez.');
        this.bestSellersLoading.set(false);
      },
    });
  }

  loadPromotions(): void {
    this.promotionsLoading.set(true);
    this.promotionsError.set(null);
    this.api.list({ promo: true, sort: 'newest', limit: this.sectionSize }).subscribe({
      next: (page) => {
        this.promotions.set(page.items);
        this.promotionsLoading.set(false);
      },
      error: () => {
        this.promotionsError.set('Impossible de charger les promotions. Réessayez.');
        this.promotionsLoading.set(false);
      },
    });
  }

  /** Bouton « Réessayer » global : relance les quatre sections. */
  reloadAll(): void {
    this.loadCategories();
    this.loadNewProducts();
    this.loadBestSellers();
    this.loadPromotions();
  }
}
