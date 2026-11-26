import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  AdminStockApi,
  AdminStockVariant,
  AdminStockVariantsFilters,
  AdjustStockPayload,
  StockMovementItem,
  StockMovementsFilters,
  StockMovementsPage,
} from '@bruny/data-access';
import { ToastService } from '@bruny/core';

export interface AdminStockFiltersState {
  search?: string;
  categoryId?: string;
  stockStatus: 'all' | 'out' | 'low' | 'in_stock';
  page: number;
  limit: number;
}

const DEFAULT_FILTERS: AdminStockFiltersState = {
  stockStatus: 'all',
  page: 1,
  limit: 20,
};

@Injectable({ providedIn: 'root' })
export class AdminStockStore {
  private readonly api = inject(AdminStockApi);
  private readonly toast = inject(ToastService);

  private readonly _variants = signal<AdminStockVariant[]>([]);
  private readonly _meta = signal<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  private readonly _filters = signal<AdminStockFiltersState>({ ...DEFAULT_FILTERS });
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _categories = signal<{ id: string; name: string }[]>([]);
  private readonly _adjusting = signal<AdminStockVariant | null>(null);
  private readonly _historyOpen = signal(false);
  private readonly _historyVariant = signal<AdminStockVariant | null>(null);
  private readonly _history = signal<StockMovementItem[]>([]);
  private readonly _historyMeta = signal<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  private readonly _historyLoading = signal(false);

  readonly variants = this._variants.asReadonly();
  readonly meta = this._meta.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly categories = this._categories.asReadonly();
  readonly adjusting = this._adjusting.asReadonly();
  readonly historyOpen = this._historyOpen.asReadonly();
  readonly historyVariant = this._historyVariant.asReadonly();
  readonly history = this._history.asReadonly();
  readonly historyMeta = this._historyMeta.asReadonly();
  readonly historyLoading = this._historyLoading.asReadonly();

  readonly isEmpty = computed(
    () => !this._loading() && this._variants().length === 0 && !this._error(),
  );
  readonly hasFilters = computed(() => {
    const f = this._filters();
    return !!(f.search || f.categoryId || (f.stockStatus && f.stockStatus !== 'all'));
  });

  loadCategories(): void {
    // reuse catalog categories via http? We'll keep simple: empty; component can pass categories
  }

  async loadVariants(append = false): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    const f = this._filters();
    const query: AdminStockVariantsFilters = {
      search: f.search,
      categoryId: f.categoryId,
      stockStatus: f.stockStatus,
      page: f.page,
      limit: f.limit,
    };
    try {
      const res = await firstValueFrom(this.api.listVariants(query));
      if (append) {
        this._variants.update((prev) => [...prev, ...res.data]);
      } else {
        this._variants.set(res.data);
      }
      this._meta.set(res.meta);
    } catch {
      this._error.set('Impossible de charger le stock.');
      this._variants.set([]);
      this._meta.set(null);
    } finally {
      this._loading.set(false);
    }
  }

  setFilters(partial: Partial<AdminStockFiltersState>): void {
    this._filters.update((f) => ({ ...f, ...partial, page: partial.page ?? 1 }));
    if (partial.page === undefined) this._filters.update((f) => ({ ...f, page: 1 }));
    void this.loadVariants();
  }

  setPage(page: number): void {
    this._filters.update((f) => ({ ...f, page }));
    void this.loadVariants();
  }

  resetFilters(): void {
    this._filters.set({ ...DEFAULT_FILTERS });
    void this.loadVariants();
  }

  openAdjust(variant: AdminStockVariant): void {
    this._adjusting.set(variant);
  }

  closeAdjust(): void {
    this._adjusting.set(null);
  }

  async adjustStock(variantId: string, payload: AdjustStockPayload): Promise<void> {
    await firstValueFrom(this.api.adjustStock(variantId, payload));
    this.toast.success('Stock ajusté avec succès.');
    await this.loadVariants();
  }

  openHistory(variant: AdminStockVariant): void {
    this._historyVariant.set(variant);
    this._historyOpen.set(true);
    void this.loadHistory(variant.variantId);
  }

  closeHistory(): void {
    this._historyOpen.set(false);
    this._historyVariant.set(null);
    this._history.set([]);
    this._historyMeta.set(null);
  }

  async loadHistory(
    variantId: string,
    from?: string,
    to?: string,
    motif?: StockMovementsFilters['motif'],
    page = 1,
  ): Promise<void> {
    this._historyLoading.set(true);
    const filters: StockMovementsFilters = { variantId, from, to, motif, page, limit: 20 };
    try {
      const res: StockMovementsPage = await firstValueFrom(this.api.listMovements(filters));
      this._history.set(res.data);
      this._historyMeta.set(res.meta);
    } catch {
      this.toast.error('Impossible de charger l’historique.');
    } finally {
      this._historyLoading.set(false);
    }
  }

  exportCsv(): void {
    const variants = this._variants();
    if (variants.length === 0) {
      this.toast.error('Aucune variante à exporter.');
      return;
    }
    const headers = [
      'SKU',
      'Produit',
      'Catégorie',
      'Couleur',
      'Pointure',
      'Stock',
      'Réservé',
      'Disponible',
      'Seuil',
      'Statut',
    ];
    const rows = variants.map((v) => [
      v.sku,
      v.productName,
      v.categoryName,
      v.color,
      v.size,
      v.stock,
      v.reservedStock,
      v.availableStock,
      v.lowStockThreshold,
      v.stockStatus === 'OUT'
        ? 'Rupture de stock'
        : v.stockStatus === 'LOW'
          ? 'Stock faible'
          : 'En stock',
    ]);
    const csv =
      '\uFEFF' +
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';'))
        .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.toast.success('Export CSV téléchargé.');
  }
}
