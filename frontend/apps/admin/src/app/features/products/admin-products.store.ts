import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';

import { CatalogApi } from '@bruny/data-access';
import { AdminProductsApi, AdminProductsFilters, AdminProductStatus } from '@bruny/data-access';
import { ToastService } from '@bruny/core';

export interface AdminProductsFiltersState {
  status?: AdminProductStatus;
  categoryId?: string;
  search?: string;
  stock?: 'in' | 'low' | 'out';
  sort: 'updatedAt' | 'name' | 'price' | 'stock';
  order: 'asc' | 'desc';
  page: number;
  limit: number;
}

const DEFAULT_FILTERS: AdminProductsFiltersState = {
  sort: 'updatedAt',
  order: 'desc',
  page: 1,
  limit: 20,
};

@Injectable({ providedIn: 'root' })
export class AdminProductsStore {
  private readonly api = inject(AdminProductsApi);
  private readonly catalogApi = inject(CatalogApi);
  private readonly toast = inject(ToastService);

  private readonly _products = signal<import('@bruny/data-access').AdminProductListItem[]>([]);
  private readonly _meta = signal<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  private readonly _filters = signal<AdminProductsFiltersState>({ ...DEFAULT_FILTERS });
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedIds = signal<Set<string>>(new Set());
  private readonly _categories = signal<{ id: string; name: string }[]>([]);

  readonly products = this._products.asReadonly();
  readonly meta = this._meta.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedIds = this._selectedIds.asReadonly();
  readonly categories = this._categories.asReadonly();

  readonly selectedCount = computed(() => this._selectedIds().size);
  readonly hasSelection = computed(() => this._selectedIds().size > 0);
  readonly isEmpty = computed(
    () => !this._loading() && this._products().length === 0 && !this._error(),
  );
  readonly allSelected = computed(
    () => this._products().length > 0 && this._selectedIds().size === this._products().length,
  );

  loadFiltersData(): void {
    this.catalogApi.categories().subscribe({
      next: (cats) => {
        const flat: { id: string; name: string }[] = [];
        const walk = (
          nodes: {
            id: string;
            name: string;
            children?: { id: string; name: string; children?: unknown[] }[];
          }[],
        ) => {
          for (const n of nodes) {
            flat.push({ id: n.id, name: n.name });
            if (n.children) walk(n.children as never);
          }
        };
        walk(cats as never);
        this._categories.set(flat);
      },
      error: () => this._categories.set([]),
    });
  }

  async loadProducts(append = false): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    const f = this._filters();
    const query: AdminProductsFilters = {
      search: f.search,
      status: f.status,
      categoryId: f.categoryId,
      stock: f.stock,
      sort: f.sort,
      order: f.order,
      page: f.page,
      limit: f.limit,
    };
    try {
      const res = await firstValueFrom(this.api.list(query));
      if (append) {
        this._products.update((prev) => [...prev, ...res.items]);
      } else {
        this._products.set(res.items);
        this._selectedIds.set(new Set());
      }
      this._meta.set(res.meta);
    } catch {
      this._error.set('Impossible de charger les produits.');
      this._products.set([]);
      this._meta.set(null);
    } finally {
      this._loading.set(false);
    }
  }

  setFilters(partial: Partial<AdminProductsFiltersState>): void {
    this._filters.update((f) => ({ ...f, ...partial, page: partial.page ?? 1 }));
    if (partial.page === undefined) this._filters.update((f) => ({ ...f, page: 1 }));
    void this.loadProducts();
  }

  setSort(event: { key: string; direction: 'asc' | 'desc' | null }): void {
    const mapped = (['name', 'price', 'stock', 'updatedAt'] as const).includes(event.key as never)
      ? (event.key as AdminProductsFiltersState['sort'])
      : 'updatedAt';
    if (event.direction === null) {
      this._filters.update((f) => ({ ...f, sort: 'updatedAt', order: 'desc', page: 1 }));
    } else {
      this._filters.update((f) => ({ ...f, sort: mapped, order: event.direction!, page: 1 }));
    }
    void this.loadProducts();
  }

  setPage(page: number): void {
    this._filters.update((f) => ({ ...f, page }));
    void this.loadProducts();
  }

  async loadMore(): Promise<void> {
    const m = this._meta();
    if (!m || m.page >= m.totalPages) return;
    this._filters.update((f) => ({ ...f, page: m.page + 1 }));
    await this.loadProducts(true);
  }

  resetFilters(): void {
    this._filters.set({ ...DEFAULT_FILTERS });
    void this.loadProducts();
  }

  toggleSelection(id: string): void {
    const next = new Set(this._selectedIds());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this._selectedIds.set(next);
  }

  toggleAllSelection(): void {
    const next = new Set<string>();
    if (!this.allSelected()) {
      for (const p of this._products()) next.add(p.id);
    }
    this._selectedIds.set(next);
  }

  clearSelection(): void {
    this._selectedIds.set(new Set());
  }

  setSelected(ids: string[]): void {
    this._selectedIds.set(new Set(ids));
  }

  async bulkPublish(): Promise<void> {
    await this.runBulk('PUBLISHED', (id) =>
      this.api.updateStatus(id, 'PUBLISHED', { skipToast: true }),
    );
  }

  async bulkHide(): Promise<void> {
    await this.runBulk('DRAFT', (id) => this.api.updateStatus(id, 'DRAFT', { skipToast: true }));
  }

  async bulkArchive(): Promise<void> {
    await this.runBulk('ARCHIVED', (id) => this.api.archive(id, { skipToast: true }));
  }

  async archiveProduct(id: string): Promise<void> {
    try {
      await firstValueFrom(this.api.archive(id));
      this.toast.success('Produit archivé.');
      await this.loadProducts();
    } catch {
      this.toast.error('Une erreur est survenue. Réessayez.');
    }
  }

  async publishProduct(id: string): Promise<void> {
    try {
      await firstValueFrom(this.api.updateStatus(id, 'PUBLISHED'));
      this.toast.success('Produit publié.');
      await this.loadProducts();
    } catch {
      this.toast.error('Une erreur est survenue. Réessayez.');
    }
  }

  async hideProduct(id: string): Promise<void> {
    try {
      await firstValueFrom(this.api.updateStatus(id, 'DRAFT'));
      this.toast.success('Produit masqué.');
      await this.loadProducts();
    } catch {
      this.toast.error('Une erreur est survenue. Réessayez.');
    }
  }

  private async runBulk(
    _status: AdminProductStatus,
    action: (id: string) => Observable<unknown>,
  ): Promise<void> {
    const ids = [...this._selectedIds()];
    if (ids.length === 0) return;
    const results = await Promise.allSettled(ids.map((id) => firstValueFrom(action(id))));
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    this.clearSelection();
    if (ok === ids.length) {
      this.toast.success(`${ok} produit(s) mis à jour.`);
    } else {
      this.toast.error(`${ok} produit(s) sur ${ids.length} mis à jour.`);
    }
    await this.loadProducts();
  }
}
