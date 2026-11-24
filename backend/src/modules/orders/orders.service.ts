import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createHash } from 'node:crypto';

import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import {
  Prisma,
  type Order,
  type PaymentMethod,
  StockMovementReason,
} from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/database.module';
import { AuditLogService } from '../audit/audit.service';
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
import {
  ORDER_CREATED_EVENT,
  ORDER_AUDIT_ACTIONS,
  OrderCreatedEvent,
  type OrderCreatedItem,
} from './events/order-created.event';
import { OrderAttemptService } from './order-attempt.service';
import { OrderErrorCode } from './orders.errors';
import { OrderReferenceGenerator } from './reference/order-reference.generator';

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

interface PersistedOrder {
  order: Order;
  stockVariantIds: string[];
  items: OrderCreatedItem[];
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: CartPricingService,
    private readonly cartValidation: CartValidationService,
    private readonly inventory: InventoryService,
    private readonly references: OrderReferenceGenerator,
    private readonly attempts: OrderAttemptService,
    private readonly auditLog: AuditLogService,
    private readonly events: EventEmitter2,
  ) {}

  async createOrder(
    dto: CreateOrderDto,
    idempotencyKey: string,
    actor: AuthenticatedUser | null,
    meta: CreateOrderMeta = {},
  ): Promise<OrderResponseDto> {
    this.assertPaymentMethod(dto.paymentMethod);
    const guest = this.resolveGuest(dto, actor);
    const requestHash = this.hashRequest(dto);

    // Replay: the same key always returns the same order, never a duplicate
    // and never another customer's order (CA #1).
    const existing = await this.prisma.order.findUnique({ where: { idempotencyKey } });
    if (existing !== null) {
      return this.replayOrder(existing, actor, dto, requestHash);
    }

    const phone = guest?.guestPhone ?? actor?.phone ?? dto.address.phone;
    await this.assertPhoneWithinLimit(phone, actor, meta);

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
      const reference = await this.references.generate();
      try {
        const persisted = await this.persistOrder({
          dto,
          lines,
          actor,
          guest,
          reference,
          idempotencyKey,
          requestHash,
          meta,
        });
        // Émission strictement post-commit : ni rollback, ni commande absente.
        await this.inventory.emitLowStockEvents(persisted.stockVariantIds);
        this.emitCreated(persisted.order, persisted.items, actor, guest);
        return this.toResponse(persisted.order);
      } catch (error: unknown) {
        const recovered = await this.recoverUniqueConflict(
          error,
          idempotencyKey,
          dto,
          actor,
          requestHash,
        );
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

  private async persistOrder(input: {
    dto: CreateOrderDto;
    lines: RequestedLine[];
    actor: AuthenticatedUser | null;
    guest: { guestName: string; guestPhone: string } | null;
    reference: string;
    idempotencyKey: string;
    requestHash: string;
    meta: CreateOrderMeta;
  }): Promise<PersistedOrder> {
    const { dto, lines, actor, guest, reference, idempotencyKey, requestHash, meta } = input;

    return this.prisma.$transaction(
      async (tx) => {
        const stockVariantIds: string[] = [];
        const at = new Date();
        const variants = await tx.productVariant.findMany({
          where: { id: { in: lines.map((line) => line.variantId) } },
          select: variantSelection,
        });
        const variantsById = new Map(variants.map((variant) => [variant.id, variant]));

        const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];
        const eventItems: OrderCreatedItem[] = [];
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
          eventItems.push({
            productName: variant.product.name,
            size: variant.size,
            color: variant.color,
            quantity: line.quantity,
            unitPrice: quote.unitPrice,
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

        const zone = await this.findDeliveryZone(tx, dto.address.city, dto.deliveryZoneId);
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
            ...(dto.source !== undefined ||
            meta.ipAddress !== undefined ||
            meta.userAgent !== undefined
              ? {
                  source: {
                    ...(meta.ipAddress !== undefined ? { ipAddress: meta.ipAddress } : {}),
                    ...(meta.userAgent !== undefined ? { userAgent: meta.userAgent } : {}),
                    ...(dto.source ?? {}),
                  },
                }
              : {}),
            idempotencyKey,
            idempotencyRequestHash: requestHash,
            items: { create: orderItems },
            ...(appliedCouponId !== null
              ? { coupons: { create: [{ couponId: appliedCouponId }] } }
              : {}),
          },
        });

        // ORD-02 : la création est la première entrée de la timeline.
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: null,
            toStatus: order.status,
            userId: actor?.id ?? null,
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
          stockVariantIds.push(line.variantId);
        }

        if (appliedCouponId !== null) {
          await tx.coupon.update({
            where: { id: appliedCouponId },
            data: { usedCount: { increment: 1 } },
          });
        }

        // Audit inside the transaction: a rolled-back order leaves no trace.
        await this.auditLog.record(tx, {
          userId: actor?.id ?? null,
          action: ORDER_AUDIT_ACTIONS.ORDER_CREATED,
          entity: 'Order',
          entityId: order.id,
          ...(meta.ipAddress !== undefined ? { ip: meta.ipAddress } : {}),
          ...(meta.userAgent !== undefined ? { userAgent: meta.userAgent } : {}),
          after: {
            reference: order.reference,
            status: order.status,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            subtotal: order.subtotal,
            discount: order.discount,
            shippingFee: order.shippingFee,
            total: order.total,
            itemCount: orderItems.reduce((sum, item) => sum + item.quantity, 0),
            zoneId: zone.id,
          },
        });

        return { order, stockVariantIds, items: eventItems };
      },
      { maxWait: 5_000, timeout: 15_000 },
    );
  }

  private async assertPhoneWithinLimit(
    phone: string,
    actor: AuthenticatedUser | null,
    meta: CreateOrderMeta,
  ): Promise<void> {
    try {
      await this.attempts.assertWithinLimit(phone);
    } catch (error: unknown) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
        await this.auditLog
          .record(this.prisma, {
            userId: actor?.id ?? null,
            action: ORDER_AUDIT_ACTIONS.ORDER_RATE_LIMITED,
            entity: 'Order',
            entityId: 'rate-limit',
            ...(meta.ipAddress !== undefined ? { ip: meta.ipAddress } : {}),
            ...(meta.userAgent !== undefined ? { userAgent: meta.userAgent } : {}),
            after: { phoneMasked: `***${phone.slice(-4)}` },
          })
          .catch(() => undefined);
      }
      throw error;
    }
  }

  private emitCreated(
    order: Order,
    items: OrderCreatedItem[],
    actor: AuthenticatedUser | null,
    guest: { guestName: string; guestPhone: string } | null,
  ): void {
    this.events.emit(
      ORDER_CREATED_EVENT,
      new OrderCreatedEvent(
        order.id,
        order.reference,
        actor?.id ?? null,
        guest?.guestName ?? addressRecipientName(order.addressSnapshot),
        guest?.guestPhone ?? actor?.phone ?? null,
        actor?.email ?? null,
        order.total,
        items,
      ),
    );
  }

  private async recoverUniqueConflict(
    error: unknown,
    idempotencyKey: string,
    dto: CreateOrderDto,
    actor: AuthenticatedUser | null,
    requestHash: string,
  ): Promise<Order | null> {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      return null;
    }
    const existing = await this.prisma.order.findUnique({
      where: { idempotencyKey },
    });
    if (existing === null) {
      return null;
    }
    this.assertIdempotentOwner(existing, actor, dto);
    this.assertSameRequest(existing, requestHash);
    return existing;
  }

  private replayOrder(
    order: Order,
    actor: AuthenticatedUser | null,
    dto: CreateOrderDto,
    requestHash: string,
  ): OrderResponseDto {
    this.assertIdempotentOwner(order, actor, dto);
    this.assertSameRequest(order, requestHash);
    return this.toResponse(order);
  }

  private assertSameRequest(order: Order, requestHash: string): void {
    // Rows created before ORD-01 carry no hash: replaying them stays safe.
    if (order.idempotencyRequestHash === null) {
      return;
    }
    if (order.idempotencyRequestHash !== requestHash) {
      throw new ConflictException({
        code: OrderErrorCode.IDEMPOTENCY_CONFLICT,
        message:
          'Cette clé d’idempotence a déjà servi pour une autre commande. Reprenez la commande existante ou utilisez une nouvelle clé.',
      });
    }
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

  private hashRequest(dto: CreateOrderDto): string {
    const lines = this.mergeLines(dto.items)
      .map((line) => ({ variantId: line.variantId, quantity: line.quantity }))
      .sort((a, b) => a.variantId.localeCompare(b.variantId) || a.quantity - b.quantity);
    const canonical = {
      items: lines,
      couponCode: dto.couponCode?.trim().toUpperCase() ?? null,
      guestName: dto.guestName?.trim() ?? null,
      guestPhone: dto.guestPhone?.trim() ?? null,
      address: {
        recipientName: dto.address.recipientName.trim(),
        phone: dto.address.phone,
        city: dto.address.city.trim(),
        district: dto.address.district.trim(),
        line: dto.address.line.trim(),
        landmark: dto.address.landmark?.trim() ?? null,
        instructions: dto.address.instructions?.trim() ?? null,
        slot: dto.address.slot ?? null,
        callBeforeDelivery: dto.address.callBeforeDelivery ?? null,
      },
      deliveryZoneId: dto.deliveryZoneId ?? null,
      paymentMethod: dto.paymentMethod,
      notes: dto.notes?.trim() ?? null,
    };
    return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
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

  // A zone is identified either by the id chosen in P10 (preferred) or by the
  // delivery city. Inactive zones are never eligible for a new order, even if
  // their id is sent explicitly (SHP-01).
  private async findDeliveryZone(
    tx: Prisma.TransactionClient,
    city: string,
    deliveryZoneId: string | undefined,
  ): Promise<{ id: string; fee: number }> {
    const normalizedCity = normalizeCity(city);

    if (deliveryZoneId !== undefined) {
      const zone = await tx.deliveryZone.findUnique({
        where: { id: deliveryZoneId },
        select: { id: true, fee: true, cities: true, isActive: true },
      });
      if (zone === null || !zone.isActive) {
        throw new BadRequestException({
          code: OrderErrorCode.DELIVERY_ZONE_NOT_FOUND,
          message: 'Cette zone de livraison n’existe plus. Choisissez une autre adresse.',
          errors: [{ field: 'deliveryZoneId', message: 'Zone introuvable.' }],
        });
      }
      if (!zone.cities.some((value) => normalizeCity(value) === normalizedCity)) {
        throw new BadRequestException({
          code: OrderErrorCode.DELIVERY_ZONE_MISMATCH,
          message: `La ville ${city.trim()} ne fait pas partie de la zone choisie.`,
          errors: [{ field: 'address.city', message: 'Ville hors de la zone sélectionnée.' }],
        });
      }
      return { id: zone.id, fee: zone.fee };
    }

    const zones = await tx.deliveryZone.findMany({
      where: { isActive: true },
      select: { id: true, fee: true, cities: true },
    });
    const zone = zones.find((candidate) =>
      candidate.cities.some((value) => normalizeCity(value) === normalizedCity),
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
      ...(address.slot !== undefined ? { slot: address.slot } : {}),
      ...(address.callBeforeDelivery !== undefined
        ? { callBeforeDelivery: address.callBeforeDelivery }
        : {}),
    };
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

function normalizeCity(city: string): string {
  return city.trim().toLocaleLowerCase('fr');
}

// L'instantané d'adresse est un JSON libre côté Prisma : on ne lit que le nom
// du destinataire, avec un repli null pour les anciennes lignes.
function addressRecipientName(snapshot: Prisma.JsonValue): string | null {
  if (snapshot === null || typeof snapshot !== 'object' || Array.isArray(snapshot)) return null;
  const value = (snapshot as Prisma.JsonObject)['recipientName'];
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}
