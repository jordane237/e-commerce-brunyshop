export interface StockLowEventPayload {
  variantId: string;
  productId: string;
  productName: string;
  sku: string;
  size: string;
  color: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  threshold: number;
  occurredAt: string;
}

export class StockLowEvent {
  static readonly NAME = 'stock.low';

  constructor(readonly payload: StockLowEventPayload) {}
}
