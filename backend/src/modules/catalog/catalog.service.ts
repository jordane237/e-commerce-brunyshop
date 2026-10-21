import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/database.module';
import { AuditLogService } from '../audit/audit.service';
import type { CreateProductDto } from './dto/create-product.dto';
import type { ListProductsDto } from './dto/list-products.dto';

const productSelection = {
  id: true,
  name: true,
  slug: true,
  description: true,
  basePrice: true,
  promoPrice: true,
  promoStart: true,
  promoEnd: true,
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true, logo: true } },
  images: { orderBy: { position: 'asc' as const } },
  variants: {
    select: { id: true, sku: true, color: true, size: true, price: true, stock: true },
    orderBy: [{ color: 'asc' as const }, { size: 'asc' as const }],
  },
};

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async listProducts(query: ListProductsDto) {
    const clauses: Prisma.ProductWhereInput[] = [{ status: 'PUBLISHED', deletedAt: null }];
    if (query.category) {
      clauses.push({ category: { slug: query.category } });
    }
    if (query.q?.trim()) {
      clauses.push({
        OR: [
          { name: { contains: query.q.trim(), mode: 'insensitive' } },
          { description: { contains: query.q.trim(), mode: 'insensitive' } },
          { brand: { name: { contains: query.q.trim(), mode: 'insensitive' } } },
        ],
      });
    }
    if (query.size || query.color) {
      clauses.push({
        variants: {
          some: {
            ...(query.size ? { size: query.size } : {}),
            ...(query.color
              ? { color: { equals: query.color, mode: 'insensitive' as const } }
              : {}),
          },
        },
      });
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      clauses.push({
        basePrice: {
          ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
          ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
        },
      });
    }

    const where: Prisma.ProductWhereInput = { AND: clauses };
    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sort === 'price_asc'
        ? { basePrice: 'asc' }
        : query.sort === 'price_desc'
          ? { basePrice: 'desc' }
          : query.sort === 'name'
            ? { name: 'asc' }
            : { createdAt: 'desc' };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        select: productSelection,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    };
  }

  async getProduct(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: 'PUBLISHED', deletedAt: null },
      select: productSelection,
    });
    if (!product) throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND' });
    return product;
  }

  listCategories() {
    return this.prisma.category.findMany({
      where: {
        OR: [
          { products: { some: { status: 'PUBLISHED', deletedAt: null } } },
          {
            children: {
              some: { products: { some: { status: 'PUBLISHED', deletedAt: null } } },
            },
          },
        ],
      },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        position: true,
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          where: { products: { some: { status: 'PUBLISHED', deletedAt: null } } },
          orderBy: [{ position: 'asc' }, { name: 'asc' }],
          select: { id: true, name: true, slug: true, position: true },
        },
      },
    });
  }

  async createProduct(dto: CreateProductDto, userId: string, ip?: string) {
    return this.prisma.$transaction(async (transaction) => {
      const product = await transaction.product.create({
        data: {
          name: dto.name.trim(),
          slug: dto.slug,
          description: dto.description.trim(),
          categoryId: dto.categoryId,
          brandId: dto.brandId,
          basePrice: dto.basePrice,
          status: 'DRAFT',
          variants: {
            create: dto.variants.map((variant) => ({
              sku: variant.sku.trim(),
              color: variant.color.trim(),
              size: variant.size.trim(),
              price: variant.price,
              stock: variant.stock,
            })),
          },
        },
        select: productSelection,
      });
      await this.auditLog.record(transaction, {
        userId,
        action: 'catalog.product.create',
        entity: 'Product',
        entityId: product.id,
        ip,
        after: { slug: product.slug, name: product.name, status: 'DRAFT' },
      });
      return product;
    });
  }
}
