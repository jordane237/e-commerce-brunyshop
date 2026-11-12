import type { ProductListItemDto } from '../dto/product-list.dto';
import { availableStock, toProductSummary, type ProductSummaryRow } from './product-summary.mapper';

export interface ProductListRow extends ProductSummaryRow {
  variants: Array<{
    id: string;
    sku: string;
    size: string;
    color: string;
    stock: number;
    reservedStock: number;
  }>;
}

export function toProductListItem(product: ProductListRow, now: Date): ProductListItemDto {
  return {
    ...toProductSummary(product, now),
    variants: product.variants.map((variant) => {
      const available = availableStock(variant);
      return {
        id: variant.id,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        availableStock: available,
        isAvailable: available > 0,
      };
    }),
  };
}
