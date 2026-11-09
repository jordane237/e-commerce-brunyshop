import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { isPromoActive } from '../../common/pricing/product-pricing';
import { PrismaService } from '../../infrastructure/database/database.module';
import { AuditLogService } from '../audit/audit.service';
import { CatalogCacheService } from './cache/catalog-cache.service';
import type { CreateProductDto } from './dto/create-product.dto';
import type {
  BrandFacetDto,
  ProductFacetsDto,
  ProductListResponseDto,
  ValueFacetDto,
} from './dto/product-list.dto';
import type { ListProductsDto } from './dto/list-products.dto';
import { toProductListItem } from './products/product-list.mapper';
import { availableStock } from './products/product-summary.mapper';

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

// Public list projection: carries reservedStock so the response can expose the
// available quantity (CA #2) instead of the raw physical stock.
const listSelection = {
  id: true,
  name: true,
  slug: true,
  basePrice: true,
  promoPrice: true,
  promoStart: true,
  promoEnd: true,
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true, logo: true } },
  images: { orderBy: { position: 'asc' as const } },
  variants: {
    select: { id: true, sku: true, color: true, size: true, stock: true, reservedStock: true },
    orderBy: [{ color: 'asc' as const }, { size: 'asc' as const }],
  },
} satisfies Prisma.ProductSelect;

