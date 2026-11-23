import { BadRequestException, Injectable } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/database.module';
import { AuditLogService } from '../../audit/audit.service';
import { InventoryService } from '../inventory.service';
import { STOCK_AUDIT_ACTIONS } from '../stock-audit.actions';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { StockMovementQueryDto } from './dto/stock-movement-query.dto';
import {
  AdjustStockResponseDto,
  PaginatedStockMovementsDto,
  StockMovementItemDto,
} from './dto/stock-movement-response.dto';

interface StockAdjustActor {
  userId: string;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AdminStockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly audit: AuditLogService,
  ) {}

  async adjustStock(
    variantId: string,
    dto: AdjustStockDto,
    actor: StockAdjustActor,
  ): Promise<AdjustStockResponseDto> {
    const result = await this.prisma.$transaction(async (tx) => {
      const adjustment = await this.inventory.adjustStockManually(
        tx,
        variantId,
        dto.newStock,
        actor.userId,
        dto.motif,
        dto.notes,
      );

      await this.audit.record(tx, {
        userId: actor.userId,
        action: STOCK_AUDIT_ACTIONS.PRODUCT_STOCK_ADJUSTED,
        entity: 'ProductVariant',
        entityId: variantId,
        ip: actor.ip,
        userAgent: actor.userAgent,
        before: { stock: adjustment.before } as Prisma.InputJsonValue,
        after: {
          stock: adjustment.newStock,
          motif: dto.motif,
          delta: adjustment.delta,
          notes: dto.notes ?? null,
        } as Prisma.InputJsonValue,
      });

      return adjustment;
    });

    return {
      variantId,
      before: result.before,
      after: result.newStock,
      delta: result.delta,
      motif: dto.motif,
      movementId: result.movementId,
      adjustedAt: new Date(),
    };
  }

  async listMovements(query: StockMovementQueryDto): Promise<PaginatedStockMovementsDto> {
    if (query.from && query.to && new Date(query.from) > new Date(query.to)) {
      throw new BadRequestException({
        code: 'INVALID_DATE_RANGE',
        message: 'La date de début doit être antérieure à la date de fin.',
      });
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.StockMovementWhereInput = {};
    if (query.variantId) where.variantId = query.variantId;
    if (query.motif) where.motif = query.motif;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          variant: {
            select: {
              id: true,
              sku: true,
              size: true,
              color: true,
              product: { select: { id: true, name: true } },
            },
          },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    const data: StockMovementItemDto[] = items.map((movement) => ({
      id: movement.id,
      variantId: movement.variantId,
      variantSku: movement.variant.sku,
      productName: movement.variant.product.name,
      size: movement.variant.size,
      color: movement.variant.color,
      delta: movement.delta,
      reason: movement.reason,
      motif: movement.motif,
      notes: movement.notes,
      before: movement.before,
      after: movement.after,
      userId: movement.userId,
      userName: movement.user ? `${movement.user.firstName} ${movement.user.lastName}` : null,
      orderId: movement.orderId,
      createdAt: movement.createdAt,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
