import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

export type TableRow = Record<string, unknown>;
export type TableAlign = 'left' | 'center' | 'right';
export type TableSortDirection = 'asc' | 'desc';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: TableAlign;
  format?: (value: unknown, row: TableRow) => string;
}

export interface TableAction {
  id: string;
  label: string;
  variant?: 'primary' | 'ghost' | 'danger';
}

export interface TableSortEvent {
  key: string;
  direction: TableSortDirection;
}

export interface TableActionEvent {
  action: TableAction;
  row: TableRow;
}

@Component({
  selector: 'bruny-table',
  standalone: true,
  imports: [IconComponent, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
})
export class TableComponent {
  @Input({ required: true }) columns: TableColumn[] = [];
  @Input() rows: TableRow[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'Aucune donnée à afficher.';
  @Input() caption = '';
  @Input() page = 1;
  @Input() pageSize = 10;
  @Input() total = 0;
  @Input() sortKey: string | null = null;
  @Input() sortDirection: TableSortDirection = 'asc';
  @Input() actions: TableAction[] = [];

  @Output() sortChange = new EventEmitter<TableSortEvent>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() action = new EventEmitter<TableActionEvent>();

  get pages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  get colSpan(): number {
    return this.columns.length + (this.actions.length ? 1 : 0);
  }

  get loadingRows(): number[] {
    return Array.from({ length: Math.min(5, this.pageSize) }, (_, index) => index);
  }

  rowId(row: TableRow, index: number): string | number {
    const value = row['id'];
    return typeof value === 'string' || typeof value === 'number' ? value : index;
  }

  cellValue(row: TableRow, column: TableColumn): string {
    const value = row[column.key];
    if (column.format) return column.format(value, row);
    if (value === null || value === undefined) return '—';
    if (value instanceof Date) return value.toLocaleDateString('fr-FR');
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  toggleSort(column: TableColumn): void {
    if (!column.sortable) return;
    const direction: TableSortDirection =
      this.sortKey === column.key && this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ key: column.key, direction });
  }

  ariaSort(column: TableColumn): 'ascending' | 'descending' | 'none' {
    if (this.sortKey !== column.key) return 'none';
    return this.sortDirection === 'asc' ? 'ascending' : 'descending';
  }

  sortIcon(column: TableColumn): 'chevron-up' | 'chevron-down' | 'sort' {
    if (this.sortKey !== column.key) return 'sort';
    return this.sortDirection === 'asc' ? 'chevron-up' : 'chevron-down';
  }

  goToPage(page: number): void {
    const next = Math.min(this.pages, Math.max(1, page));
    if (next === this.page) return;
    this.pageChange.emit(next);
  }

  emitAction(action: TableAction, row: TableRow): void {
    this.action.emit({ action, row });
  }
}
