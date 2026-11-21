import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/database.module';
import { MAX_LINE_QUANTITY } from './cart.constants';
import { CartPricingService } from './cart-pricing.service';
import { CartStockService } from './cart-stock.service';
import { formatXaf } from './cart.utils';
import type { CartItemInputDto } from './dto/cart-item-input.dto';
import {
  CartIssueCode,
  isBlockingIssue,
  type CartIssueDto,
  type CartItemValidationDto,
  type CartValidationResponseDto,
} from './dto/cart-validation-response.dto';
import type { ValidateCartDto } from './dto/validate-cart.dto';

// Minimal catalogue projection: just what repricing needs (no N+1, no image
// or SEO payload). Status and deletedAt drive PRODUCT_ARCHIVED /
// PRODUCT_NOT_FOUND.
const variantSelection = {
  id: true,
  sku: true,
  color: true,
  size: true,
  price: true,
  stock: true,
  reservedStock: true,
  product: {
    select: {
      id: true,
      name: true,
      basePrice: true,
      promoPrice: true,
      promoStart: true,
      promoEnd: true,
      status: true,
      deletedAt: true,
    },
  },
} satisfies Prisma.ProductVariantSelect;

const couponSelection = {
  code: true,
  type: true,
  value: true,
  minAmount: true,
  startsAt: true,
  endsAt: true,
  maxUses: true,
  usedCount: true,
} satisfies Prisma.CouponSelect;

interface RequestedLine {
  variantId: string;
  quantity: number;
  previousUnitPrice?: number;
}

