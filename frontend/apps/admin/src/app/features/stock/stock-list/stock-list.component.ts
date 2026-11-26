import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  computed,
  inject,
  signal,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { AdminStockStore } from '../admin-stock.store';
import { AdminStockVariant, CatalogApi } from '@bruny/data-access';
import {
  ActionMenuComponent,
  ActionMenuItem,
  CardListComponent,
  DataTableColumn,
  DataTableComponent,
  EmptyStateComponent,
  ModalComponent,
  SkeletonComponent,
  StatusBadgeComponent,
} from '@bruny/ui';

@Component({
  selector: 'app-stock-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DataTableComponent,
    CardListComponent,
    StatusBadgeComponent,
    ActionMenuComponent,
    ModalComponent,
    SkeletonComponent,
    EmptyStateComponent,
  ],
  templateUrl: './stock-list.component.html',
  styleUrl: './stock-list.component.scss',
})
export class StockListComponent {
  private readonly store = inject(AdminStockStore);
  private readonly catalogApi = inject(CatalogApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  readonly categories = signal<{ id: string; name: string }[]>([]);

  readonly isMobile = signal(false);
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly adjustOpen = computed(() => this.store.adjusting() !== null);
  readonly historyOpen = computed(() => this.store.historyOpen());

  readonly adjustForm = new FormGroup({
    newStock: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    motif: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    notes: new FormControl('', { nonNullable: true }),
  });

  readonly variants = this.store.variants;
  readonly meta = this.store.meta;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly isEmpty = this.store.isEmpty;
  readonly filters = this.store.filters;
  readonly adjusting = this.store.adjusting;
  readonly historyVariant = this.store.historyVariant;
  readonly history = this.store.history;
  readonly historyLoading = this.store.historyLoading;
  readonly historyMeta = this.store.historyMeta;

  @ViewChild('rowActionsTpl') private rowActionsTpl!: TemplateRef<{ $implicit: AdminStockVariant }>;
  @ViewChild('cardTemplate') private cardTemplateTpl!: TemplateRef<{
    $implicit: AdminStockVariant;
  }>;

  readonly rowActions = signal<TemplateRef<{ $implicit: AdminStockVariant }> | null>(null);
  readonly columns: DataTableColumn<AdminStockVariant>[] = [
    { key: 'sku', label: 'SKU' },
    { key: 'productName', label: 'Produit' },
    { key: 'size', label: 'Pointure' },
    { key: 'color', label: 'Couleur' },
    { key: 'availableStock', label: 'Stock dispo.', align: 'center' },
    { key: 'reservedStock', label: 'Réservé', align: 'center' },
    { key: 'lowStockThreshold', label: 'Seuil', align: 'center' },
    { key: 'stockStatus', label: 'Statut' },
  ];

  constructor() {
    this.store.loadVariants();
    this.catalogApi.categories().subscribe({
      next: (cats) => {
        const flat: { id: string; name: string }[] = [];
        type CategoryNode = { id: string; name: string; children?: CategoryNode[] };
        const walk = (nodes: CategoryNode[]) => {
          for (const n of nodes) {
            flat.push({ id: n.id, name: n.name });
            if (n.children) walk(n.children);
          }
        };
        walk(cats as CategoryNode[]);
        this.categories.set(flat);
      },
      error: () => this.categories.set([]),
    });
    if (isPlatformBrowser(this.platformId) && typeof window.matchMedia === 'function') {
      const mq = window.matchMedia('(max-width: 767px)');
      this.isMobile.set(mq.matches);
      mq.addEventListener('change', (e) => this.isMobile.set(e.matches));
    }
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.store.setFilters({ search: value || undefined }));
  }

  ngAfterViewInit(): void {
    void this.cardTemplateTpl;
    this.rowActions.set(this.rowActionsTpl);
  }

  onOpenAdjust(variant: AdminStockVariant): void {
    this.store.openAdjust(variant);
    this.adjustForm.reset({ newStock: variant.stock, motif: '', notes: '' });
  }

  onCloseAdjust(): void {
    this.store.closeAdjust();
  }

  async onSaveAdjust(): Promise<void> {
    if (this.adjustForm.invalid) {
      this.adjustForm.markAllAsTouched();
      return;
    }
    const v = this.store.adjusting();
    if (!v) return;
    const value = this.adjustForm.getRawValue();
    try {
      await this.store.adjustStock(v.variantId, {
        newStock: value.newStock,
        motif: value.motif as 'RECEPTION' | 'INVENTAIRE' | 'CASSE' | 'RETOUR' | 'AUTRE',
        notes: value.notes || undefined,
      });
      this.store.closeAdjust();
    } catch {
      // handled by interceptor/toast
    }
  }

  onOpenHistory(variant: AdminStockVariant): void {
    this.store.openHistory(variant);
  }

  onCloseHistory(): void {
    this.store.closeHistory();
  }

  onExportCsv(): void {
    this.store.exportCsv();
  }

  reload(): void {
    this.store.loadVariants();
  }

  setPage(page: number): void {
    this.store.setPage(page);
  }

  onCategoryFilter(value: string): void {
    this.store.setFilters({ categoryId: value || undefined });
  }

  onStatusFilter(value: string): void {
    this.store.setFilters({ stockStatus: (value as 'all' | 'out' | 'low' | 'in_stock') || 'all' });
  }

  resetFilters(): void {
    this.store.resetFilters();
    this.searchControl.setValue('', { emitEvent: false });
  }

  getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
    return (
      (
        { IN_STOCK: 'success', LOW: 'warning', OUT: 'danger' } as Record<
          string,
          'success' | 'warning' | 'danger' | 'neutral'
        >
      )[status] ?? 'neutral'
    );
  }

  getStatusLabel(status: string): string {
    return (
      (
        { IN_STOCK: 'En stock', LOW: 'Stock faible', OUT: 'Rupture de stock' } as Record<
          string,
          string
        >
      )[status] ?? status
    );
  }

  getRowActions(variant: AdminStockVariant): ActionMenuItem[] {
    return [
      { label: 'Ajuster le stock', icon: 'edit', onSelect: () => this.onOpenAdjust(variant) },
      { label: 'Voir l’historique', icon: 'history', onSelect: () => this.onOpenHistory(variant) },
    ];
  }
}
