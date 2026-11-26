import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, type OrderStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/database.module';
import { AuditLogService } from '../audit/audit.service';
import {
  OrderStatusChangeResponseDto,
  OrderStatusHistoryItemDto,
} from './dto/order-status-history.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ORDER_AUDIT_ACTIONS } from './events/order-created.event';
import { OrderConfirmationService } from './order-confirmation.service';
import { allowedTransitionsFor, canRoleTransition, canTransition } from './order-status';
import { OrderErrorCode } from './orders.errors';

export interface StatusChangeActor {
  userId: string;
  roles: readonly string[];
}

export interface StatusChangeMeta {
  ip?: string;
  userAgent?: string;
}

interface OrderForTransition {
  id: string;
  reference: string;
  status: OrderStatus;
  items: { variantId: string; quantity: number }[];
}

interface StatusRow {
  stock: number;
}

/**
 * ORD-02 — orchestration des transitions de statut.
 *
 * Le controller reste mince : existence, validité de la transition, droit du
 * rôle et cohérence transactionnelle sont décidés ici. Le statut courant est
 * verrouillé par un `UPDATE ... WHERE status = <statutLu>` : deux transitions
 * concurrentes ne peuvent pas réussir, la perdante reçoit `409`.
 */
@Injectable()
export class OrderWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly confirmation: OrderConfirmationService,
  ) {}

  async changeStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
    actor: StatusChangeActor,
    meta: StatusChangeMeta = {},
  ): Promise<OrderStatusChangeResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, deletedAt: null },
      select: {
        id: true,
        reference: true,
        status: true,
        items: { select: { variantId: true, quantity: true } },
      },
    });
    if (order === null) {
      throw new NotFoundException({
        code: OrderErrorCode.ORDER_NOT_FOUND,
        message: 'Cette commande n’existe pas ou a été supprimée.',
      });
    }

    this.assertTransitionAllowed(order, dto.status, actor);

    // PAY-01 : le pré-contrôle métier intervient après le contrôle RBAC afin
    // qu'une transition interdite réponde 403, et non 400.
    await this.confirmation.validateStatusTransition(order.id, dto.status);

    return this.prisma.$transaction(
      async (tx) => {
        // Optimistic lock: the status read above is the expected value.
        const updated = await tx.order.updateMany({
          where: { id: order.id, status: order.status },
          data: { status: dto.status },
        });
        if (updated.count === 0) {
          const current = await tx.order.findUnique({
            where: { id: order.id },
            select: { status: true },
          });
          throw new ConflictException({
            code: OrderErrorCode.STALE_ORDER_STATUS,
            message: `La commande a changé de statut entre-temps (${current?.status ?? 'inconnu'}). Rechargez la page avant de réessayer.`,
            errors: [
              {
                field: 'status',
                message: 'Statut courant différent du statut attendu.',
                ...(current !== null ? { currentStatus: current.status } : {}),
              },
            ],
          });
        }

        if (dto.status === 'CANCELLED') {
          await this.releaseOrderStock(tx, order, actor.userId);
        }

        const entry = await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: dto.status,
            reason: dto.reason?.trim() ?? null,
            note: dto.note?.trim() ?? null,
            userId: actor.userId,
          },
        });

        // Audit dans la transaction : un rollback ne laisse ni historique ni
        // trace d'audit orpheline.
        await this.audit.record(tx, {
          userId: actor.userId,
          action: ORDER_AUDIT_ACTIONS.ORDER_STATUS_CHANGED,
          entity: 'Order',
          entityId: order.id,
          ...(meta.ip !== undefined ? { ip: meta.ip } : {}),
          ...(meta.userAgent !== undefined ? { userAgent: meta.userAgent } : {}),
          before: { status: order.status } satisfies Prisma.InputJsonValue,
          after: {
            status: dto.status,
            reference: order.reference,
            reason: dto.reason?.trim() ?? null,
            note: dto.note?.trim() ?? null,
          } satisfies Prisma.InputJsonValue,
        });

        const rows = await tx.orderStatusHistory.findMany({
          where: { orderId: order.id },
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { user: { select: { firstName: true, lastName: true } } },
        });

        return {
          id: order.id,
          reference: order.reference,
          previousStatus: order.status,
          status: dto.status,
          changedAt: entry.createdAt.toISOString(),
          history: rows.map(
            (row): OrderStatusHistoryItemDto => ({
              id: row.id,
              fromStatus: row.fromStatus,
              toStatus: row.toStatus,
              reason: row.reason,
              note: row.note,
              userId: row.userId,
              userName: row.user === null ? null : `${row.user.firstName} ${row.user.lastName}`,
              createdAt: row.createdAt.toISOString(),
            }),
          ),
        };
      },
      { maxWait: 5_000, timeout: 15_000 },
    );
  }

  private assertTransitionAllowed(
    order: OrderForTransition,
    target: OrderStatus,
    actor: StatusChangeActor,
  ): void {
    if (!canTransition(order.status, target)) {
      throw new ConflictException({
        code: OrderErrorCode.INVALID_STATUS_TRANSITION,
        message: `Cette commande ne peut pas passer de « ${order.status} » à « ${target} ».`,
        errors: [
          {
            field: 'status',
            message: 'Transition interdite.',
            currentStatus: order.status,
            targetStatus: target,
            allowedStatuses: allowedTransitionsFor(order.status),
          },
        ],
      });
    }
    if (!canRoleTransition(actor.roles, order.status, target)) {
      throw new ForbiddenException({
        code: OrderErrorCode.FORBIDDEN_STATUS_TRANSITION,
        message: 'Votre rôle ne permet pas cette transition de statut.',
        errors: [
          {
            field: 'status',
            message: 'Transition non autorisée pour ce rôle.',
            targetStatus: target,
          },
        ],
      });
    }
  }

  /**
   * Annulation : le stock a été décrémenté à la création (ORD-01) ; il est
   * restitué dans la même transaction, avec un mouvement `CANCELLATION`
   * traçable. Le tri par variante évite les interblocages entre annulations
   * concurrentes portant sur les mêmes variantes.
   */
  private async releaseOrderStock(
    tx: Prisma.TransactionClient,
    order: OrderForTransition,
    userId: string,
  ): Promise<void> {
    const items = [...order.items].sort((a, b) => a.variantId.localeCompare(b.variantId));
    for (const item of items) {
      const rows = await tx.$queryRaw<StatusRow[]>`
        UPDATE "ProductVariant"
        SET "stock" = "stock" + ${item.quantity},
            "version" = "version" + 1,
            "updatedAt" = NOW()
        WHERE "id" = ${item.variantId}
        RETURNING "stock"
      `;
      const updated = rows[0];
      if (updated === undefined) {
        // La contrainte de clé étrangère empêche la suppression d'une variante
        // commandée : une ligne absente signale une incohérence, pas un cas
        // normal. On échoue plutôt que de laisser un stock faux.
        throw new ConflictException({
          code: OrderErrorCode.STOCK_RELEASE_FAILED,
          message: 'Le stock de la commande n’a pas pu être restitué. Réessayez.',
          errors: [{ field: 'items', message: 'Variante introuvable.', variantId: item.variantId }],
        });
      }
      await tx.stockMovement.create({
        data: {
          variantId: item.variantId,
          delta: item.quantity,
          reason: 'CANCELLATION',
          orderId: order.id,
          userId,
          before: updated.stock - item.quantity,
          after: updated.stock,
        },
      });
    }
  }
}
