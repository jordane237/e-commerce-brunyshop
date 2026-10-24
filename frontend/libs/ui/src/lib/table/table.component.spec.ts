import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import {
  TableComponent,
  type TableAction,
  type TableColumn,
  type TableRow,
} from './table.component';

const COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Client', sortable: true },
  { key: 'total', label: 'Total', align: 'right' },
  { key: 'paid', label: 'Payée' },
];

const ROWS: TableRow[] = [
  { id: 'order-1', name: 'Amina', total: 27500, paid: true },
  { id: 'order-2', name: 'Boris', total: 12000, paid: false },
];

const ACTIONS: TableAction[] = [
  { id: 'edit', label: 'Modifier', variant: 'primary' },
  { id: 'delete', label: 'Supprimer', variant: 'danger' },
];

describe('TableComponent', () => {
  async function create(inputs: Record<string, unknown> = {}) {
    await TestBed.configureTestingModule({ imports: [TableComponent] }).compileComponents();
    const fixture = TestBed.createComponent(TableComponent);
    const defaults: Record<string, unknown> = {
      columns: COLUMNS,
      rows: ROWS,
      total: 25,
      pageSize: 10,
      page: 1,
      caption: 'Commandes récentes',
    };
    for (const [key, value] of Object.entries({ ...defaults, ...inputs })) {
      fixture.componentRef.setInput(key, value);
    }
    await fixture.whenStable();
    return fixture;
  }

  it('exposes a caption and column headers', async () => {
    const fixture = await create();
    const caption = fixture.nativeElement.querySelector('caption') as HTMLElement;
    const headers = Array.from(
      fixture.nativeElement.querySelectorAll('th'),
    ) as HTMLTableCellElement[];

    expect(caption.textContent).toContain('Commandes récentes');
    expect(headers.map((header) => header.textContent?.trim())).toEqual([
      'Client',
      'Total',
      'Payée',
    ]);
    expect(headers.every((header) => header.getAttribute('scope') === 'col')).toBe(true);
  });

  it('renders formatted cell values and the empty marker', async () => {
    const fixture = await create({ rows: [{ id: 'row-1', name: 'Amina', paid: null }] });
    const cells = Array.from(
      fixture.nativeElement.querySelectorAll('tbody td'),
    ) as HTMLTableCellElement[];

    expect(cells[1].textContent?.trim()).toBe('—');
    expect(cells[2].textContent?.trim()).toBe('—');
  });

  it('announces the sort state and emits the next direction', async () => {
    const fixture = await create();
    const sortButton = fixture.nativeElement.querySelector('.bs-table__sort') as HTMLButtonElement;
    const sorts: unknown[] = [];
    fixture.componentInstance.sortChange.subscribe((event) => sorts.push(event));

    expect(sortButton.closest('th')?.getAttribute('aria-sort')).toBe('none');

    sortButton.click();
    expect(sorts).toEqual([{ key: 'name', direction: 'asc' }]);

    fixture.componentRef.setInput('sortKey', 'name');
    fixture.componentRef.setInput('sortDirection', 'desc');
    await fixture.whenStable();
    expect(sortButton.closest('th')?.getAttribute('aria-sort')).toBe('descending');
  });

  it('renders row actions and emits the selected action with its row', async () => {
    const fixture = await create({ actions: ACTIONS });
    const events: unknown[] = [];
    fixture.componentInstance.action.subscribe((event) => events.push(event));
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.bs-table__action'),
    ) as HTMLButtonElement[];

    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      'Modifier',
      'Supprimer',
      'Modifier',
      'Supprimer',
    ]);

    buttons[1].click();
    expect(events).toEqual([{ action: ACTIONS[1], row: ROWS[0] }]);
  });

  it('paginates within bounds', async () => {
    const fixture = await create();
    const pages: number[] = [];
    fixture.componentInstance.pageChange.subscribe((page) => pages.push(page));
    const [previous, next] = Array.from(
      fixture.nativeElement.querySelectorAll('.bs-table__pagination button'),
    ) as HTMLButtonElement[];

    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(false);

    next.click();
    expect(pages).toEqual([2]);

    fixture.componentRef.setInput('page', 3);
    await fixture.whenStable();
    expect(next.disabled).toBe(true);
  });

  it('shows the empty state', async () => {
    const fixture = await create({ rows: [] });
    const empty = fixture.nativeElement.querySelector('.bs-table__empty') as HTMLElement;

    expect(empty.textContent).toContain('Aucune donnée à afficher.');
  });

  it('marks the table busy and shows skeleton rows while loading', async () => {
    const fixture = await create({ loading: true });
    const wrapper = fixture.nativeElement.querySelector('.bs-table-wrap') as HTMLElement;

    expect(wrapper.getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.querySelectorAll('bruny-skeleton').length).toBeGreaterThan(0);
  });

  it('uses the row id for tracking and falls back to the index', async () => {
    const fixture = await create({ rows: [{ name: 'Sans identifiant' }] });

    expect(fixture.nativeElement.querySelector('tbody tr')).not.toBeNull();
    const component = fixture.componentInstance;
    expect(component.rowId(ROWS[0], 0)).toBe('order-1');
    expect(component.rowId({ name: 'Sans identifiant' }, 4)).toBe(4);
    expect(component.cellValue({ paid: true }, COLUMNS[2])).toBe('Oui');
    expect(component.cellValue({ total: 12000 }, COLUMNS[1])).toBe('12000');
    expect(component.cellValue({}, COLUMNS[0])).toBe('—');
  });

  it('formats cells with a custom formatter', async () => {
    const fixture = await create({
      columns: [
        {
          key: 'total',
          label: 'Total',
          format: (value: unknown) => `${String(value)} FCFA`,
        },
      ],
      rows: [{ id: 'row-1', total: 27500 }],
    });

    const cell = fixture.nativeElement.querySelector('tbody td') as HTMLElement;
    expect(cell.textContent?.trim()).toBe('27500 FCFA');
  });
});

describe('TableComponent pagination guard', () => {
  it('does not emit when the requested page is the current one', () => {
    const component = new TableComponent();
    component.page = 1;
    const pageChange = vi.fn();
    component.pageChange.subscribe(pageChange);

    component.goToPage(1);
    expect(pageChange).not.toHaveBeenCalled();
  });
});
