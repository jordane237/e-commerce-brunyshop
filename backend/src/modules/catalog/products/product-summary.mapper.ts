import { resolvePrice } from '../../../common/pricing/product-pricing';
import type { ProductImageDto } from '../dto/product-image.dto';
import type { ProductSummaryDto } from '../dto/product-summary.dto';

// Structural shape shared by the catalogue list rows and the product detail
// row: everything a product card needs.
export interface ProductSummaryRow {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  promoPrice: number | null;
  promoStart: Date | null;
  promoEnd: Date | null;
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string; slug: string; logo: string | null };
  images: Array<{
    id: string;
    url: string;
    alt: string | null;
    position: number;
    variantColor: string | null;
  }>;
  variants: Array<{ stock: number; reservedStock: number }>;
}

export function availableStock(variant: { stock: number; reservedStock: number }): number {
  // CA #2: what can still be sold, never the raw physical stock.
  return Math.max(0, variant.stock - variant.reservedStock);
}

export function toIso(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}

export function toProductImage(image: {
  id: string;
  url: string;
  alt: string | null;
  position: number;
  variantColor: string | null;
}): ProductImageDto {
  return {
    id: image.id,
    url: image.url,
    alt: image.alt,
    position: image.position,
    variantColor: image.variantColor,
  };
}

export function toProductSummary(product: ProductSummaryRow, now: Date): ProductSummaryDto {
  const quote = resolvePrice(product, { price: null }, now);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    basePrice: product.basePrice,
    effectivePrice: quote.unitPrice,
    // Only an active promotion is advertised, never a scheduled or expired one.
    promoPrice: quote.appliedPromo ? product.promoPrice : null,
    promoStart: toIso(product.promoStart),
    promoEnd: toIso(product.promoEnd),
    isPromoActive: quote.appliedPromo,
    inStock: product.variants.some((variant) => availableStock(variant) > 0),
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
    brand: {
      id: product.brand.id,
      name: product.brand.name,
      slug: product.brand.slug,
      logo: product.brand.logo,
    },
    images: product.images.map(toProductImage),
  };
}
