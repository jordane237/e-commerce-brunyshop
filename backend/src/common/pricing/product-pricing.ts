// Shared product pricing rules (RG-PRX-02).
// Single source of truth for the catalogue and the cart: the price displayed on
// a product page must be the price charged at checkout.
//
// Priority, highest first:
//   1. variant.price override (manual price set on the variant),
//   2. product.promoPrice while promoStart <= at <= promoEnd,
//   3. product.basePrice.
// The product promotion therefore applies to every variant that has no manual
// override. Amounts are integer XAF (RG-PRX-01).

export interface PriceableProduct {
  basePrice: number;
  promoPrice: number | null;
  promoStart: Date | null;
  promoEnd: Date | null;
}

export interface PriceableVariant {
  price: number | null;
}

export interface PriceQuote {
  // Price actually charged for the line.
  unitPrice: number;
  // Catalogue price before any promotion (variant override or product base).
  listPrice: number;
  appliedPromo: boolean;
}

// Bounds are inclusive on both ends: a promotion is active from its first to
// its last second, and an incomplete window (missing date) is never active.
export function isPromoActive(product: PriceableProduct, at: Date = new Date()): boolean {
  if (product.promoPrice === null || product.promoStart === null || product.promoEnd === null) {
    return false;
  }
  // Defensive: a promotion is never active when the promo price is not strictly
  // lower than the base price (CA #4).
  if (product.promoPrice >= product.basePrice) {
    return false;
  }
  return product.promoStart.getTime() <= at.getTime() && at.getTime() <= product.promoEnd.getTime();
}

// Rounded saving percentage (CA #3), null when no promotion is active.
export function promoDiscountPercent(
  product: PriceableProduct,
  at: Date = new Date(),
): number | null {
  if (!isPromoActive(product, at) || product.promoPrice === null || product.basePrice <= 0) {
    return null;
  }
  return Math.round(((product.basePrice - product.promoPrice) / product.basePrice) * 100);
}

export function resolvePrice(
  product: PriceableProduct,
  variant: PriceableVariant,
  at: Date = new Date(),
): PriceQuote {
  const listPrice = variant.price ?? product.basePrice;
  if (variant.price !== null) {
    return { unitPrice: variant.price, listPrice, appliedPromo: false };
  }
  if (isPromoActive(product, at)) {
    return { unitPrice: product.promoPrice as number, listPrice, appliedPromo: true };
  }
  return { unitPrice: listPrice, listPrice, appliedPromo: false };
}
