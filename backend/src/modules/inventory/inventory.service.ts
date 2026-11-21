import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Prisma, type StockMovementReason } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/database.module';
import { InventoryErrorCode } from './inventory.errors';
import { StockLowEvent } from './events/stock-low.event';

interface StockUpdateRow {
  stock: number;
  version: number;
}

export interface StockDecrementResult {
  newStock: number;
  newVersion: number;
}

// Inventory writes are deliberately transaction-scoped: the caller owns the
// transaction so an order and its stock movements commit or roll back together.
// The conditional UPDATE is the anti-oversell primitive: PostgreSQL evaluates
// the WHERE clause while holding the row lock, so two concurrent requests for
// the last pair cannot both succeed.
@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async decrementStockAtomically(
    tx: Prisma.TransactionClient,
    variantId: string,
    quantity: number,
    orderId: string | null,
    userId: string | null,
    reason: StockMovementReason,
  ): Promise<StockDecrementResult> {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException({
        code: InventoryErrorCode.INVALID_QUANTITY,
        message: 'La quantité doit être un entier strictement positif.',
        errors: [{ field: 'quantity', message: 'Quantité invalide.' }],
      });
    }

    const rows = await tx.$queryRaw<StockUpdateRow[]>`
      UPDATE "ProductVariant"
      SET "stock" = "stock" - ${quantity},
          "version" = "version" + 1,
          "updatedAt" = NOW()
      WHERE "id" = ${variantId}
        AND "stock" - "reservedStock" >= ${quantity}
      RETURNING "stock", "version"
    `;

    const updated = rows[0];
    if (updated === undefined) {
      await this.throwStockConflict(tx, variantId, quantity);
    }

    const newStock = updated.stock;
    const newVersion = updated.version;

    // The RETURNING value is the post-update stock. Reconstructing the
    // pre-update value keeps before/after coherent even when another
    // transaction updated the row just before ours.
    const before = newStock + quantity;
    const after = newStock;
    if (before - quantity !== after) {
      throw new Error('Incohérence de stock détectée pendant le décrément.');
    }

    await tx.stockMovement.create({
      data: {
        variantId,
        delta: -quantity,
        reason,
        orderId,
        userId,
        before,
        after,
      },
    });

    return { newStock, newVersion };
  }

  /**
   * Émet stock.low APRÈS le commit de la transaction de commande. La lecture
   * du stock au moment de l'émission évite d'alerter si un réapprovisionnement
   * concurrent a déjà remonté la variante au-dessus du seuil.
   */
  async emitLowStockEvents(variantIds: string[]): Promise<void> {
    const uniqueIds = [...new Set(variantIds)];
    if (uniqueIds.length === 0) return;

    let variants: Array<{
      id: string;
      sku: string;
      size: string;
      color: string;
      stock: number;
      reservedStock: number;
      lowStockThreshold: number;
      product: { id: string; name: string; deletedAt: Date | null };
    }>;
    try {
      variants = await this.prisma.productVariant.findMany({
        where: { id: { in: uniqueIds } },
        select: {
          id: true,
          sku: true,
          size: true,
          color: true,
          stock: true,
          reservedStock: true,
          lowStockThreshold: true,
          product: { select: { id: true, name: true, deletedAt: true } },
        },
      });
    } catch (error: unknown) {
      this.logger.error({ error }, 'Impossible de charger les variantes pour l’alerte stock');
      return;
    }

    for (const variant of variants) {
      if (variant.product.deletedAt !== null) continue;
      const availableStock = Math.max(0, variant.stock - variant.reservedStock);
      if (availableStock > variant.lowStockThreshold) continue;

      try {
        await this.events.emitAsync(
          StockLowEvent.NAME,
          new StockLowEvent({
            variantId: variant.id,
            productId: variant.product.id,
            productName: variant.product.name,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            currentStock: variant.stock,
            reservedStock: variant.reservedStock,
            availableStock,
            threshold: variant.lowStockThreshold,
            occurredAt: new Date().toISOString(),
          }),
        );
      } catch (error: unknown) {
        // L'événement est post-commit : une panne de notification ne doit
        // jamais faire échouer une commande déjà enregistrée.
        this.logger.error(
          { variantId: variant.id, error },
          'Échec du traitement de l’alerte stock bas',
        );
      }
    }
  }

  async getAvailableStock(
    variantId: string,
  ): Promise<{ stock: number; reservedStock: number; available: number }> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true, reservedStock: true },
    });
    if (variant === null) {
      throw new NotFoundException({
        code: InventoryErrorCode.PRODUCT_NOT_FOUND,
        message: 'Cette variante n’existe plus dans le catalogue.',
        errors: [{ field: 'variantId', message: 'Variante introuvable.' }],
      });
    }
    return {
      stock: variant.stock,
      reservedStock: variant.reservedStock,
      available: Math.max(0, variant.stock - variant.reservedStock),
    };
  }

  // A failed UPDATE can mean "sold out" or "variant removed while the order
  // was being prepared". Read the row inside the same transaction to return a
  // useful message without ever exposing another customer's data.
  private async throwStockConflict(
    tx: Prisma.TransactionClient,
    variantId: string,
    requestedQuantity: number,
  ): Promise<never> {
    const variant = await tx.productVariant.findUnique({
      where: { id: variantId },
      select: {
        stock: true,
        reservedStock: true,
        size: true,
        color: true,
        product: { select: { name: true } },
      },
    });

    if (variant === null) {
      throw new NotFoundException({
        code: InventoryErrorCode.PRODUCT_NOT_FOUND,
        message: 'Cette variante n’existe plus dans le catalogue.',
        errors: [{ field: 'variantId', message: 'Variante introuvable.' }],
      });
    }

    const available = Math.max(0, variant.stock - variant.reservedStock);
    const label = `${variant.product.name} (${variant.size}, ${variant.color})`;
    const message =
      available === 0
        ? `Rupture de stock : ${label} est indisponible.`
        : `Stock insuffisant : ${available} disponible(s), ${requestedQuantity} demandé(s).`;

    // The contract is driven by the failed atomic UPDATE, not by the current
    // stock value: 0 updated row always means INSUFFICIENT_STOCK, including
    // the race where the last pair was sold between pre-check and UPDATE.
    throw new ConflictException({
      code: InventoryErrorCode.INSUFFICIENT_STOCK,
      message,
      errors: [
        {
          field: 'items',
          message,
          variantId,
          requestedQuantity,
          availableQuantity: available,
        },
      ],
    });
  }
}
