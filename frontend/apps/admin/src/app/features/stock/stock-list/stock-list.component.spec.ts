import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminStockApi, AdminStockVariant, CatalogApi } from '@bruny/data-access';
import { ToastService } from '@bruny/core';
import { AdminStockStore } from '../admin-stock.store';
import { StockListComponent } from './stock-list.component';

const variant: AdminStockVariant = {
  variantId: 'v1',
  sku: 'SKU-1',
  productId: 'p1',
  productName: 'Air Max',
  productSlug: 'air-max',
  categoryId: 'c1',
  categoryName: 'Chaussures',
  size: '42',
  color: 'NOIR',
  stock: 5,
  reservedStock: 1,
  availableStock: 4,
  lowStockThreshold: 3,
  stockStatus: 'IN_STOCK',
};

function setup() {
  const api = {
    listVariants: vi
      .fn()
      .mockReturnValue(
        of({ data: [variant], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } }),
      ),
    adjustStock: vi.fn().mockReturnValue(of({ variantId: 'v1' })),
    listMovements: vi
      .fn()
      .mockReturnValue(of({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } })),
  };
  const catalogApi = {
    categories: vi.fn().mockReturnValue(of([{ id: 'c1', name: 'Chaussures', children: [] }])),
  };
  const toast = { success: vi.fn(), error: vi.fn() };
  TestBed.configureTestingModule({
    imports: [StockListComponent],
    providers: [
      AdminStockStore,
      provideRouter([]),
      { provide: AdminStockApi, useValue: api },
      { provide: CatalogApi, useValue: catalogApi },
      { provide: ToastService, useValue: toast },
    ],
  });
  const fixture = TestBed.createComponent(StockListComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, api, toast };
}

describe('StockListComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('charge les variantes au démarrage', async () => {
    const { fixture, api } = setup();
    await fixture.whenStable();
    expect(api.listVariants).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Gestion du stock');
  });

  it('applique le debounce de recherche (300 ms)', async () => {
    vi.useFakeTimers();
    const { component, api } = setup();
    api.listVariants.mockClear();
    component.searchControl.setValue('air');
    vi.advanceTimersByTime(299);
    expect(api.listVariants).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(api.listVariants).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('ouvre la modale d’ajustement avec la valeur du stock courant', async () => {
    const { component } = setup();
    component.onOpenAdjust(variant);
    expect(component.adjustForm.controls.newStock.value).toBe(5);
    expect(component.adjustOpen()).toBe(true);
  });

  it('bloque l’enregistrement sans motif', async () => {
    const { component, api } = setup();
    await component.onSaveAdjust();
    expect(component.adjustForm.controls.motif.touched).toBe(true);
    expect(api.adjustStock).not.toHaveBeenCalled();
  });

  it('bloque un nouveau stock négatif', async () => {
    const { component, api } = setup();
    component.onOpenAdjust(variant);
    component.adjustForm.setValue({ newStock: -1, motif: 'RECEPTION', notes: '' });
    await component.onSaveAdjust();
    expect(api.adjustStock).not.toHaveBeenCalled();
  });

  it('enregistre un ajustement valide et ferme la modale', async () => {
    const { component, api } = setup();
    component.onOpenAdjust(variant);
    component.adjustForm.setValue({ newStock: 10, motif: 'RECEPTION', notes: 'Réception' });
    await component.onSaveAdjust();
    expect(api.adjustStock).toHaveBeenCalledWith('v1', {
      newStock: 10,
      motif: 'RECEPTION',
      notes: 'Réception',
    });
    expect(component.adjustOpen()).toBe(false);
  });

  it('ouvre et ferme l’historique', async () => {
    const { component } = setup();
    component.onOpenHistory(variant);
    await Promise.resolve();
    expect(component.historyOpen()).toBe(true);
    component.onCloseHistory();
    expect(component.historyOpen()).toBe(false);
  });

  it('déclenche l’export CSV', async () => {
    const { component, api } = setup();
    await Promise.resolve();
    const spy = vi.spyOn(component['store'], 'exportCsv').mockImplementation(() => undefined);
    component.onExportCsv();
    expect(spy).toHaveBeenCalled();
    expect(api.listVariants).toHaveBeenCalled();
  });

  it('traduit les statuts de stock', () => {
    const { component } = setup();
    expect(component.getStatusLabel('OUT')).toBe('Rupture de stock');
    expect(component.getStatusLabel('LOW')).toBe('Stock faible');
    expect(component.getStatusLabel('IN_STOCK')).toBe('En stock');
    expect(component.getStatusVariant('OUT')).toBe('danger');
  });
});
