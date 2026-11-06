import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import type { CatalogProduct } from '@bruny/data-access';
import {
  BadgeComponent,
  ButtonComponent,
  CheckboxComponent,
  IconComponent,
  InputComponent,
  ModalComponent,
  PriceTagComponent,
  ProductCardComponent,
  RadioComponent,
  SelectComponent,
  SizeSelectorComponent,
  SkeletonComponent,
  SpinnerComponent,
  TableComponent,
  ToastComponent,
  ToggleComponent,
  type TableActionEvent,
  type TableColumn,
  type TableRow,
  type TableSortEvent,
  type ToastVariant,
} from '@bruny/ui';

const DEMO_PRODUCT: CatalogProduct = {
  id: 'demo-product',
  name: 'Mocassin Prestige Cuir Noir',
  slug: 'mocassin-prestige-cuir-noir',
  description: 'Mocassin en cuir pleine fleur, doublure souple et semelle cousue.',
  basePrice: 27500,
  promoPrice: 21900,
  promoStart: '2026-01-01T00:00:00.000Z',
  promoEnd: '2027-01-01T00:00:00.000Z',
  category: { id: 'cat-1', name: 'Mocassins & Richelieu', slug: 'mocassins-richelieu' },
  brand: { id: 'brand-1', name: 'BRUNY', slug: 'bruny', logo: null },
  images: [
    {
      id: 'img-1',
      url: 'https://picsum.photos/seed/bruny-mocassin/800/800',
      alt: 'Mocassin Prestige Cuir Noir',
      position: 0,
    },
  ],
  variants: [
    { id: 'v-40', sku: 'DEMO-40', color: 'Noir', size: '40', price: null, stock: 6 },
    { id: 'v-41', sku: 'DEMO-41', color: 'Noir', size: '41', price: null, stock: 3 },
    { id: 'v-42', sku: 'DEMO-42', color: 'Noir', size: '42', price: null, stock: 2 },
    { id: 'v-43', sku: 'DEMO-43', color: 'Noir', size: '43', price: null, stock: 0 },
  ],
};

@Component({
  selector: 'bruny-design-system-page',
  standalone: true,
  imports: [
    BadgeComponent,
    ButtonComponent,
    CheckboxComponent,
    IconComponent,
    InputComponent,
    ModalComponent,
    PriceTagComponent,
    ProductCardComponent,
    RadioComponent,
    SelectComponent,
    SizeSelectorComponent,
    SkeletonComponent,
    SpinnerComponent,
    TableComponent,
    ToastComponent,
    ToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './design-system-page.html',
  styleUrl: './design-system-page.scss',
})
export class DesignSystemPage {
  readonly product = DEMO_PRODUCT;
  readonly productLoading = signal(false);

  readonly name = signal('Jean-Paul Mbianda');
  readonly email = signal('jean-paul@example.cm');
  readonly phone = signal('');
  readonly password = signal('Brune!2026');
  readonly errorValue = signal('');
  readonly city = signal('douala');
  readonly newsletter = signal(true);
  readonly terms = signal(false);
  readonly indeterminate = signal(true);
  readonly payment = signal('livraison');
  readonly notifications = signal(true);
  readonly antiTheft = signal(false);
  readonly size = signal('41');
  readonly modalOpen = signal(false);

  readonly toastMessage = signal('');
  readonly toastVariant = signal<ToastVariant>('success');

  readonly columns: TableColumn[] = [
    { key: 'reference', label: 'Référence', sortable: true },
    { key: 'client', label: 'Client', sortable: true },
    { key: 'total', label: 'Total', sortable: true, align: 'right' },
    { key: 'status', label: 'Statut' },
  ];

  readonly actions = [
    { id: 'view', label: 'Voir' },
    { id: 'edit', label: 'Modifier', variant: 'primary' as const },
    { id: 'cancel', label: 'Annuler', variant: 'danger' as const },
  ];

  readonly allRows: TableRow[] = [
    {
      id: 'BS-2025-8492',
      reference: 'BS-2025-8492',
      client: 'Jean-Paul M.',
      total: '52 500 FCFA',
      status: 'En cours',
    },
    {
      id: 'BS-2025-8491',
      reference: 'BS-2025-8491',
      client: 'Aline T.',
      total: '45 000 FCFA',
      status: 'En préparation',
    },
    {
      id: 'BS-2025-8490',
      reference: 'BS-2025-8490',
      client: 'Cabinet E.',
      total: '68 000 FCFA',
      status: 'Livrée',
    },
    {
      id: 'BS-2025-8489',
      reference: 'BS-2025-8489',
      client: 'Samuel N.',
      total: '24 500 FCFA',
      status: 'Livrée',
    },
    {
      id: 'BS-2025-8488',
      reference: 'BS-2025-8488',
      client: 'Grâce M.',
      total: '31 000 FCFA',
      status: 'Annulée',
    },
    {
      id: 'BS-2025-8487',
      reference: 'BS-2025-8487',
      client: 'Ibrahim K.',
      total: '39 500 FCFA',
      status: 'En cours',
    },
  ];

  readonly tableLoading = signal(false);
  readonly tableEmpty = signal(false);
  readonly page = signal(1);
  readonly pageSize = 4;
  readonly sortKey = signal<string | null>('reference');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  readonly sortedRows = computed(() => {
    if (this.tableEmpty()) return [];
    const key = this.sortKey();
    const direction = this.sortDirection();
    const rows = [...this.allRows];
    if (!key) return rows;
    return rows.sort((left, right) => {
      const a = String(left[key] ?? '');
      const b = String(right[key] ?? '');
      return direction === 'asc' ? a.localeCompare(b, 'fr') : b.localeCompare(a, 'fr');
    });
  });

  readonly tableTotal = computed(() => this.sortedRows().length);

  readonly visibleRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.sortedRows().slice(start, start + this.pageSize);
  });

  showToast(variant: ToastVariant, message: string): void {
    this.toastVariant.set(variant);
    this.toastMessage.set('');
    queueMicrotask(() => this.toastMessage.set(message));
  }

  clearToast(): void {
    this.toastMessage.set('');
  }

  onSort(event: TableSortEvent): void {
    this.sortKey.set(event.key);
    this.sortDirection.set(event.direction);
    this.page.set(1);
  }

  onPage(page: number): void {
    this.page.set(page);
  }

  onTableAction(event: TableActionEvent): void {
    this.showToast(
      'info',
      `Action « ${event.action.label} » sur ${String(event.row['reference'])}`,
    );
  }

  toggleProductLoading(): void {
    this.productLoading.update((value) => !value);
  }
}
