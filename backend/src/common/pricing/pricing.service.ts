import { Injectable } from '@nestjs/common';

import {
  isPromoActive,
  promoDiscountPercent,
  resolvePrice,
  type PriceableProduct,
} from './product-pricing';

// Shape returned by PricingService.calculatePrice (CAT-12, CA #2).
export interface PriceCalculation {
  effectivePrice: number;
  basePrice: number;
  promoPrice: number | null;
  isPromoActive: boolean;
  discountPercent: number | null;
}

// Single server-side entry point for the effective price of a product at a
// given instant (CAT-12). The catalogue list, the product detail page and the
// cart all delegate here so they can never drift apart.
@Injectable()
export class PricingService {
  calculatePrice(product: PriceableProduct, at: Date = new Date()): PriceCalculation {
    const quote = resolvePrice(product, { price: null }, at);
    return {
      effectivePrice: quote.unitPrice,
      basePrice: product.basePrice,
      promoPrice: product.promoPrice,
      isPromoActive: isPromoActive(product, at),
      discountPercent: promoDiscountPercent(product, at),
    };
  }

  isPromoActive(product: PriceableProduct, at: Date = new Date()): boolean {
    return isPromoActive(product, at);
  }
}
