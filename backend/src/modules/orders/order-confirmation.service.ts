import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import {
  Order,
  OrderConfirmationMethod,
  OrderStatus,
  PaymentMethod,
} from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/database.module';
import { AuditLogService } from '../audit/audit.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import { OrderResponseDto } from './dto/order-response.dto';
import { ShipmentResponseDto } from './dto/shipment-response.dto';
import { ORDER_AUDIT_ACTIONS } from './events/order-created.event';

const COD_CONFIRMATION_THRESHOLD_KEY = 'order.codConfirmationThreshold';
const DEFAULT_COD_CONFIRMATION_THRESHOLD = 100000;

export interface OrderConfirmationMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class OrderConfirmationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditLogService,
  ) {}

  async getCodConfirmationThreshold(): Promise<number> {
    const setting = await this.prisma.setting.findUnique({
      where: { key: COD_CONFIRMATION_THRESHOLD_KEY },
      select: { value: true },
    });
    const fromDatabase = setting?.value;
    if (typeof fromDatabase === 'number' && Number.isInteger(fromDatabase) && fromDatabase > 0) {
      return fromDatabase;
    }
    return DEFAULT_COD_CONFIRMATION_THRESHOLD;
  }

  async confirmOrder(
    orderId: string,
    dto: { method: OrderConfirmationMethod; notes?: string },
    actor: AuthenticatedUser,
    meta: OrderConfirmationMeta = {},
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (order === null) {
      throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Commande introuvable.' });
    }
    if (order.paymentMethod !== PaymentMethod.COD) {
      throw new BadRequestException({
        code: 'NOT_COD_ORDER',
        message:
          'Seules les commandes en paiement à la livraison peuvent être confirmées manuellement.',
      });
    }
    if (order.status !== OrderStatus.PENDING_CONFIRMATION) {
      throw new BadRequestException({
        code: 'INVALID_STATUS',
        message: 'Seule une commande en attente de confirmation peut être confirmée.',
      });
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        confirmedAt: new Date(),
        confirmedBy: actor.id,
        confirmationMethod: dto.method,
        confirmationNotes: dto.notes ?? null,
        status: OrderStatus.CONFIRMED,
      },
    });

    await this.audit.record(this.prisma, {
      userId: actor.id,
      action:
        dto.method === OrderConfirmationMethod.CALL
          ? ORDER_AUDIT_ACTIONS.ORDER_CONFIRMED_CALL
          : ORDER_AUDIT_ACTIONS.ORDER_CONFIRMED_WHATSAPP,
      entity: 'Order',
      entityId: orderId,
      ...(meta.ipAddress !== undefined ? { ip: meta.ipAddress } : {}),
      ...(meta.userAgent !== undefined ? { userAgent: meta.userAgent } : {}),
      before: { status: order.status, confirmedAt: null },
      after: {
        status: 'CONFIRMED',
        confirmedAt: updated.confirmedAt?.toISOString() ?? null,
        method: dto.method,
        notes: dto.notes ?? null,
      },
    });

    const phone = order.guestPhone ?? null;
    if (phone !== null && phone.trim() !== '') {
      try {
        await this.notifications.enqueueSms(
          actor.id,
          phone,
          'order.confirmed',
          'v1',
          { reference: order.reference, total: order.total },
          { metadata: { orderId } },
        );
      } catch {
        // best-effort : la confirmation reste valide même si la notification échoue
      }
      if (dto.method === OrderConfirmationMethod.WHATSAPP) {
        try {
          await this.notifications.enqueueWhatsapp(
            actor.id,
            phone,
            'order.confirmation.whatsapp',
            'v1',
            { reference: order.reference, total: order.total },
            { metadata: { orderId } },
          );
        } catch {
          // best-effort
        }
      }
    }

    return this.toResponse(updated);
  }

  async validateStatusTransition(orderId: string, newStatus: OrderStatus): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, paymentMethod: true, total: true, confirmedAt: true },
    });
    if (order === null) {
      throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Commande introuvable.' });
    }

    if (newStatus === OrderStatus.PREPARING && order.paymentMethod === PaymentMethod.COD) {
      if (order.confirmedAt === null) {
        const threshold = await this.getCodConfirmationThreshold();
        if (order.total >= threshold) {
          await this.audit
            .record(this.prisma, {
              userId: null,
              action: ORDER_AUDIT_ACTIONS.ORDER_CONFIRMATION_REQUIRED_BLOCKED,
              entity: 'Order',
              entityId: orderId,
              after: { status: order.status, total: order.total, threshold },
            })
            .catch(() => undefined);
          throw new BadRequestException({
            code: 'ORDER_CONFIRMATION_REQUIRED',
            message: `Montant ${order.total} XAF ≥ seuil ${threshold} XAF : confirmation obligatoire.`,
          });
        }
        await this.audit
          .record(this.prisma, {
            userId: null,
            action: ORDER_AUDIT_ACTIONS.ORDER_CONFIRMATION_REQUIRED_BLOCKED,
            entity: 'Order',
            entityId: orderId,
            after: { status: order.status, total: order.total, threshold },
          })
          .catch(() => undefined);
        throw new BadRequestException({
          code: 'ORDER_CONFIRMATION_REQUIRED',
          message: 'La commande doit être confirmée avant de passer en préparation.',
        });
      }
    }
  }

  async collectCod(
    shipmentId: string,
    dto: { amount: number; collectedAt?: string },
    actor: AuthenticatedUser,
    meta: OrderConfirmationMeta = {},
  ): Promise<ShipmentResponseDto> {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        order: { select: { id: true, reference: true, total: true, paymentMethod: true } },
      },
    });
    if (shipment === null) {
      throw new NotFoundException({
        code: 'SHIPMENT_NOT_FOUND',
        message: 'Livraison introuvable.',
      });
    }
    if (shipment.order.paymentMethod !== PaymentMethod.COD) {
      throw new BadRequestException({
        code: 'NOT_COD_ORDER',
        message:
          'Seules les commandes en paiement à la livraison peuvent avoir un encaissement COD.',
      });
    }
    if (shipment.status !== 'DELIVERED') {
      throw new BadRequestException({
        code: 'ORDER_NOT_DELIVERED',
        message: "La commande doit être livrée pour enregistrer l'encaissement.",
      });
    }
    if (dto.amount < 0 || dto.amount > shipment.order.total) {
      throw new BadRequestException({
        code: 'INVALID_COD_AMOUNT',
        message: `Le montant encaissé doit être compris entre 0 et ${shipment.order.total} XAF.`,
      });
    }

    const updated = await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        codCollected: true,
        codCollectedAt: dto.collectedAt ? new Date(dto.collectedAt) : new Date(),
        codCollectedBy: actor.id,
        codAmount: dto.amount,
      },
    });

    await this.audit.record(this.prisma, {
      userId: actor.id,
      action: ORDER_AUDIT_ACTIONS.ORDER_COD_COLLECTED,
      entity: 'Shipment',
      entityId: shipmentId,
      ...(meta.ipAddress !== undefined ? { ip: meta.ipAddress } : {}),
      ...(meta.userAgent !== undefined ? { userAgent: meta.userAgent } : {}),
      before: { codCollected: false, codAmount: null },
      after: {
        codCollected: true,
        codAmount: dto.amount,
        collectedAt: updated.codCollectedAt?.toISOString() ?? null,
      },
    });

    return {
      id: updated.id,
      orderId: updated.orderId,
      status: updated.status,
      deliveredAt: updated.deliveredAt?.toISOString() ?? null,
      codCollected: updated.codCollected,
      codCollectedAt: updated.codCollectedAt?.toISOString() ?? null,
      codCollectedBy: updated.codCollectedBy,
      codAmount: updated.codAmount,
    };
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
      confirmedAt: order.confirmedAt?.toISOString() ?? null,
      confirmedBy: order.confirmedBy ?? null,
      confirmationMethod: order.confirmationMethod ?? null,
      confirmationNotes: order.confirmationNotes ?? null,
    };
  }
}
