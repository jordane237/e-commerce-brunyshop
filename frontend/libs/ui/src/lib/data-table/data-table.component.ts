import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  cellTemplate?: TemplateRef<{ $implicit: T }>;
}

export interface DataTableSelection<T> {
  selectedRows: T[];
  allSelected: boolean;
  someSelected: boolean;
}

@Component({
  selector: 'bruny-data-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, SkeletonComponent, NgTemplateOutlet],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<T extends Record<string, unknown>> {
  readonly columns = input.required<DataTableColumn<T>[]>();
  readonly rows = input.required<T[]>();
  readonly rowKey = input.required<keyof T>();
  readonly loading = input<boolean>(false);
  readonly selectable = input<boolean>(false);
  readonly sortKey = input<string | null>(null);
  readonly sortDirection = input<'asc' | 'desc' | null>(null);
  readonly caption = input<string>('');
  readonly actionsTemplate = input<TemplateRef<{ $implicit: T }> | null>(null);

  readonly selectionChange = output<DataTableSelection<T>>();
  readonly sortChange = output<{ key: string; direction: 'asc' | 'desc' | null }>();

  private readonly selectedIds = signal<Set<unknown>>(new Set());

  readonly selection = computed<DataTableSelection<T>>(() => {
    const selected = this.selectedIds();
    const total = this.rows().length;
    return {
      selectedRows: this.rows().filter((row) => selected.has(row[this.rowKey()])),
      allSelected: total > 0 && selected.size === total,
      someSelected: selected.size > 0 && selected.size < total,
    };
  });

  isSelected(row: T): boolean {
    return this.selectedIds().has(row[this.rowKey()]);
  }

  toggleRow(row: T): void {
    const next = new Set(this.selectedIds());
    const key = row[this.rowKey()];
    if (next.has(key)) next.delete(key);
    else next.add(key);
    this.selectedIds.set(next);
    this.selectionChange.emit(this.selection());
  }

  toggleAll(): void {
    const next = new Set<unknown>();
    if (!this.selection().allSelected) {
      for (const row of this.rows()) next.add(row[this.rowKey()]);
    }
    this.selectedIds.set(next);
    this.selectionChange.emit(this.selection());
  }

  onSort(key: string): void {
    const currentKey = this.sortKey();
    const currentDir = this.sortDirection();
    let nextDir: 'asc' | 'desc' | null = 'asc';
    if (currentKey === key) {
      nextDir = currentDir === 'asc' ? 'desc' : currentDir === 'desc' ? null : 'asc';
    }
    this.sortChange.emit({ key, direction: nextDir });
  }

  alignStyle(col: DataTableColumn<T>): string {
    return col.align ?? 'left';
  }
}
