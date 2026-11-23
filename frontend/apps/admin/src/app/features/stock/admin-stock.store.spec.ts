import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminStockApi, AdminStockVariant } from '@bruny/data-access';
import { ToastService } from '@bruny/core';
import { AdminStockStore } from './admin-stock.store';

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

function setup(overrides: Partial<Record<keyof AdminStockApi, unknown>> = {}) {
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
    ...overrides,
  };
  const toast = { success: vi.fn(), error: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      AdminStockStore,
      { provide: AdminStockApi, useValue: api },
      { provide: ToastService, useValue: toast },
    ],
  });
  return { store: TestBed.inject(AdminStockStore), api, toast };
}

describe('AdminStockStore', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('charge les variantes et la pagination', async () => {
    const { store, api } = setup();
    await store.loadVariants();
    expect(api.listVariants).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20, stockStatus: 'all' }),
    );
    expect(store.variants()).toEqual([variant]);
    expect(store.meta()?.total).toBe(1);
    expect(store.loading()).toBe(false);
    expect(store.isEmpty()).toBe(false);
  });

  it('expose une erreur si le chargement échoue', async () => {
    const { store } = setup({
      listVariants: vi.fn().mockReturnValue(throwError(() => new Error('boom'))),
    });
    await store.loadVariants();
    expect(store.error()).toBe('Impossible de charger le stock.');
    expect(store.variants()).toEqual([]);
  });

  it('setFilters réinitialise la page et recharge', async () => {
    const { store, api } = setup();
    store.setFilters({ page: 3 });
    await Promise.resolve();
    api.listVariants.mockClear();
    store.setFilters({ search: 'air' });
    await Promise.resolve();
    expect(store.filters()).toMatchObject({ search: 'air', page: 1 });
    expect(api.listVariants).toHaveBeenCalledTimes(1);
  });

  it('setPage met à jour la pagination', async () => {
    const { store, api } = setup();
    store.setPage(2);
    await Promise.resolve();
    expect(store.filters().page).toBe(2);
    expect(api.listVariants).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
  });

  it('resetFilters restaure les valeurs par défaut', async () => {
    const { store } = setup();
    store.setFilters({ search: 'x', stockStatus: 'out' });
    store.resetFilters();
    expect(store.filters()).toMatchObject({ stockStatus: 'all', page: 1, limit: 20 });
    expect(store.filters().search).toBeUndefined();
  });

  it('hasFilters détecte les filtres actifs', () => {
    const { store } = setup();
    expect(store.hasFilters()).toBe(false);
    store.setFilters({ stockStatus: 'low' });
    expect(store.hasFilters()).toBe(true);
  });

  it('openAdjust / closeAdjust pilotent la modale', () => {
    const { store } = setup();
    store.openAdjust(variant);
    expect(store.adjusting()).toEqual(variant);
    store.closeAdjust();
    expect(store.adjusting()).toBeNull();
  });

  it('adjustStock appelle l’API, affiche un toast et recharge', async () => {
    const { store, api, toast } = setup();
    await store.adjustStock('v1', { newStock: 10, motif: 'RECEPTION' });
    expect(api.adjustStock).toHaveBeenCalledWith('v1', { newStock: 10, motif: 'RECEPTION' });
    expect(toast.success).toHaveBeenCalledWith('Stock ajusté avec succès.');
    expect(api.listVariants).toHaveBeenCalled();
  });

  it('adjustStock propage l’erreur', async () => {
    const { store } = setup({
      adjustStock: vi.fn().mockReturnValue(throwError(() => new Error('boom'))),
    });
    await expect(store.adjustStock('v1', { newStock: 1, motif: 'CASSE' })).rejects.toThrow('boom');
  });

  it('openHistory / closeHistory gèrent l’état et le chargement', async () => {
    const { store, api } = setup();
    store.openHistory(variant);
    await Promise.resolve();
    expect(store.historyOpen()).toBe(true);
    expect(store.historyVariant()).toEqual(variant);
    expect(api.listMovements).toHaveBeenCalledWith(
      expect.objectContaining({ variantId: 'v1', limit: 20 }),
    );
    store.closeHistory();
    expect(store.historyOpen()).toBe(false);
    expect(store.historyVariant()).toBeNull();
  });

  it('loadHistory transmet les filtres période et motif', async () => {
    const { store, api } = setup();
    await store.loadHistory('v1', '2026-01-01', '2026-01-31', 'CASSE', 2);
    expect(api.listMovements).toHaveBeenCalledWith({
      variantId: 'v1',
      from: '2026-01-01',
      to: '2026-01-31',
      motif: 'CASSE',
      page: 2,
      limit: 20,
    });
  });

  it('exportCsv génère un CSV avec BOM, entêtes et échappement', async () => {
    const { store, toast } = setup();
    const createObjectURL = vi.fn().mockReturnValue('blob:x');
    const revokeObjectURL = vi.fn();
    const originalURL = globalThis.URL;
    vi.stubGlobal('URL', { ...originalURL, createObjectURL, revokeObjectURL });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    await store.loadVariants();
    store.exportCsv();
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:x');
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf]);
    const text = await blob.text();
    expect(text).toContain('"SKU";"Produit";"Catégorie"');
    expect(text).toContain('"SKU-1";"Air Max";"Chaussures"');
    expect(toast.success).toHaveBeenCalledWith('Export CSV téléchargé.');
  });

  it('exportCsv avertit quand aucune variante', () => {
    const { store, toast } = setup({
      listVariants: vi
        .fn()
        .mockReturnValue(of({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } })),
    });
    store.exportCsv();
    expect(toast.error).toHaveBeenCalledWith('Aucune variante à exporter.');
  });
});
