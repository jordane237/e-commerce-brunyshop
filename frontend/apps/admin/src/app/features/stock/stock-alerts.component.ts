import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AdminStockApi, StockAlert } from '@bruny/data-access';

@Component({
  selector: 'app-stock-alerts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `
    <section class="stock-alerts">
      <h1>Alertes de stock</h1>
      @if (loading()) {
        <p>Chargement…</p>
      } @else if (error()) {
        <p class="stock-alerts__error">{{ error() }}</p>
      } @else if (alerts().length === 0) {
        <p>Aucune alerte de stock.</p>
      } @else {
        <p class="stock-alerts__summary">
          {{ meta().lowCount }} en stock bas · {{ meta().outCount }} en rupture ·
          {{ meta().total }} au total
        </p>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>SKU</th>
                <th>Taille</th>
                <th>Couleur</th>
                <th>Disponible</th>
                <th>Seuil</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              @for (alert of alerts(); track alert.variantId) {
                <tr>
                  <td>{{ alert.productName }}</td>
                  <td>{{ alert.sku }}</td>
                  <td>{{ alert.size }}</td>
                  <td>{{ alert.color }}</td>
                  <td>{{ alert.availableStock }}</td>
                  <td>{{ alert.threshold }}</td>
                  <td>{{ alert.status === 'OUT' ? 'Rupture' : 'Stock bas' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .stock-alerts {
        padding: 1.5rem;
      }
      .stock-alerts__summary {
        font-weight: 600;
      }
      .stock-alerts__error {
        color: #c00;
      }
      .table-scroll {
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        padding: 0.5rem 0.75rem;
        border-bottom: 1px solid #e5e5e5;
        text-align: left;
      }
    `,
  ],
})
export class StockAlertsComponent implements OnInit {
  private readonly api = inject(AdminStockApi);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly alerts = signal<StockAlert[]>([]);
  readonly meta = signal({ total: 0, page: 1, limit: 20, totalPages: 0, lowCount: 0, outCount: 0 });

  ngOnInit(): void {
    this.api.list({ limit: 50 }).subscribe({
      next: (res) => {
        this.alerts.set(res.data);
        this.meta.set(res.meta);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les alertes de stock.');
        this.loading.set(false);
      },
    });
  }
}
