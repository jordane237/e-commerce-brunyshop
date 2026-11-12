import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { StockMovementReason } from '../../generated/prisma/client';
import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../infrastructure/database/database.module';
import { InventoryService } from './inventory.service';

interface TransactionMock {
  $queryRaw: ReturnType<typeof vi.fn>;
  productVariant: { findUnique: ReturnType<typeof vi.fn> };
  stockMovement: { create: ReturnType<typeof vi.fn> };
}

function transactionMock(): TransactionMock {
  return {
    $queryRaw: vi.fn(),
    productVariant: { findUnique: vi.fn() },
    stockMovement: { create: vi.fn().mockResolvedValue({ id: 'movement-1' }) },
  };
}

function serviceWith(prisma: Partial<PrismaService> = {}): InventoryService {
  return new InventoryService(prisma as PrismaService);
}

describe('InventoryService decrementStockAtomically (STK-01)', () => {
  it('décrémente atomiquement et écrit un mouvement PURCHASE cohérent', async () => {
    const tx = transactionMock();
    tx.$queryRaw.mockResolvedValue([{ stock: 0, version: 4 }]);
    const inventory = serviceWith();

    const result = await inventory.decrementStockAtomically(
      tx as unknown as Prisma.TransactionClient,
      'variant-1',
      1,
      'order-1',
      'user-1',
      StockMovementReason.PURCHASE,
    );

    expect(result).toEqual({ newStock: 0, newVersion: 4 });
    expect(tx.stockMovement.create).toHaveBeenCalledWith({
      data: {
        variantId: 'variant-1',
        delta: -1,
        reason: 'PURCHASE',
        orderId: 'order-1',
        userId: 'user-1',
        before: 1,
        after: 0,
      },
    });
  });

  it('refuse les quantités nulles ou négatives sans exécuter de SQL', async () => {
    const tx = transactionMock();
    const inventory = serviceWith();

    await expect(
      inventory.decrementStockAtomically(
        tx as unknown as Prisma.TransactionClient,
        'variant-1',
        0,
        'order-1',
        null,
        StockMovementReason.PURCHASE,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.$queryRaw).not.toHaveBeenCalled();
    expect(tx.stockMovement.create).not.toHaveBeenCalled();
  });

  it('retourne 409 INSUFFICIENT_STOCK avec les quantités quand le UPDATE ne prend aucune ligne', async () => {
    const tx = transactionMock();
    tx.$queryRaw.mockResolvedValue([]);
    tx.productVariant.findUnique.mockResolvedValue({
      stock: 1,
      reservedStock: 0,
      size: '42',
      color: 'Noir',
      product: { name: 'Baskets' },
    });
    const inventory = serviceWith();

    let error: unknown;
    try {
      await inventory.decrementStockAtomically(
        tx as unknown as Prisma.TransactionClient,
        'variant-1',
        2,
        'order-1',
        null,
        StockMovementReason.PURCHASE,
      );
    } catch (caught: unknown) {
      error = caught;
    }

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).getResponse()).toMatchObject({
      code: 'INSUFFICIENT_STOCK',
      message: 'Stock insuffisant : 1 disponible(s), 2 demandé(s).',
      errors: [
        {
          field: 'items',
          variantId: 'variant-1',
          requestedQuantity: 2,
          availableQuantity: 1,
        },
      ],
    });
    expect(tx.stockMovement.create).not.toHaveBeenCalled();
  });

  it('conserve le code INSUFFICIENT_STOCK même quand le stock tombe à zéro', async () => {
    const tx = transactionMock();
    tx.$queryRaw.mockResolvedValue([]);
    tx.productVariant.findUnique.mockResolvedValue({
      stock: 0,
      reservedStock: 0,
      size: '42',
      color: 'Noir',
      product: { name: 'Baskets' },
    });
    const inventory = serviceWith();

    await expect(
      inventory.decrementStockAtomically(
        tx as unknown as Prisma.TransactionClient,
        'variant-1',
        1,
        'order-1',
        null,
        StockMovementReason.PURCHASE,
      ),
    ).rejects.toMatchObject({
      response: { code: 'INSUFFICIENT_STOCK' },
    });
  });

  it('retourne 404 si la variante a disparu entre le panier et la commande', async () => {
    const tx = transactionMock();
    tx.$queryRaw.mockResolvedValue([]);
    tx.productVariant.findUnique.mockResolvedValue(null);
    const inventory = serviceWith();

    await expect(
      inventory.decrementStockAtomically(
        tx as unknown as Prisma.TransactionClient,
        'deleted-variant',
        1,
        null,
        null,
        StockMovementReason.PURCHASE,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('calcule le stock disponible sans jamais exposer de valeur négative', async () => {
    const findUnique = vi.fn().mockResolvedValue({ stock: 2, reservedStock: 5 });
    const inventory = serviceWith({ productVariant: { findUnique } } as unknown as PrismaService);

    await expect(inventory.getAvailableStock('variant-1')).resolves.toEqual({
      stock: 2,
      reservedStock: 5,
      available: 0,
    });
  });
});
