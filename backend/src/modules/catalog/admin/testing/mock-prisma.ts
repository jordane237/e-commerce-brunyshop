// testing/mock-prisma.ts
// Mocks partagés pour les tests unitaires du module admin catalogue (CAT-04).

import { vitest } from 'vitest';

export const mockPrisma = {
  product: {
    create: vitest.fn(),
    findUnique: vitest.fn(),
    update: vitest.fn(),
    deleteMany: vitest.fn(),
    count: vitest.fn(),
  },
  productVariant: {
    create: vitest.fn(),
    update: vitest.fn(),
    deleteMany: vitest.fn(),
    findUnique: vitest.fn(),
    findMany: vitest.fn(),
  },
  category: {
    findUnique: vitest.fn(),
  },
  brand: {
    findUnique: vitest.fn(),
  },
  orderItem: {
    findMany: vitest.fn(),
    count: vitest.fn(),
  },
  stockMovement: {
    create: vitest.fn(),
  },
  auditLog: {
    create: vitest.fn(),
  },
  $transaction: vitest.fn(
    async <T>(fn: (tx: unknown) => T | Promise<T>): Promise<T> =>
      fn(mockPrisma as unknown as Parameters<typeof fn>[0]),
  ),
} as const;

export type MockPrismaTransactionClient = typeof mockPrisma;