// Cart validation orchestrator (CRT-01).
// Everything is recomputed from the database: prices, promotions, stock and
// coupons. The request body only identifies variants and quantities
// (`previousUnitPrice` is a display hint that never feeds a computation).
@Injectable()
export class CartValidationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: CartPricingService,
    private readonly stock: CartStockService,
    private readonly logger: PinoLogger,
  ) {}

  async validateCart(dto: ValidateCartDto, userId?: string): Promise<CartValidationResponseDto> {
    const at = new Date();
    const requestedLines = this.mergeLines(dto.items);
    const [variants, coupon] = await Promise.all([
      this.prisma.productVariant.findMany({
        where: { id: { in: requestedLines.map((line) => line.variantId) } },
        select: variantSelection,
      }),
      this.findCoupon(dto.couponCode),
    ]);

    const variantsById = new Map(variants.map((variant) => [variant.id, variant]));
    const items: CartItemValidationDto[] = [];
    const issues: CartIssueDto[] = [];

    for (const line of requestedLines) {
      const variant = variantsById.get(line.variantId);
      if (!variant) {
        issues.push({
          code: CartIssueCode.VARIANT_NOT_FOUND,
          variantId: line.variantId,
          message: 'Cette variante n’existe plus dans le catalogue.',
        });
        continue;
      }

      const product = variant.product;
      const quote = this.pricing.calculatePrice(product, variant, at);
      const label = `${product.name} (${variant.size}, ${variant.color})`;
      const availableStock = Math.max(0, variant.stock - variant.reservedStock);

      // Soft-deleted first: an archived product that was also deleted is
      // reported as unavailable, never as merely archived.
      if (product.deletedAt !== null) {
        const issue: CartIssueDto = {
          code: CartIssueCode.PRODUCT_NOT_FOUND,
          variantId: variant.id,
          productId: product.id,
          message: `Le produit ${label} n’est plus disponible.`,
        };
        items.push({
          variantId: variant.id,
          productId: product.id,
          productName: product.name,
          variantSku: variant.sku,
          size: variant.size,
          color: variant.color,
          quantity: 0,
          availableStock,
          unitPrice: quote.unitPrice,
          lineTotal: 0,
          issues: [issue],
        });
        issues.push(issue);
        continue;
      }

      if (product.status !== 'PUBLISHED') {
        const issue: CartIssueDto = {
          code: CartIssueCode.PRODUCT_ARCHIVED,
          variantId: variant.id,
          productId: product.id,
          message: `Le produit ${label} n’est plus en vente.`,
        };
        items.push({
          variantId: variant.id,
          productId: product.id,
          productName: product.name,
          variantSku: variant.sku,
          size: variant.size,
          color: variant.color,
          quantity: 0,
          availableStock,
          unitPrice: quote.unitPrice,
          lineTotal: 0,
          issues: [issue],
        });
        issues.push(issue);
        continue;
      }

      const lineIssues: CartIssueDto[] = [];

      let requestedQuantity = line.quantity;
      if (requestedQuantity > MAX_LINE_QUANTITY) {
        const issue: CartIssueDto = {
          code: CartIssueCode.QUANTITY_EXCEEDED,
          variantId: variant.id,
          requestedQuantity,
          maxQuantity: MAX_LINE_QUANTITY,
          message: `Quantité limitée à ${MAX_LINE_QUANTITY} par article (${requestedQuantity} demandés).`,
        };
        lineIssues.push(issue);
        requestedQuantity = MAX_LINE_QUANTITY;
      }

      const stockStatus = this.stock.validateStock({
        stock: variant.stock,
        reservedStock: variant.reservedStock,
        requestedQuantity,
      });

      if (stockStatus.available === 0) {
        lineIssues.push({
          code: CartIssueCode.OUT_OF_STOCK,
          variantId: variant.id,
          requestedQuantity: line.quantity,
          availableQuantity: 0,
          message: `Rupture de stock : ${label} est indisponible.`,
        });
      } else if (!stockStatus.canFulfill) {
        lineIssues.push({
          code: CartIssueCode.INSUFFICIENT_STOCK,
          variantId: variant.id,
          requestedQuantity: line.quantity,
          availableQuantity: stockStatus.available,
          message: `Stock insuffisant : ${stockStatus.available} disponible(s), ${line.quantity} demandé(s).`,
        });
      }

      // Price drift is purely informational: the server price always wins.
      const priceIssue = this.detectPriceIssue(line, quote, product, at, label);
      if (priceIssue) {
        lineIssues.push(priceIssue);
      }

      items.push({
        variantId: variant.id,
        productId: product.id,
        productName: product.name,
        variantSku: variant.sku,
        size: variant.size,
        color: variant.color,
        quantity: stockStatus.adjustedQuantity,
        availableStock: stockStatus.available,
        unitPrice: quote.unitPrice,
        lineTotal: quote.unitPrice * stockStatus.adjustedQuantity,
        issues: lineIssues,
      });

      for (const issue of lineIssues) {
        issues.push(this.toSummaryIssue(issue, label));
      }
    }

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    let discount = 0;
    if (dto.couponCode !== undefined && dto.couponCode.trim() !== '') {
      const evaluation = this.pricing.evaluateCoupon(coupon, subtotal, at, dto.couponCode.trim());
      discount = evaluation.discount;
      if (evaluation.issue) {
        issues.push(evaluation.issue);
      }
    }

    const total = Math.max(0, subtotal - discount);
    const valid = !issues.some((issue) => isBlockingIssue(issue.code));
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    this.logger.debug(
      { userId, itemCount: items.length, totalQuantity, valid },
      'cart validation completed',
    );

    return {
      valid,
      items,
      subtotal,
      discount,
      total,
      issues,
      meta: {
        validatedAt: at.toISOString(),
        itemCount: items.length,
        totalQuantity,
      },
    };
  }

  // A cart holds at most one line per variant (@@unique([cartId, variantId])):
  // duplicated variant ids are merged so the caller can never get two prices
  // for the same SKU. The first provided previousUnitPrice is kept as hint.
  private mergeLines(items: CartItemInputDto[]): RequestedLine[] {
    const merged = new Map<string, RequestedLine>();
    for (const item of items) {
      const existing = merged.get(item.variantId);
      if (existing) {
        existing.quantity += item.quantity;
        if (existing.previousUnitPrice === undefined && item.previousUnitPrice !== undefined) {
          existing.previousUnitPrice = item.previousUnitPrice;
        }
        continue;
      }
      merged.set(item.variantId, {
        variantId: item.variantId,
        quantity: item.quantity,
        ...(item.previousUnitPrice !== undefined
          ? { previousUnitPrice: item.previousUnitPrice }
          : {}),
      });
    }
    return [...merged.values()];
  }

  private detectPriceIssue(
    line: RequestedLine,
    quote: { unitPrice: number; appliedPromo: boolean },
    product: { promoPrice: number | null; promoEnd: Date | null },
    at: Date,
    label: string,
  ): CartIssueDto | null {
    const previous = line.previousUnitPrice;
    if (previous === undefined || previous === quote.unitPrice) {
      return null;
    }

    if (quote.unitPrice < previous) {
      if (quote.appliedPromo) {
        return {
          code: CartIssueCode.PROMO_APPLIED,
          variantId: line.variantId,
          previousPrice: previous,
          currentPrice: quote.unitPrice,
          message: `Une promotion est active sur ${label} : ${formatXaf(previous)} → ${formatXaf(quote.unitPrice)}.`,
        };
      }
      return {
        code: CartIssueCode.PRICE_CHANGED,
        variantId: line.variantId,
        previousPrice: previous,
        currentPrice: quote.unitPrice,
        message: `Le prix de ${label} a changé : ${formatXaf(previous)} → ${formatXaf(quote.unitPrice)}.`,
      };
    }

    // The price went up: a promotion that just ended explains it when the
    // client remembered exactly the product promo price.
    const endedPromo =
      product.promoPrice !== null &&
      product.promoEnd !== null &&
      product.promoEnd.getTime() < at.getTime() &&
      previous === product.promoPrice;

    if (endedPromo) {
      return {
        code: CartIssueCode.PROMO_EXPIRED,
        variantId: line.variantId,
        previousPrice: previous,
        currentPrice: quote.unitPrice,
        message: `La promotion sur ${label} est terminée : le prix revient à ${formatXaf(quote.unitPrice)}.`,
      };
    }
    return {
      code: CartIssueCode.PRICE_CHANGED,
      variantId: line.variantId,
      previousPrice: previous,
      currentPrice: quote.unitPrice,
      message: `Le prix de ${label} a changé : ${formatXaf(previous)} → ${formatXaf(quote.unitPrice)}.`,
    };
  }

  // Item issues stay short; the aggregated list names the product so the
  // storefront can show a banner without re-joining lines.
  private toSummaryIssue(issue: CartIssueDto, label: string): CartIssueDto {
    switch (issue.code) {
      case CartIssueCode.INSUFFICIENT_STOCK:
        return { ...issue, message: `Stock insuffisant pour ${label}.` };
      case CartIssueCode.OUT_OF_STOCK:
        return { ...issue, message: `Rupture de stock pour ${label}.` };
      case CartIssueCode.QUANTITY_EXCEEDED:
        return { ...issue, message: `Quantité maximale dépassée pour ${label}.` };
      default:
        return issue;
    }
  }

  private async findCoupon(code: string | undefined) {
    const normalized = code?.trim();
    if (!normalized) {
      return null;
    }
    return this.prisma.coupon.findFirst({
      where: { code: { equals: normalized, mode: 'insensitive' } },
      select: couponSelection,
    });
  }
}
