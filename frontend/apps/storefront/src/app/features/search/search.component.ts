import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { CatalogApi, CatalogProduct } from '@bruny/data-access';
import { ProductCardComponent, EmptyStateComponent, ButtonComponent } from '@bruny/ui';
import { ProductGridComponent } from '../catalog/components/product-grid/product-grid.component';
import { CatalogStore } from '../catalog/catalog.store';
import { CartStore } from '../../core/cart/cart.store';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'bruny-search-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    ProductGridComponent,
    ProductCardComponent,
    EmptyStateComponent,
    ButtonComponent,
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent {
  private readonly catalogStore = inject(CatalogStore);
  private readonly catalogApi = inject(CatalogApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seoService = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cart = inject(CartStore);

  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly query = signal('');
  readonly products = this.catalogStore.products;
  readonly meta = this.catalogStore.meta;
  readonly loading = this.catalogStore.loading;
  readonly error = this.catalogStore.error;
  readonly isEmpty = computed(() => !!this.query() && this.catalogStore.isEmpty());
  readonly suggestions = signal<CatalogProduct[]>([]);

  constructor() {
    this.route.queryParamMap
      .pipe(
        map((params) => (params.get('q') ?? '').trim()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((query) => {
        this.query.set(query);
        this.searchControl.setValue(query, { emitEvent: false });
        if (query) {
          this.catalogStore.setFilters({ q: query, page: 1 });
        } else {
          this.catalogStore.setFilters({ q: undefined, page: 1 });
        }
      });

    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        map((value) => value.trim()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { q: value || null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      });

    this.seoService.setPageMeta({
      title: 'Recherche',
      description: 'Recherchez une chaussure par nom, marque ou catégorie sur BRUNY SHOPPING.',
      noIndex: true,
    });

    this.loadSuggestions();
  }

  onClear(): void {
    this.searchControl.setValue('');
  }

  onRetry(): void {
    this.catalogStore.retry();
  }

  goToCatalog(): void {
    void this.router.navigate(['/boutique']);
  }

  onSuggestionClick(product: CatalogProduct): void {
    void this.router.navigate(['/produit', product.slug]);
  }

  onAdd(product: CatalogProduct): void {
    this.cart.addProduct(product);
  }

  private loadSuggestions(): void {
    this.catalogApi.list({ limit: 8, sort: 'newest' }).subscribe({
      next: (result) => this.suggestions.set(result.items),
      error: () => this.suggestions.set([]),
    });
  }
}
