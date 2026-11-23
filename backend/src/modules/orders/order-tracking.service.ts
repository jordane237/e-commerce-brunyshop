import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/database/database.module';
import { sha256hex } from '../../common/utils/crypto';
import { AuditLogService } from '../audit/audit.service';
import { ORDER_AUDIT_ACTIONS } from './events/order-created.event';
import { OrderAttemptService } from './order-attempt.service';
import type { TrackOrderDto } from './dto/track-order.dto';
import type { TrackOrderResponseDto } from './dto/track-order-response.dto';

interface TrackMeta {
  ipAddress?: string;
  userAgent?: string;
}

interface TimelineStep {
  status: string;
  label: string;
}

const TIMELINE_STEPS: readonly TimelineStep[] = [
  { status: 'PENDING_CONFIRMATION', label: 'En attente de confirmation' },
  { status: 'CONFIRMED', label: 'Confirmée' },
  { status: 'PREPARING', label: 'En préparation' },
  { status: 'SHIPPED', label: 'Expédiée' },
  { status: 'DELIVERED', label: 'Livrée' },
];

const STATUS_LABELS: Readonly<Record<string, string>> = {
  PENDING_CONFIRMATION: 'En attente de confirmation',
  AWAITING_PAYMENT: 'En attente de paiement',
  CONFIRMED: 'Confirmée',
  PAID: 'Payée',
  PREPARING: 'En préparation',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  DELIVERY_FAILED: 'Échec de livraison',
  CANCELLED: 'Annulée',
  RETURN_REQUESTED: 'Retour demandé',
  RETURNED: 'Retournée',
  REFUNDED: 'Remboursée',
  EXCHANGED: 'Échangée',
};

@Injectable()
export class OrderTrackingService {
  private readonly logger = new Logger(OrderTrackingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly attempts: OrderAttemptService,
  ) {}

  async track(dto: TrackOrderDto, meta: TrackMeta = {}): Promise<TrackOrderResponseDto> {
    const identifierHash = sha256hex(`${dto.reference}:${dto.phone}`);
    const rateLimited = await this.attempts.isTrackingRateLimited(identifierHash);
    if (rateLimited) {
      await this.audit
        .record(this.prisma, {
          userId: null,
          action: ORDER_AUDIT_ACTIONS.ORDER_TRACK_RATE_LIMITED,
          entity: 'Order',
          entityId: 'rate-limit',
          ...(meta.ipAddress !== undefined ? { ip: meta.ipAddress } : {}),
          ...(meta.userAgent !== undefined ? { userAgent: meta.userAgent } : {}),
          after: {
            reference: dto.reference,
            phoneMasked: maskPhone(dto.phone),
            found: false,
          },
        })
        .catch(() => undefined);
      throw new HttpException(
        {
          code: 'TRACKING_RATE_LIMIT_EXCEEDED',
          message: 'Trop de tentatives. Réessayez dans quelques minutes.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.attempts.recordTrackingAttempt(identifierHash);

    const normalizedPhone = dto.phone.trim();
    const order = await this.prisma.order.findFirst({
      where: {
        reference: dto.reference,
        deletedAt: null,
        OR: [{ guestPhone: normalizedPhone }, { user: { phone: normalizedPhone } }],
      },
      include: {
        items: { orderBy: { createdAt: 'asc' } },
        shipment: {
          select: {
            status: true,
            deliveredAt: true,
            zone: { select: { name: true, estimatedDays: true } },
          },
        },
      },
    });

    if (order === null) {
      await this.audit
        .record(this.prisma, {
          userId: null,
          action: ORDER_AUDIT_ACTIONS.ORDER_TRACK_ATTEMPT,
          entity: 'Order',
          entityId: 'unknown',
          ...(meta.ipAddress !== undefined ? { ip: meta.ipAddress } : {}),
          ...(meta.userAgent !== undefined ? { userAgent: meta.userAgent } : {}),
          after: {
            reference: dto.reference,
            phoneMasked: maskPhone(dto.phone),
            found: false,
          },
        })
        .catch(() => undefined);
      // Aucune PII dans les logs applicatifs : l'IP reste dans l'audit.
      this.logger.warn({ reference: dto.reference }, 'Order tracking attempt — not found');
      // CA #2 : réponse uniforme, pas de fuite.
      return { found: false };
    }

    const timeline = this.buildTimeline(order);
    const response: TrackOrderResponseDto = {
      found: true,
      order: {
        reference: order.reference,
        status: order.status,
        statusLabel: STATUS_LABELS[order.status] ?? order.status,
        items: order.items.map((item) => ({
          name: item.nameSnapshot,
          size: item.sizeSnapshot,
          color: item.colorSnapshot,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.unitPrice * item.quantity,
        })),
        subtotal: order.subtotal,
        discount: order.discount,
        shippingFee: order.shippingFee,
        total: order.total,
        createdAt: order.createdAt.toISOString(),
        timeline,
        ...(order.shipment?.zone?.name !== undefined
          ? { shippingCity: order.shipment.zone.name }
          : {}),
        ...(order.shipment?.zone?.estimatedDays !== undefined
          ? {
              estimatedDelivery: new Date(
                order.createdAt.getTime() + order.shipment.zone.estimatedDays * 86400000,
              ).toISOString(),
            }
          : {}),
      },
    };

    await this.audit
      .record(this.prisma, {
        userId: null,
        action: ORDER_AUDIT_ACTIONS.ORDER_TRACKED,
        entity: 'Order',
        entityId: order.id,
        ...(meta.ipAddress !== undefined ? { ip: meta.ipAddress } : {}),
        ...(meta.userAgent !== undefined ? { userAgent: meta.userAgent } : {}),
        after: {
          reference: order.reference,
          phoneMasked: maskPhone(dto.phone),
          found: true,
        },
      })
      .catch(() => undefined);
    this.logger.log(
      { orderId: order.id, reference: order.reference },
      'Order tracked successfully',
    );

    return response;
  }

  private buildTimeline(order: {
    status: string;
    createdAt: Date;
    shipment?: { deliveredAt: Date | null } | null;
  }): Array<{
    status: string;
    label: string;
    date: string | null;
    isCurrent: boolean;
    isCompleted: boolean;
  }> {
    const currentIndex = TIMELINE_STEPS.findIndex((step) => step.status === order.status);
    return TIMELINE_STEPS.map((step, index) => {
      let date: string | null = null;
      if (step.status === 'PENDING_CONFIRMATION') {
        date = order.createdAt.toISOString();
      } else if (step.status === 'DELIVERED' && order.shipment?.deliveredAt) {
        date = order.shipment.deliveredAt.toISOString();
      }
      return {
        status: step.status,
        label: step.label,
        date,
        isCurrent: currentIndex === index,
        isCompleted: currentIndex > index,
      };
    });
  }
}

function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  return `***${phone.slice(-4)}`;
}
