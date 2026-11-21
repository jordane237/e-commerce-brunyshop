import { Injectable } from '@nestjs/common';

export interface StockValidationInput {
  stock: number;
  reservedStock: number;
  requestedQuantity: number;
}

export interface StockValidation {
  // What can still be sold: stock minus the quantity held for pending orders.
  available: number;
  requested: number;
  canFulfill: boolean;
  // Maximum orderable quantity for the line (CA #4).
  adjustedQuantity: number;
}

// Stock availability calculator (CRT-01, CA #1 and CA #4).
// Read-only by design: reservation still happens at checkout, where the
// optimistic lock on ProductVariant.version takes over.
@Injectable()
export class CartStockService {
  validateStock(input: StockValidationInput): StockValidation {
    const available = Math.max(0, input.stock - input.reservedStock);
    const requested = Math.max(0, input.requestedQuantity);
    return {
      available,
      requested,
      canFulfill: requested <= available,
      adjustedQuantity: Math.min(requested, available),
    };
  }
}
