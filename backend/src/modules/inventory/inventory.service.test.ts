import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { StockAdjustmentMotif, StockMovementReason } from '../../generated/prisma/client';
import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../infrastructure/database/database.module';
import { InventoryService } from './inventory.service';

interface TransactionMock {
  $queryRaw: ReturnType<typeof vi.fn>;
  productVariant: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  stockMovement: { create: ReturnType<typeof vi.fn> };
}

function transactionMock(): TransactionMock {
  return {
    $queryRaw: vi.fn(),
    productVariant: { findUnique: vi.fn(), update: vi.fn().mockResolvedValue({}) },
    stockMovement: { create: vi.fn().mockResolvedValue({ id: 'movement-1' }) },
  };
}

function serviceWith(prisma: Partial<PrismaService> = {}): InventoryService {
  return new InventoryService(prisma as PrismaService, { emitAsync: vi.fn() } as never);
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

describe('InventoryService adjustStockManually (STK-02)', () => {
  it('refuse un stock négatif', async () => {
    const tx = transactionMock();
    const inventory = serviceWith();
    await expect(
      inventory.adjustStockManually(
        tx as unknown as Prisma.TransactionClient,
        'variant-1',
        -1,
        'user-1',
        StockAdjustmentMotif.RECEPTION,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.productVariant.findUnique).not.toHaveBeenCalled();
  });

  it('404 si la variante est introuvable', async () => {
    const tx = transactionMock();
    tx.productVariant.findUnique.mockResolvedValue(null);
    const inventory = serviceWith();
    await expect(
      inventory.adjustStockManually(
        tx as unknown as Prisma.TransactionClient,
        'variant-1',
        7,
        'user-1',
        StockAdjustmentMotif.RECEPTION,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('ne crée pas de mouvement si delta = 0', async () => {
    const tx = transactionMock();
    tx.productVariant.findUnique.mockResolvedValue({ id: 'variant-1', stock: 5 });
    const inventory = serviceWith();
    const result = await inventory.adjustStockManually(
      tx as unknown as Prisma.TransactionClient,
      'variant-1',
      5,
      'user-1',
      StockAdjustmentMotif.INVENTAIRE,
    );
    expect(result).toEqual({ newStock: 5, before: 5, delta: 0, movementId: '' });
    expect(tx.productVariant.update).not.toHaveBeenCalled();
    expect(tx.stockMovement.create).not.toHaveBeenCalled();
  });

  it('crée un mouvement avec delta positif et motif', async () => {
    const tx = transactionMock();
    tx.productVariant.findUnique.mockResolvedValue({ id: 'variant-1', stock: 5 });
    tx.stockMovement.create.mockResolvedValue({ id: 'movement-1' });
    const inventory = serviceWith();
    const result = await inventory.adjustStockManually(
      tx as unknown as Prisma.TransactionClient,
      'variant-1',
      10,
      'user-1',
      StockAdjustmentMotif.RECEPTION,
      'Réception fournisseur',
    );
    expect(result).toEqual({ newStock: 10, before: 5, delta: 5, movementId: 'movement-1' });
    expect(tx.productVariant.update).toHaveBeenCalledWith({
      where: { id: 'variant-1' },
      data: { stock: 10, version: { increment: 1 } },
    });
    expect(tx.stockMovement.create).toHaveBeenCalledWith({
      data: {
        variantId: 'variant-1',
        delta: 5,
        reason: 'ADJUSTMENT',
        motif: StockAdjustmentMotif.RECEPTION,
        notes: 'Réception fournisseur',
        before: 5,
        after: 10,
        userId: 'user-1',
        orderId: null,
      },
    });
  });

  it('crée un mouvement avec delta négatif', async () => {
    const tx = transactionMock();
    tx.productVariant.findUnique.mockResolvedValue({ id: 'variant-1', stock: 10 });
    tx.stockMovement.create.mockResolvedValue({ id: 'movement-2' });
    const inventory = serviceWith();
    const result = await inventory.adjustStockManually(
      tx as unknown as Prisma.TransactionClient,
      'variant-1',
      3,
      'user-1',
      StockAdjustmentMotif.CASSE,
    );
    expect(result).toMatchObject({ newStock: 3, before: 10, delta: -7, movementId: 'movement-2' });
    expect(tx.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ delta: -7, notes: null }) }),
    );
  });
});
