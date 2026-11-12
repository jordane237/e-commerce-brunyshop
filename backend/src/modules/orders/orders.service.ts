import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';

import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import {
  Prisma,
  type Order,
  type PaymentMethod,
  StockMovementReason,
} from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/database.module';
import { CartPricingService } from '../cart/cart-pricing.service';
import { CartValidationService } from '../cart/cart-validation.service';
import {
  CartIssueCode,
  isBlockingIssue,
  type CartValidationResponseDto,
} from '../cart/dto/cart-validation-response.dto';
import { InventoryService } from '../inventory/inventory.service';
import { AddressSnapshotDto } from './dto/address-snapshot.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { MAX_ORDER_LINE_QUANTITY } from './dto/create-order-item.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderErrorCode } from './orders.errors';

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
  id: true,
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
}

interface CreateOrderMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: CartPricingService,
    private readonly cartValidation: CartValidationService,
    private readonly inventory: InventoryService,
  ) {}

  async createOrder(
    dto: CreateOrderDto,
    actor: AuthenticatedUser | null,
    _meta?: CreateOrderMeta,
  ): Promise<OrderResponseDto> {
    this.assertPaymentMethod(dto.paymentMethod);
    const guest = this.resolveGuest(dto, actor);

    // A existing key is returned without touching stock or creating a second
    // payment. Ownership is checked so a leaked key cannot expose an order.
    if (dto.idempotencyKey !== undefined) {
      const existing = await this.prisma.order.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing !== null) {
        return this.reuseExistingOrder(existing, actor, dto);
      }
    }

    const validation = await this.cartValidation.validateCart(
      {
        // Only identity and quantity cross this boundary: prices are always
        // reloaded and recomputed from the catalogue.
        items: dto.items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        ...(dto.couponCode !== undefined ? { couponCode: dto.couponCode } : {}),
      },
      actor?.id,
    );
    if (!validation.valid) {
      throw this.validationException(validation);
    }

    const lines = this.mergeLines(dto.items);
    for (let attempt = 0; ; attempt += 1) {
      const reference = this.createReference();
      try {
        const order = await this.persistOrder(dto, lines, actor, guest, reference);
        return this.toResponse(order);
      } catch (error: unknown) {
        const recovered = await this.recoverUniqueConflict(error, dto, actor);
        if (recovered !== null) {
          return this.toResponse(recovered);
        }
        if (this.isReferenceConflict(error) && attempt < 2) {
          continue;
        }
        if (this.isReferenceConflict(error)) {
          throw new ConflictException({
            code: OrderErrorCode.ORDER_REFERENCE_CONFLICT,
            message: 'La commande n’a pas pu être créée. Réessaie dans un instant.',
          });
        }
        throw error;
      }
    }
  }

  private async persistOrder(
    dto: CreateOrderDto,
    lines: RequestedLine[],
    actor: AuthenticatedUser | null,
    guest: { guestName: string; guestPhone: string } | null,
    reference: string,
  ): Promise<Order> {
    return this.prisma.$transaction(
      async (tx) => {
        const at = new Date();
        const variants = await tx.productVariant.findMany({
          where: { id: { in: lines.map((line) => line.variantId) } },
          select: variantSelection,
        });
        const variantsById = new Map(variants.map((variant) => [variant.id, variant]));

        const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];
        let subtotal = 0;

        for (const line of lines) {
          const variant = variantsById.get(line.variantId);
          if (variant === undefined) {
            throw new NotFoundException({
              code: OrderErrorCode.PRODUCT_NOT_FOUND,
              message: 'Une des variantes commandées n’existe plus dans le catalogue.',
              errors: [
                {
                  field: 'items',
                  message: 'Variante introuvable.',
                  variantId: line.variantId,
                },
              ],
            });
          }
          if (variant.product.deletedAt !== null) {
            throw new BadRequestException({
              code: OrderErrorCode.PRODUCT_NOT_FOUND,
              message: `Le produit ${variant.product.name} n’est plus disponible.`,
            });
          }
          if (variant.product.status !== 'PUBLISHED') {
            throw new BadRequestException({
              code: OrderErrorCode.PRODUCT_ARCHIVED,
              message: `Le produit ${variant.product.name} n’est plus en vente.`,
            });
          }

          const quote = this.pricing.calculatePrice(variant.product, variant, at);
          subtotal += quote.unitPrice * line.quantity;
          orderItems.push({
            variant: { connect: { id: variant.id } },
            nameSnapshot: variant.product.name,
            sizeSnapshot: variant.size,
            colorSnapshot: variant.color,
            unitPrice: quote.unitPrice,
            quantity: line.quantity,
          });
        }

        const coupon = await this.findCoupon(tx, dto.couponCode);
        let discount = 0;
        let appliedCouponId: string | null = null;
        if (dto.couponCode !== undefined && dto.couponCode.trim() !== '') {
          const evaluation = this.pricing.evaluateCoupon(
            coupon,
            subtotal,
            at,
            dto.couponCode.trim(),
          );
          if (evaluation.issue !== null) {
            if (evaluation.issue.code !== CartIssueCode.COUPON_MIN_AMOUNT_NOT_REACHED) {
              throw new BadRequestException({
                code: OrderErrorCode.INVALID_COUPON,
                message: evaluation.issue.message,
                errors: [
                  {
                    field: 'couponCode',
                    message: evaluation.issue.message,
                    couponCode: dto.couponCode,
                  },
                ],
              });
            }
          } else if (coupon !== null) {
            discount = evaluation.discount;
            appliedCouponId = coupon.id;
          }
        }

        const zone = await this.findDeliveryZone(tx, dto.address.city);
        const shippingFee = zone.fee;
        const total = Math.max(0, subtotal - discount) + shippingFee;

        const order = await tx.order.create({
          data: {
            reference,
            userId: actor?.id ?? null,
            guestName: guest?.guestName ?? null,
            guestPhone: guest?.guestPhone ?? null,
            status: 'PENDING_CONFIRMATION',
            subtotal,
            discount,
            shippingFee,
            total,
            paymentMethod: dto.paymentMethod,
            paymentStatus: 'PENDING',
            addressSnapshot: this.freezeAddress(dto.address),
            ...(dto.idempotencyKey !== undefined ? { idempotencyKey: dto.idempotencyKey } : {}),
            items: { create: orderItems },
            ...(appliedCouponId !== null
              ? { coupons: { create: [{ couponId: appliedCouponId }] } }
              : {}),
          },
        });

        await tx.payment.create({
          data: {
            orderId: order.id,
            provider: 'cod',
            amount: total,
            status: 'PENDING',
          },
        });

        await tx.shipment.create({
          data: {
            orderId: order.id,
            zoneId: zone.id,
            status: 'PENDING',
          },
        });

        // Deterministic lock ordering prevents deadlocks when two multi-item
        // orders share the same variants in different orders.
        const stockLines = [...lines].sort((a, b) => a.variantId.localeCompare(b.variantId));
        for (const line of stockLines) {
          await this.inventory.decrementStockAtomically(
            tx,
            line.variantId,
            line.quantity,
            order.id,
            actor?.id ?? null,
            StockMovementReason.PURCHASE,
          );
        }

        if (appliedCouponId !== null) {
          await tx.coupon.update({
            where: { id: appliedCouponId },
            data: { usedCount: { increment: 1 } },
          });
        }

        return order;
      },
      { maxWait: 5_000, timeout: 15_000 },
    );
  }

  private async recoverUniqueConflict(
    error: unknown,
    dto: CreateOrderDto,
    actor: AuthenticatedUser | null,
  ): Promise<Order | null> {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      return null;
    }

    // Prisma may report the constraint name instead of the field list. With an
    // idempotency key in the request, the authoritative check is the row
    // itself: return it when the competing request committed first.
    if (dto.idempotencyKey === undefined) {
      return null;
    }
    const existing = await this.prisma.order.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existing === null) {
      return null;
    }
    this.assertIdempotentOwner(existing, actor, dto);
    return existing;
  }

  private reuseExistingOrder(
    order: Order,
    actor: AuthenticatedUser | null,
    dto: CreateOrderDto,
  ): OrderResponseDto {
    this.assertIdempotentOwner(order, actor, dto);
    return this.toResponse(order);
  }

  private assertIdempotentOwner(
    order: Order,
    actor: AuthenticatedUser | null,
    dto: CreateOrderDto,
  ): void {
    const ownedByActor = actor !== null && order.userId === actor.id;
    const ownedByGuest =
      order.userId === null &&
      dto.guestPhone !== undefined &&
      order.guestPhone === dto.guestPhone.trim();
    if (!ownedByActor && !ownedByGuest) {
      throw new ConflictException({
        code: OrderErrorCode.IDEMPOTENCY_CONFLICT,
        message: 'Cette clé d’idempotence appartient à une autre commande.',
      });
    }
  }

  private validationException(validation: CartValidationResponseDto): Error {
    const issue =
      validation.issues.find((candidate) => isBlockingIssue(candidate.code)) ??
      validation.issues[0];
    if (issue === undefined) {
      return new BadRequestException({
        code: 'BAD_REQUEST',
        message: 'La commande ne peut pas être créée avec ce panier.',
      });
    }

    // The cart summary shortens stock messages; the order contract keeps the
    // quantities explicit for the customer and the support team.
    const message =
      issue.code === CartIssueCode.INSUFFICIENT_STOCK &&
      issue.requestedQuantity !== undefined &&
      issue.availableQuantity !== undefined
        ? `Stock insuffisant : ${issue.availableQuantity} disponible(s), ${issue.requestedQuantity} demandé(s).`
        : issue.message;
    const detail = {
      field: 'items',
      message,
      ...(issue.variantId !== undefined ? { variantId: issue.variantId } : {}),
      ...(issue.requestedQuantity !== undefined
        ? { requestedQuantity: issue.requestedQuantity }
        : {}),
      ...(issue.availableQuantity !== undefined
        ? { availableQuantity: issue.availableQuantity }
        : {}),
    };

    switch (issue.code) {
      case CartIssueCode.INSUFFICIENT_STOCK:
      case CartIssueCode.OUT_OF_STOCK:
        return new ConflictException({
          code:
            issue.code === CartIssueCode.OUT_OF_STOCK
              ? OrderErrorCode.OUT_OF_STOCK
              : OrderErrorCode.INSUFFICIENT_STOCK,
          message,
          errors: [detail],
        });
      case CartIssueCode.VARIANT_NOT_FOUND:
      case CartIssueCode.PRODUCT_NOT_FOUND:
        return new NotFoundException({
          code: OrderErrorCode.PRODUCT_NOT_FOUND,
          message,
          errors: [detail],
        });
      case CartIssueCode.PRODUCT_ARCHIVED:
        return new BadRequestException({
          code: OrderErrorCode.PRODUCT_ARCHIVED,
          message,
          errors: [detail],
        });
      case CartIssueCode.QUANTITY_EXCEEDED:
        return new BadRequestException({
          code: OrderErrorCode.INVALID_QUANTITY,
          message,
          errors: [detail],
        });
      case CartIssueCode.COUPON_INVALID:
        return new BadRequestException({
          code: OrderErrorCode.INVALID_COUPON,
          message: issue.message,
          errors: [{ field: 'couponCode', message: issue.message }],
        });
      default:
        return new BadRequestException({
          code: 'BAD_REQUEST',
          message: issue.message,
          errors: [detail],
        });
    }
  }

  private resolveGuest(
    dto: CreateOrderDto,
    actor: AuthenticatedUser | null,
  ): { guestName: string; guestPhone: string } | null {
    if (actor !== null) {
      return null;
    }
    const guestName = dto.guestName?.trim() ?? '';
    const guestPhone = dto.guestPhone?.trim() ?? '';
    if (guestName === '' || guestPhone === '') {
      throw new BadRequestException({
        code: OrderErrorCode.GUEST_INFORMATION_REQUIRED,
        message: 'Le nom et le téléphone sont obligatoires pour commander sans compte.',
        errors: [
          { field: 'guestName', message: 'Nom du client invité requis.' },
          { field: 'guestPhone', message: 'Téléphone du client invité requis.' },
        ],
      });
    }
    return { guestName, guestPhone };
  }

  private assertPaymentMethod(method: PaymentMethod): void {
    if (method !== 'COD') {
      throw new BadRequestException({
        code: OrderErrorCode.PAYMENT_METHOD_UNAVAILABLE,
        message: 'Le paiement à la livraison est le seul moyen disponible pour le moment.',
      });
    }
  }

  private mergeLines(items: CreateOrderDto['items']): RequestedLine[] {
    const merged = new Map<string, RequestedLine>();
    for (const item of items) {
      const existing = merged.get(item.variantId);
      if (existing !== undefined) {
        existing.quantity += item.quantity;
      } else {
        merged.set(item.variantId, {
          variantId: item.variantId,
          quantity: item.quantity,
        });
      }
    }
    for (const line of merged.values()) {
      if (line.quantity > MAX_ORDER_LINE_QUANTITY) {
        throw new BadRequestException({
          code: OrderErrorCode.INVALID_QUANTITY,
          message: `Quantité limitée à ${MAX_ORDER_LINE_QUANTITY} par article.`,
        });
      }
    }
    return [...merged.values()];
  }

  private async findCoupon(
    tx: Prisma.TransactionClient,
    code: string | undefined,
  ): Promise<{
    id: string;
    code: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    minAmount: number | null;
    startsAt: Date | null;
    endsAt: Date | null;
    maxUses: number | null;
    usedCount: number;
  } | null> {
    if (code === undefined || code.trim() === '') {
      return null;
    }
    return tx.coupon.findFirst({
      where: { code: { equals: code.trim(), mode: 'insensitive' } },
      select: couponSelection,
    });
  }

  private async findDeliveryZone(
    tx: Prisma.TransactionClient,
    city: string,
  ): Promise<{ id: string; fee: number }> {
    const normalizedCity = city.trim().toLocaleLowerCase('fr');
    const zones = await tx.deliveryZone.findMany({
      select: { id: true, fee: true, cities: true },
    });
    const zone = zones.find((candidate) =>
      candidate.cities.some((value) => value.trim().toLocaleLowerCase('fr') === normalizedCity),
    );
    if (zone === undefined) {
      throw new BadRequestException({
        code: OrderErrorCode.DELIVERY_ZONE_NOT_FOUND,
        message: `Nous ne livrons pas encore à ${city.trim()}.`,
        errors: [{ field: 'address.city', message: 'Ville non desservie.' }],
      });
    }
    return { id: zone.id, fee: zone.fee };
  }

  private freezeAddress(address: AddressSnapshotDto): Prisma.InputJsonValue {
    return {
      recipientName: address.recipientName.trim(),
      phone: address.phone,
      city: address.city.trim(),
      district: address.district.trim(),
      line: address.line.trim(),
      ...(address.landmark !== undefined ? { landmark: address.landmark.trim() } : {}),
      ...(address.instructions !== undefined ? { instructions: address.instructions.trim() } : {}),
    };
  }

  private createReference(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let index = 0; index < 4; index += 1) {
      suffix += alphabet[randomInt(alphabet.length)];
    }
    return `BRN-${yy}${mm}-${suffix}`;
  }

  private isReferenceConflict(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      this.uniqueTargetIncludes(error, 'reference')
    );
  }

  private uniqueTargetIncludes(
    error: Prisma.PrismaClientKnownRequestError,
    field: string,
  ): boolean {
    const target = error.meta?.['target'];
    if (Array.isArray(target)) {
      return target.map(String).includes(field);
    }
    return typeof target === 'string' && target.includes(field);
  }

  private toResponse(order: Order): OrderResponseDto {
    return {
      id: order.id,
      reference: order.reference,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal,
      discount: order.discount,
      shippingFee: order.shippingFee,
      total: order.total,
      createdAt: order.createdAt.toISOString(),
    };
  }
}
