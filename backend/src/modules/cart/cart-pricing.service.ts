import { Injectable } from '@nestjs/common';

import {
  isPromoActive,
  resolvePrice,
  type PriceableProduct,
  type PriceableVariant,
  type PriceQuote,
} from '../../common/pricing/product-pricing';
import { formatXaf } from './cart.utils';
import { CartIssueCode, type CartIssueDto } from './dto/cart-validation-response.dto';

// Minimal shapes needed to reprice a line server-side (CRT-01). Keeping them
// structural lets unit tests run without a generated Prisma payload.
// The rules themselves live in src/common/pricing so the catalogue detail page
// and the cart cannot drift apart.
export type { PriceableProduct, PriceableVariant, PriceQuote };

export interface CouponDefinition {
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  minAmount: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  maxUses: number | null;
  usedCount: number;
}

export interface CouponEvaluation {
  discount: number;
  issue: CartIssueDto | null;
}

// Server-side price recalculator (CRT-01, CA #1 and CA #3).
// Priority, highest first:
//   1. variant.price override (when not null),
//   2. product.promoPrice while promoStart <= at <= promoEnd,
//   3. product.basePrice.
// No client-provided amount ever participates in this computation.
@Injectable()
export class CartPricingService {
  calculatePrice(
    product: PriceableProduct,
    variant: PriceableVariant,
    at: Date = new Date(),
  ): PriceQuote {
    return resolvePrice(product, variant, at);
  }

  isPromoActive(product: PriceableProduct, at: Date = new Date()): boolean {
    return isPromoActive(product, at);
  }

  // Coupons never make a total negative: FIXED_AMOUNT is capped at the
  // subtotal and PERCENTAGE is clamped to 0..100.
  evaluateCoupon(
    coupon: CouponDefinition | null,
    subtotal: number,
    at: Date,
    requestedCode: string,
  ): CouponEvaluation {
    const invalid = (message: string): CouponEvaluation => ({
      discount: 0,
      issue: {
        code: CartIssueCode.COUPON_INVALID,
        couponCode: requestedCode,
        message,
      },
    });

    if (coupon === null) {
      return invalid(`Le code promo « ${requestedCode} » est inconnu ou invalide.`);
    }
    if (coupon.startsAt !== null && coupon.startsAt.getTime() > at.getTime()) {
      return invalid(`Le code promo « ${coupon.code} » n’est pas encore actif.`);
    }
    if (coupon.endsAt !== null && coupon.endsAt.getTime() < at.getTime()) {
      return invalid(`Le code promo « ${coupon.code} » a expiré.`);
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return invalid(
        `Le code promo « ${coupon.code} » a atteint son nombre maximal d’utilisations.`,
      );
    }
    if (coupon.minAmount !== null && subtotal < coupon.minAmount) {
      return {
        discount: 0,
        issue: {
          code: CartIssueCode.COUPON_MIN_AMOUNT_NOT_REACHED,
          couponCode: coupon.code,
          minAmount: coupon.minAmount,
          subtotal,
          message: `Le code promo « ${coupon.code} » nécessite un sous-total de ${formatXaf(
            coupon.minAmount,
          )} minimum.`,
        },
      };
    }

    if (coupon.type === 'PERCENTAGE') {
      const percentage = Math.min(100, Math.max(0, coupon.value));
      return { discount: Math.round((subtotal * percentage) / 100), issue: null };
    }
    const discount = Math.max(0, Math.min(coupon.value, subtotal));
    return { discount, issue: null };
  }
}
