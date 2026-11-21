import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  AfterViewInit,
  Component,
  DestroyRef,
  PLATFORM_ID,
  computed,
  inject,
  TemplateRef,
  ViewChild,
  OnInit,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { FcfaPipe } from '@bruny/util';
import { SkeletonComponent } from '@bruny/ui';
import {
  ActionMenuComponent,
  ActionMenuItem,
  BulkActionsBarComponent,
  BulkAction,
  ButtonComponent,
  CardListComponent,
  ConfirmDialogComponent,
  DataTableColumn,
  DataTableComponent,
  EmptyStateComponent,
  StatusBadgeComponent,
} from '@bruny/ui';
import { DrawerComponent } from '@bruny/ui';
import { AdminProductsStore } from '../admin-products.store';
import { AdminProductListItem } from '@bruny/data-access';
import { ProductsFiltersComponent } from './components/products-filters/products-filters.component';

@Component({
  selector: 'app-products-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    FcfaPipe,
    DataTableComponent,
    CardListComponent,
    StatusBadgeComponent,
    ActionMenuComponent,
    ConfirmDialogComponent,
    BulkActionsBarComponent,
    EmptyStateComponent,
    ButtonComponent,
    DrawerComponent,
    SkeletonComponent,
    ProductsFiltersComponent,
  ],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.scss',
})
export class ProductsListComponent implements OnInit, AfterViewInit {
  private readonly store = inject(AdminProductsStore);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly isMobile = signal(false);
  readonly filtersOpen = signal(false);
  readonly confirmDialogOpen = signal(false);
  readonly pendingBulkAction = signal<'publish' | 'hide' | 'archive' | null>(null);
  readonly archiveOneId = signal<string | null>(null);

  readonly searchControl = new FormControl('', { nonNullable: true });

  @ViewChild('cardTemplate') private cardTemplateTpl!: TemplateRef<{
    $implicit: AdminProductListItem;
  }>;

  readonly products = this.store.products;
  readonly meta = this.store.meta;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly selectedCount = this.store.selectedCount;
  readonly hasSelection = this.store.hasSelection;
  readonly isEmpty = this.store.isEmpty;
  readonly filters = this.store.filters;
  readonly categories = this.store.categories;

  @ViewChild('imageCell') private imageCell!: TemplateRef<{ $implicit: AdminProductListItem }>;
  @ViewChild('priceCell') private priceCell!: TemplateRef<{ $implicit: AdminProductListItem }>;
  @ViewChild('stockCell') private stockCell!: TemplateRef<{ $implicit: AdminProductListItem }>;
  @ViewChild('statusCell') private statusCell!: TemplateRef<{ $implicit: AdminProductListItem }>;
  @ViewChild('dateCell') private dateCell!: TemplateRef<{ $implicit: AdminProductListItem }>;
  @ViewChild('rowActions') private rowActionsTpl!: TemplateRef<{ $implicit: AdminProductListItem }>;

  readonly columns = signal<DataTableColumn<AdminProductListItem>[]>([]);
  readonly rowActions = signal<TemplateRef<{ $implicit: AdminProductListItem }> | null>(null);

  readonly sortKey = computed(() => {
    const f = this.filters();
    if (f.sort === 'name') return 'image';
    if (f.sort === 'price') return 'price';
    if (f.sort === 'stock') return 'stock';
    return 'updatedAt';
  });

  readonly sortDirection = computed<'asc' | 'desc' | null>(() => this.filters().order);

  readonly confirmTitle = computed(() => {
    if (this.archiveOneId()) return 'Archiver ce produit ?';
    const action = this.pendingBulkAction();
    if (action === 'publish') return 'Publier des produits ?';
    if (action === 'hide') return 'Masquer des produits ?';
    if (action === 'archive') return 'Archiver des produits ?';
    return 'Confirmer';
  });

  readonly confirmMessage = computed(() => {
    if (this.archiveOneId()) return 'Il ne sera plus visible sur la boutique.';
    const action = this.pendingBulkAction();
    const n = this.selectedCount();
    if (action === 'publish') return `Publier ${n} produit(s) ?`;
    if (action === 'hide') return `Masquer ${n} produit(s) ?`;
    if (action === 'archive')
      return `Archiver ${n} produit(s) ? Ils ne seront plus visibles sur la boutique.`;
    return '';
  });

  readonly bulkActions: BulkAction[] = [
    { label: 'Publier', onClick: () => this.onBulkAction('publish') },
    { label: 'Masquer', onClick: () => this.onBulkAction('hide') },
    { label: 'Archiver', danger: true, onClick: () => this.onBulkAction('archive') },
  ];

