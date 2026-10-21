import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../infrastructure/database/database.module';
import { CatalogService } from './catalog.service';
import type { ListProductsDto } from './dto/list-products.dto';

function makeService() {
  const prisma = {
    $transaction: vi.fn(),
    product: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
    category: { findMany: vi.fn() },
  };
  return {
    service: new CatalogService(prisma as unknown as PrismaService, { record: vi.fn() }),
    prisma,
  };
}

describe('CatalogService', () => {
  it('pagine et combine les filtres de catalogue côté base', async () => {
    const { service, prisma } = makeService();
    prisma.product.findMany.mockResolvedValue([]);
    prisma.product.count.mockResolvedValue(0);
    prisma.$transaction.mockResolvedValue([[], 0]);

    await service.listProducts({
      page: 2,
      limit: 8,
      category: 'sneakers',
      size: '42',
      color: 'Noir',
      minPrice: 10000,
      maxPrice: 50000,
      sort: 'price_asc',
      q: 'urbain',
    } as ListProductsDto);

    const itemsQuery = prisma.product.findMany.mock.calls[0]?.[0] as {
      where: unknown;
      skip: number;
      take: number;
      orderBy: unknown;
    };
    const countQuery = prisma.product.count.mock.calls[0]?.[0] as { where: unknown };
    expect(itemsQuery.skip).toBe(8);
    expect(itemsQuery.take).toBe(8);
    expect(itemsQuery.orderBy).toEqual({ basePrice: 'asc' });
    expect(itemsQuery.where).toEqual(countQuery.where);
    expect(JSON.stringify(itemsQuery.where)).toContain('PUBLISHED');
    expect(JSON.stringify(itemsQuery.where)).toContain('sneakers');
    expect(JSON.stringify(itemsQuery.where)).toContain('Noir');
    expect(JSON.stringify(itemsQuery.where)).toContain('urbain');
  });

  it('ne publie pas les produits brouillon par leur slug', async () => {
    const { service, prisma } = makeService();
    prisma.product.findFirst.mockResolvedValue(null);

    await expect(service.getProduct('produit-prive')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'produit-prive', status: 'PUBLISHED', deletedAt: null },
      }),
    );
  });
});
