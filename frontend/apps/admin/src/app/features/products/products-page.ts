import { Component, inject, OnInit, signal } from '@angular/core';
import { CatalogApi, CatalogProduct, ProductPage } from '@bruny/data-access';
import { FcfaPipe } from '@bruny/util';
import { errorMessage } from '../../core/http';

@Component({
  standalone: true,
  selector: 'bruny-admin-products',
  imports: [FcfaPipe],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">GESTION DU CATALOGUE</p>
          <h1>Produits</h1>
          <p>Consultez les modèles publiés dans la boutique.</p>
        </div>
        <span class="count">{{ result()?.pagination?.total ?? 0 }} produits</span>
      </header>
      @if (loading()) {
        <div class="panel loading">Chargement du catalogue…</div>
      } @else if (errorMessage()) {
        <div class="panel error" role="alert">
          {{ errorMessage() }} <button (click)="load()">Réessayer</button>
        </div>
      } @else if (products().length) {
        <div class="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Marque</th>
                <th>Prix de base</th>
                <th>Variantes</th>
                <th>Stock total</th>
              </tr>
            </thead>
            <tbody>
              @for (product of products(); track product.id) {
                <tr>
                  <td>
                    <strong>{{ product.name }}</strong
                    ><small>{{ product.slug }}</small>
                  </td>
                  <td>{{ product.brand.name }}</td>
                  <td>{{ product.basePrice | fcfa }}</td>
                  <td>{{ product.variants.length }}</td>
                  <td>{{ stock(product) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <button [disabled]="page() <= 1" (click)="changePage(page() - 1)">Précédent</button
          ><span>Page {{ page() }} / {{ result()!.pagination.pages }}</span
          ><button
            [disabled]="page() >= result()!.pagination.pages"
            (click)="changePage(page() + 1)"
          >
            Suivant
          </button>
        </div>
      } @else {
        <div class="panel empty">
          <h2>Aucun produit publié</h2>
          <p>Les produits publiés apparaîtront ici.</p>
        </div>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .page {
        padding: clamp(24px, 5vw, 50px);
      }
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: end;
        margin-bottom: 25px;
      }
      .eyebrow {
        color: #9a7b14;
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 0.14em;
      }
      .page-header h1 {
        font-size: 2rem;
        margin: 5px 0;
      }
      .page-header p:last-child {
        color: #687087;
        margin: 0;
      }
      .count {
        padding: 9px 13px;
        border-radius: 999px;
        background: #ebeef3;
      }
      .panel {
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 8px 24px #1f2a440a;
      }
      .table-wrap {
        overflow: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        white-space: nowrap;
      }
      th {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #798093;
        background: #fafafa;
      }
      th,
      td {
        padding: 15px 18px;
        border-bottom: 1px solid #eceef2;
      }
      td small {
        display: block;
        color: #8990a0;
        margin-top: 4px;
      }
      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 16px;
        padding: 22px;
      }
      .pagination button,
      .error button {
        border: 0;
        background: #1f2a44;
        color: #fff;
        border-radius: 7px;
        padding: 10px 14px;
      }
      .pagination button:disabled {
        opacity: 0.4;
      }
      .empty,
      .loading,
      .error {
        text-align: center;
        padding: 60px 20px;
      }
      .empty p {
        color: #687087;
      }
      .error {
        color: #a5232d;
      }
    `,
  ],
})
export class ProductsPage implements OnInit {
  private readonly api = inject(CatalogApi);
  readonly errorMessage = errorMessage;
  readonly result = signal<ProductPage | null>(null);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly products = signal<CatalogProduct[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list({ page: this.page(), limit: 20 }).subscribe({
      next: (result) => {
        this.result.set(result);
        this.products.set(result.items);
        this.errorMessage.set('');
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  stock(product: CatalogProduct): number {
    return product.variants.reduce((total, variant) => total + variant.stock, 0);
  }

  changePage(nextPage: number): void {
    this.page.set(nextPage);
    this.load();
  }
}
