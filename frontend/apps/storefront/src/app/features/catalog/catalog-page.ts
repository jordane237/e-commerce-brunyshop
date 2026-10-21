import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogApi, CatalogCategory, ProductPage } from '@bruny/data-access';
import { ProductCardComponent, SkeletonComponent } from '@bruny/ui';
import { SeoService } from '../../core/seo.service';

@Component({
  standalone: true,
  selector: 'bruny-catalog-page',
  imports: [ProductCardComponent, SkeletonComponent],
  template: `
    <section class="hero">
      <div class="container hero-inner">
        <div>
          <p class="eyebrow">LE STYLE À VOS PIEDS</p>
          <h1>Trouvez votre prochaine paire.</h1>
          <p>Une sélection pensée pour votre quotidien, livrée partout au Cameroun.</p>
        </div>
        <div class="hero-mark" aria-hidden="true">BR<span>Û</span>NY</div>
      </div>
    </section>
    <section class="container catalog">
      <div class="catalog-heading">
        <div>
          <p class="eyebrow">NOTRE SÉLECTION</p>
          <h2>La boutique</h2>
        </div>
        <p>{{ result()?.pagination?.total ?? 0 }} modèles</p>
      </div>
      <form class="filters" (submit)="$event.preventDefault(); applySearch(search.value)">
        <label
          >Catégorie
          <select #category (change)="applyCategory(category.value)">
            <option value="">Toutes les catégories</option>
            @for (item of categories(); track item.id) {
              <option [value]="item.slug">{{ item.name }}</option>
            }
          </select>
        </label>
        <label
          >Pointure
          <select #size (change)="applySize(size.value)">
            <option value="">Toutes les pointures</option>
            @for (number of sizes; track number) {
              <option [value]="number">{{ number }}</option>
            }
          </select>
        </label>
        <label class="search"
          >Rechercher
          <input
            #search
            type="search"
            placeholder="Modèle, marque…"
            (change)="applySearch(search.value)"
          />
        </label>
      </form>
      @if (state() === 'loading') {
        <div class="grid">
          @for (item of placeholders; track item) {
            <bruny-skeleton />
          }
        </div>
      } @else if (state() === 'error') {
        <div class="state error">
          <h3>Le catalogue ne répond pas pour le moment.</h3>
          <p>Réessayez dans quelques instants.</p>
          <button type="button" (click)="load()">Réessayer</button>
        </div>
      } @else if (result()?.items?.length) {
        <div class="grid">
          @for (product of result()!.items; track product.id) {
            <bruny-product-card [product]="product" />
          }
        </div>
        @if (result()!.pagination.pages > 1) {
          <nav class="pagination" aria-label="Pages du catalogue">
            <button type="button" [disabled]="page() <= 1" (click)="changePage(page() - 1)">
              Précédent
            </button>
            <span>Page {{ page() }} sur {{ result()!.pagination.pages }}</span>
            <button
              type="button"
              [disabled]="page() >= result()!.pagination.pages"
              (click)="changePage(page() + 1)"
            >
              Suivant
            </button>
          </nav>
        }
      } @else {
        <div class="state">
          <h3>Aucun modèle trouvé</h3>
          <p>Modifiez vos filtres pour découvrir d’autres chaussures.</p>
        </div>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .hero {
        background: #1f2a44;
        color: white;
        overflow: hidden;
      }
      .hero-inner {
        min-height: 270px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .hero h1 {
        font-size: clamp(2rem, 5vw, 3.5rem);
        letter-spacing: -0.04em;
        max-width: 620px;
        margin: 12px 0;
      }
      .hero p:not(.eyebrow) {
        color: #d6d9e2;
        max-width: 500px;
      }
      .eyebrow {
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.16em;
        color: #c9a227;
      }
      .hero-mark {
        font-size: clamp(5rem, 12vw, 10rem);
        font-weight: 900;
        letter-spacing: -0.12em;
        color: #ffffff14;
      }
      .hero-mark span {
        color: #c9a227;
      }
      .catalog {
        padding-block: 50px;
      }
      .catalog-heading {
        display: flex;
        align-items: end;
        justify-content: space-between;
      }
      .catalog-heading h2 {
        font-size: 2rem;
        margin: 0;
      }
      .catalog-heading > p {
        color: #687087;
      }
      .filters {
        display: flex;
        gap: 14px;
        align-items: end;
        margin: 24px 0 30px;
        padding: 18px;
        background: #f7f7f6;
        border-radius: 12px;
      }
      .filters label {
        display: grid;
        gap: 7px;
        font-size: 0.8rem;
        font-weight: 700;
        flex: 1;
      }
      .filters input,
      .filters select {
        height: 44px;
        border: 1px solid #dedfe4;
        border-radius: 8px;
        background: white;
        padding: 0 12px;
        min-width: 0;
      }
      .filters .search {
        flex: 1.4;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 22px;
      }
      .grid bruny-skeleton {
        height: 320px;
        background: #f1f0ed;
        border-radius: 12px;
        animation: pulse 1.4s ease-in-out infinite alternate;
      }
      .state {
        text-align: center;
        padding: 72px 20px;
        color: #5c6475;
      }
      .state.error {
        color: #a5232d;
      }
      .state button,
      .pagination button {
        border: 0;
        border-radius: 8px;
        background: #1f2a44;
        color: white;
        padding: 10px 16px;
        cursor: pointer;
      }
      .pagination {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
        margin-top: 35px;
      }
      .pagination button:disabled {
        opacity: 0.45;
        cursor: default;
      }
      @keyframes pulse {
        to {
          opacity: 0.45;
        }
      }
      @media (max-width: 800px) {
        .grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .filters {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .filters .search {
          grid-column: 1/-1;
        }
        .hero-mark {
          display: none;
        }
      }
      @media (max-width: 500px) {
        .grid {
          gap: 9px;
        }
        .catalog {
          padding-block: 32px;
        }
        .filters {
          padding: 12px;
        }
        .site-header {
          height: 64px;
        }
      }
    `,
  ],
})
export class CatalogPage implements OnInit {
  private readonly api = inject(CatalogApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  readonly result = signal<ProductPage | null>(null);
  readonly categories = signal<CatalogCategory[]>([]);
  readonly page = signal(1);
  readonly placeholders = [1, 2, 3, 4];
  readonly sizes = Array.from({ length: 11 }, (_, index) => String(index + 36));
  private filters: { category?: string; size?: string; q?: string } = {};

  ngOnInit(): void {
    this.seo.set(
      'Chaussures',
      'Découvrez notre sélection de chaussures livrées partout au Cameroun.',
      '/boutique',
    );
    this.route.queryParamMap.subscribe((params) => {
      this.page.set(Number(params.get('page') ?? 1));
      this.load();
    });
    this.api
      .categories()
      .subscribe({ next: (items) => this.categories.set(items), error: () => undefined });
  }

  load(): void {
    this.state.set('loading');
    this.api.list({ ...this.filters, page: this.page(), limit: 12 }).subscribe({
      next: (response) => {
        this.result.set(response);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  applyCategory(category: string): void {
    this.filters.category = category || undefined;
    this.page.set(1);
    this.load();
  }
  applySize(size: string): void {
    this.filters.size = size || undefined;
    this.page.set(1);
    this.load();
  }
  applySearch(q: string): void {
    this.filters.q = q.trim() || undefined;
    this.page.set(1);
    this.load();
  }
  changePage(page: number): void {
    this.page.set(page);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }
}
