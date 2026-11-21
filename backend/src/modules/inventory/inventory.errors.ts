export const InventoryErrorCode = {
  INVALID_QUANTITY: 'INVALID_QUANTITY',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
} as const;

export type InventoryErrorCodeValue = (typeof InventoryErrorCode)[keyof typeof InventoryErrorCode];
