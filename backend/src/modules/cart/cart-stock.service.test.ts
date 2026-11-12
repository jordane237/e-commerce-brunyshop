import { describe, expect, it } from 'vitest';

import { CartStockService } from './cart-stock.service';

const service = new CartStockService();

describe('CartStockService.validateStock', () => {
  it('accepte une quantité couverte par le stock', () => {
    expect(service.validateStock({ stock: 10, reservedStock: 0, requestedQuantity: 5 })).toEqual({
      available: 10,
      requested: 5,
      canFulfill: true,
      adjustedQuantity: 5,
    });
  });

  it('déduit le stock réservé du stock disponible', () => {
    const result = service.validateStock({ stock: 10, reservedStock: 5, requestedQuantity: 5 });
    expect(result.available).toBe(5);
    expect(result.canFulfill).toBe(true);
    expect(result.adjustedQuantity).toBe(5);
  });

  it('ajuste la quantité au stock disponible quand il est insuffisant', () => {
    const result = service.validateStock({ stock: 3, reservedStock: 0, requestedQuantity: 5 });
    expect(result.available).toBe(3);
    expect(result.canFulfill).toBe(false);
    expect(result.adjustedQuantity).toBe(3);
  });

  it('signale une rupture quand le stock est nul', () => {
    const result = service.validateStock({ stock: 0, reservedStock: 0, requestedQuantity: 1 });
    expect(result.available).toBe(0);
    expect(result.canFulfill).toBe(false);
    expect(result.adjustedQuantity).toBe(0);
  });

  it('signale une rupture quand tout le stock est réservé', () => {
    const result = service.validateStock({ stock: 5, reservedStock: 5, requestedQuantity: 1 });
    expect(result.available).toBe(0);
    expect(result.canFulfill).toBe(false);
    expect(result.adjustedQuantity).toBe(0);
  });

  it('ne retourne jamais un disponible négatif', () => {
    const result = service.validateStock({ stock: 2, reservedStock: 5, requestedQuantity: 1 });
    expect(result.available).toBe(0);
    expect(result.adjustedQuantity).toBe(0);
    expect(result.canFulfill).toBe(false);
  });
});