function compareSizes(left: string, right: string): number {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (Number.isNaN(leftNumber) || Number.isNaN(rightNumber)) {
    return left.localeCompare(right);
  }
  return leftNumber - rightNumber;
}

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly cache: CatalogCacheService,
  ) {}

  async listProducts(query: ListProductsDto): Promise<ProductListResponseDto> {
    const now = new Date();
    // Fixed key order: the cache key is a hash of this object.
    const normalized = {
      page: query.page,
      limit: query.limit,
      category: query.category,
      brand: query.brand,
      size: query.size,
      color: query.color,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      sort: query.sort,
      q: query.q,
      inStock: query.inStock,
      promo: query.promo,
    };
    const cached = await this.cache.getProductsList(normalized);
    if (cached !== null) return cached;

    const where = await this.buildListWhere(query, now);
    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sort === 'price_asc'
        ? { basePrice: 'asc' }
        : query.sort === 'price_desc'
          ? { basePrice: 'desc' }
          : query.sort === 'name'
            ? { name: 'asc' }
            : { createdAt: 'desc' };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        select: listSelection,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const response: ProductListResponseDto = {
      items: rows.map((row) => toProductListItem(row, now)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
      facets: await this.getFacets(now),
    };
    await this.cache.setProductsList(normalized, response);
    return response;
  }

  private async buildListWhere(
    query: ListProductsDto,
    now: Date,
  ): Promise<Prisma.ProductWhereInput> {
    const clauses: Prisma.ProductWhereInput[] = [{ status: 'PUBLISHED', deletedAt: null }];
    if (query.category) {
      clauses.push({ category: { slug: query.category } });
    }
    if (query.brand) {
      clauses.push({ brand: { slug: query.brand } });
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
    // Availability is stock - reservedStock: Prisma cannot compare two columns,
    // so the ids are resolved with one parameterized SQL query.
    if (query.size || query.color) {
      clauses.push({
        id: { in: await this.availableProductIds({ size: query.size, color: query.color }) },
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
    if (query.inStock !== undefined) {
      const availableIds = await this.availableProductIds();
      clauses.push(
        query.inStock === 'true' ? { id: { in: availableIds } } : { id: { notIn: availableIds } },
      );
    }
    if (query.promo !== undefined) {
      const activePromo: Prisma.ProductWhereInput = {
        promoPrice: { not: null },
        promoStart: { lte: now },
        promoEnd: { gte: now },
      };
      clauses.push(query.promo === 'true' ? activePromo : { NOT: activePromo });
    }
    return { AND: clauses };
  }

  // Ids of published products having at least one variant with
  // stock > reservedStock (optionally for a given size / colour).
  private async availableProductIds(
    filters: {
      size?: string;
      color?: string;
    } = {},
  ): Promise<string[]> {
    const conditions = [Prisma.sql`v."productId" = p.id`, Prisma.sql`v.stock > v."reservedStock"`];
    if (filters.size) conditions.push(Prisma.sql`v.size = ${filters.size}`);
    if (filters.color) conditions.push(Prisma.sql`lower(v.color) = lower(${filters.color})`);
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT p.id
      FROM "Product" p
      WHERE p.status = 'PUBLISHED'
        AND p."deletedAt" IS NULL
        AND EXISTS (
          SELECT 1
          FROM "ProductVariant" v
          WHERE ${Prisma.join(conditions, ' AND ')}
        )
    `);
    return rows.map((row) => row.id);
  }

  // Facets describe the whole published catalogue, independently of the active
  // filters (documented choice): a selected value keeps its own facet visible.
  private async getFacets(now: Date): Promise<ProductFacetsDto> {
    const cached = await this.cache.getProductsFacets();
    if (cached !== null) return cached;

    const rows = await this.prisma.product.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      select: {
        id: true,
        basePrice: true,
        promoPrice: true,
        promoStart: true,
        promoEnd: true,
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        variants: { select: { size: true, color: true, stock: true, reservedStock: true } },
      },
    });

    const categories = new Map<string, { id: string; name: string; slug: string; count: number }>();
    const brands = new Map<string, BrandFacetDto>();
    const sizes = new Map<string, Set<string>>();
    const colors = new Map<string, Set<string>>();
    let inStock = 0;
    let activePromos = 0;
    let minPrice = Number.POSITIVE_INFINITY;
    let maxPrice = 0;

    for (const row of rows) {
      minPrice = Math.min(minPrice, row.basePrice);
      maxPrice = Math.max(maxPrice, row.basePrice);
      const category = categories.get(row.category.id) ?? { ...row.category, count: 0 };
      category.count += 1;
      categories.set(row.category.id, category);
      const brand = brands.get(row.brand.id) ?? {
        id: row.brand.id,
        name: row.brand.name,
        slug: row.brand.slug,
        count: 0,
      };
      brand.count += 1;
      brands.set(row.brand.id, brand);
      if (row.variants.some((variant) => availableStock(variant) > 0)) inStock += 1;
      if (isPromoActive(row, now)) activePromos += 1;
      for (const variant of row.variants) {
        if (availableStock(variant) <= 0) continue;
        let sizeIds = sizes.get(variant.size);
        if (!sizeIds) {
          sizeIds = new Set<string>();
          sizes.set(variant.size, sizeIds);
        }
        sizeIds.add(row.id);
        let colorIds = colors.get(variant.color);
        if (!colorIds) {
          colorIds = new Set<string>();
          colors.set(variant.color, colorIds);
        }
        colorIds.add(row.id);
      }
    }

    const toValueFacets = (
      values: Map<string, Set<string>>,
      compare: (a: string, b: string) => number,
    ): ValueFacetDto[] =>
      [...values.entries()]
        .map(([value, productIds]) => ({ value, count: productIds.size }))
        .sort((left, right) => compare(left.value, right.value));

    const facets: ProductFacetsDto = {
      categories: [...categories.values()].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
      brands: [...brands.values()].sort((left, right) => left.name.localeCompare(right.name)),
      sizes: toValueFacets(sizes, compareSizes),
      colors: toValueFacets(colors, (left, right) => left.localeCompare(right)),
      availability: { inStock, outOfStock: rows.length - inStock },
      promotion: { active: activePromos, inactive: rows.length - activePromos },
      price: {
        min: Number.isFinite(minPrice) ? minPrice : 0,
        max: maxPrice,
      },
    };
    await this.cache.setProductsFacets(facets);
    return facets;
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
            })),
          },
        },
      });
      await this.auditLog.record(transaction, {
        userId,
        action: 'PRODUCT_CREATED',
        entity: 'Product',
        entityId: product.id,
        ip,
      });
      return product;
    });
  }

  async updateProduct(dto: CreateProductDto, slug: string, userId: string, ip?: string) {
    const result = await this.prisma.$transaction(async (transaction) => {
      const product = await transaction.product.update({
        where: { slug },
        data: {
          name: dto.name.trim(),
          slug: dto.slug,
          description: dto.description.trim(),
          categoryId: dto.categoryId,
          brandId: dto.brandId,
          basePrice: dto.basePrice,
          status: 'DRAFT',
          variants: {
            deleteMany: {},
            create: dto.variants.map((variant) => ({
              sku: variant.sku.trim(),
              color: variant.color.trim(),
              size: variant.size.trim(),
              price: variant.price,
            })),
          },
        },
        select: productSelection,
      });
      await this.auditLog.record(transaction, {
        userId,
        action: 'PRODUCT_UPDATED',
        entity: 'Product',
        entityId: product.id,
        ip,
      });
      return product;
    });
    // The update sets the product back to DRAFT and rewrites its variants: the
    // cached detail must not survive it.
    await this.cache.invalidateProducts();
    return result;
  }
}