  ngAfterViewInit(): void {
    void this.cardTemplateTpl;
    this.rowActions.set(this.rowActionsTpl);
    this.columns.set([
      { key: 'image', label: 'Produit', sortable: true, cellTemplate: this.imageCell },
      { key: 'price', label: 'Prix', sortable: true, align: 'right', cellTemplate: this.priceCell },
      { key: 'stock', label: 'Stock', align: 'center', cellTemplate: this.stockCell },
      { key: 'status', label: 'Statut', cellTemplate: this.statusCell },
      { key: 'updatedAt', label: 'Modifié', sortable: true, cellTemplate: this.dateCell },
    ]);
  }

  ngOnInit(): void {
    this.store.loadFiltersData();
    void this.store.loadProducts();
    if (isPlatformBrowser(this.platformId) && typeof window.matchMedia === 'function') {
      const mq = window.matchMedia('(max-width: 767px)');
      this.isMobile.set(mq.matches);
      mq.addEventListener('change', (e) => this.isMobile.set(e.matches));
    }
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.store.setFilters({ search: value || undefined }));
  }

  getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
    return (
      (
        { PUBLISHED: 'success', DRAFT: 'warning', ARCHIVED: 'danger' } as Record<
          string,
          'success' | 'warning' | 'danger' | 'neutral'
        >
      )[status] ?? 'neutral'
    );
  }

  getStatusLabel(status: string): string {
    return (
      ({ PUBLISHED: 'Publié', DRAFT: 'Brouillon', ARCHIVED: 'Archivé' } as Record<string, string>)[
        status
      ] ?? status
    );
  }

  onSortChange(event: { key: string; direction: 'asc' | 'desc' | null }): void {
    this.store.setSort(event);
  }

  onSelectionChange(event: { selectedRows: AdminProductListItem[] }): void {
    this.store.setSelected(event.selectedRows.map((r) => r.id));
  }

  onRowToggle(product: AdminProductListItem): void {
    this.store.toggleSelection(product.id);
  }

  isRowSelected(product: AdminProductListItem): boolean {
    return this.store.selectedIds().has(product.id);
  }

  getRowActions(product: AdminProductListItem): ActionMenuItem[] {
    return [
      { label: 'Modifier', icon: 'edit', onSelect: () => this.onEdit(product.id) },
      { label: 'Publier', icon: 'check', onSelect: () => this.store.publishProduct(product.id) },
      { label: 'Masquer', icon: 'eye-off', onSelect: () => this.store.hideProduct(product.id) },
      {
        label: 'Archiver',
        icon: 'archive',
        danger: true,
        onSelect: () => this.onArchiveOne(product.id),
      },
    ];
  }

  onCreate(): void {
    void this.router.navigate(['/produits', 'nouveau']);
  }

  onEdit(id: string): void {
    void this.router.navigate(['/produits', id, 'modifier']);
  }

  onArchiveOne(id: string): void {
    this.archiveOneId.set(id);
    this.pendingBulkAction.set(null);
    this.confirmDialogOpen.set(true);
  }

  onBulkAction(action: 'publish' | 'hide' | 'archive'): void {
    this.pendingBulkAction.set(action);
    this.archiveOneId.set(null);
    this.confirmDialogOpen.set(true);
  }

  async onConfirm(): Promise<void> {
    const one = this.archiveOneId();
    const action = this.pendingBulkAction();
    this.confirmDialogOpen.set(false);
    try {
      if (one) await this.store.archiveProduct(one);
      else if (action === 'publish') await this.store.bulkPublish();
      else if (action === 'hide') await this.store.bulkHide();
      else if (action === 'archive') await this.store.bulkArchive();
      if (!one) this.store.clearSelection();
    } catch {
      // toast already handled in store
    } finally {
      this.archiveOneId.set(null);
      this.pendingBulkAction.set(null);
    }
  }

  onCancelConfirm(): void {
    this.confirmDialogOpen.set(false);
    this.archiveOneId.set(null);
    this.pendingBulkAction.set(null);
  }

  openFilters(): void {
    this.filtersOpen.set(true);
  }

  closeFilters(): void {
    this.filtersOpen.set(false);
  }

  onStatusFilter(value: string | undefined): void {
    this.store.setFilters({ status: value as never });
  }

  onCategoryFilter(value: string | undefined): void {
    this.store.setFilters({ categoryId: value });
  }

  onStockFilter(value: string | undefined): void {
    this.store.setFilters({ stock: value as never });
  }

  resetFilters(): void {
    this.store.resetFilters();
    this.searchControl.setValue('', { emitEvent: false });
  }

  loadMore(): void {
    void this.store.loadMore();
  }
}
