import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Prisma } from '../../../generated/prisma/client';
import { resolvePrice } from '../../../common/pricing/product-pricing';
import { PrismaService } from '../../../infrastructure/database/database.module';
import { CatalogCacheService } from '../cache/catalog-cache.service';
import type { ColorVariantDto } from '../dto/color-variant.dto';
import type { ProductDetailDto } from '../dto/product-detail.dto';
import type { ProductImageDto } from '../dto/product-image.dto';
import type { ProductSummaryDto } from '../dto/product-summary.dto';
import type { ProductVariantDto } from '../dto/product-variant.dto';
import type { SizeVariantDto } from '../dto/size-variant.dto';

// Everything the product page needs, in one round trip: relations are selected
// with the product, so there is no N+1.
const detailSelection = {
  id: true,
  name: true,
  slug: true,
  description: true,
  seoTitle: true,
  seoDescription: true,
  categoryId: true,
  basePrice: true,
  promoPrice: true,
  promoStart: true,
  promoEnd: true,
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true, logo: true } },
  images: {
    orderBy: [{ variantColor: 'asc' as const }, { position: 'asc' as const }],
    select: { id: true, url: true, alt: true, position: true, variantColor: true },
  },
  variants: {
    orderBy: [{ color: 'asc' as const }, { size: 'asc' as const }],
    select: {
      id: true,
      sku: true,
      size: true,
      color: true,
      price: true,
      stock: true,
      reservedStock: true,
      lowStockThreshold: true,
    },
  },
} satisfies Prisma.ProductSelect;

const summarySelection = {
  id: true,
  name: true,
  slug: true,
  basePrice: true,
  promoPrice: true,
  promoStart: true,
  promoEnd: true,
  createdAt: true,
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true, logo: true } },
  images: {
    orderBy: { position: 'asc' as const },
    take: 1,
    select: { id: true, url: true, alt: true, position: true, variantColor: true },
  },
  variants: { select: { stock: true, reservedStock: true } },
} satisfies Prisma.ProductSelect;

type DetailProduct = Prisma.ProductGetPayload<{ select: typeof detailSelection }>;
type SummaryProduct = Prisma.ProductGetPayload<{ select: typeof summarySelection }>;
type ImageRow = DetailProduct['images'][number];
type VariantRow = DetailProduct['variants'][number];

// Shared shape of the detail row and the summary row: everything a product card
// needs, without the fields only the detail query loads.
type SummarySource = Pick<
  SummaryProduct,
  | 'id'
  | 'name'
  | 'slug'
  | 'basePrice'
  | 'promoPrice'
  | 'promoStart'
  | 'promoEnd'
  | 'category'
  | 'brand'
  | 'images'
  | 'variants'
>;

const PRICE_WINDOW_LOW = 0.5;
const PRICE_WINDOW_HIGH = 1.5;

function availableStock(variant: { stock: number; reservedStock: number }): number {
  // CA #2: what can still be sold, never the raw physical stock.
  return Math.max(0, variant.stock - variant.reservedStock);
}

function toIso(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}

// "NOIR" -> "noir", "Chaussures de ville" -> "chaussures-de-ville".
function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function compareSizes(left: string, right: string): number {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (Number.isNaN(leftNumber) || Number.isNaN(rightNumber)) {
    return left.localeCompare(right);
  }
  return leftNumber - rightNumber;
}

function toImage(image: ImageRow): ProductImageDto {
  return {
    id: image.id,
    url: image.url,
    alt: image.alt,
    position: image.position,
    variantColor: image.variantColor,
  };
}

@Injectable()
export class ProductDetailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CatalogCacheService,
    private readonly config: ConfigService,
  ) {}

  async getProductDetail(slug: string): Promise<ProductDetailDto> {
    const cached = await this.cache.getProductDetail(slug);
    if (cached !== null) return cached;

    // Published + not soft-deleted in the WHERE clause: an unknown slug, a
    // DRAFT, an ARCHIVED and a soft-deleted product all return null and share
    // the exact same 404 (CA #4 — the real status is never revealed).
    const product = await this.prisma.product.findFirst({
      where: { slug, status: 'PUBLISHED', deletedAt: null },
      select: detailSelection,
    });
    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Produit introuvable.',
      });
    }

    const now = new Date();
    const effectivePrice = resolvePrice(product, { price: null }, now).unitPrice;
    const similarProducts = await this.getSimilarProducts(product, effectivePrice, now);
    const detail = this.toDetail(product, similarProducts, now);

    await this.cache.setProductDetail(slug, detail);
    return detail;
  }

  // Same category, current product excluded, effective price within ±50 %.
  // `basePrice` pre-filters in SQL, then rows are ranked by distance to the
  // current effective price (a promo price is not comparable in SQL without a
  // raw expression, and the row count stays small). When the window is empty,
  // fall back to the latest products of the category.
  private async getSimilarProducts(
    product: DetailProduct,
    effectivePrice: number,
    now: Date,
  ): Promise<ProductSummaryDto[]> {
    const limit = Number(this.config.get<number>('app.catalog.similarProductsLimit') ?? 6);
    const minPrice = Math.max(0, Math.floor(effectivePrice * PRICE_WINDOW_LOW));
    const maxPrice = Math.ceil(effectivePrice * PRICE_WINDOW_HIGH);

    const commonWhere: Prisma.ProductWhereInput = {
      id: { not: product.id },
      categoryId: product.categoryId,
      status: 'PUBLISHED',
      deletedAt: null,
    };

    // A product can enter the window through its base price or through an
    // active promo price, so both columns are pre-filtered in SQL. The exact
    // effective price is then checked in memory (a promo is only active inside
    // its date window, which SQL cannot express without a raw expression).
    const inWindow = await this.prisma.product.findMany({
      where: {
        ...commonWhere,
        OR: [
          { basePrice: { gte: minPrice, lte: maxPrice } },
          { promoPrice: { not: null, gte: minPrice, lte: maxPrice } },
        ],
      },
      select: summarySelection,
      orderBy: { createdAt: 'desc' },
      take: limit * 2,
    });
    const decorate = (row: SummaryProduct) => ({
      row,
      price: resolvePrice(row, { price: null }, now).unitPrice,
    });
    const inWindowRows = inWindow
      .map(decorate)
      .filter(({ price }) => price >= minPrice && price <= maxPrice);
    const rows =
      inWindowRows.length > 0
        ? inWindowRows
        : (
            await this.prisma.product.findMany({
              where: commonWhere,
              select: summarySelection,
              orderBy: { createdAt: 'desc' },
              take: limit,
            })
          ).map(decorate);

    return rows
      .map(({ row, price }) => ({ row, distance: Math.abs(price - effectivePrice) }))
      .sort(
        (left, right) =>
          left.distance - right.distance ||
          right.row.createdAt.getTime() - left.row.createdAt.getTime(),
      )
      .slice(0, limit)
      .map(({ row }) => this.toSummary(row, now));
  }

  private toDetail(
    product: DetailProduct,
    similarProducts: ProductSummaryDto[],
    now: Date,
  ): ProductDetailDto {
    const variants: ProductVariantDto[] = product.variants.map((variant) => {
      const available = availableStock(variant);
      return {
        id: variant.id,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        effectivePrice: resolvePrice(product, variant, now).unitPrice,
        availableStock: available,
        isAvailable: available > 0,
      };
    });

    const summary = this.toSummary(product, now);

    return {
      ...summary,
      description: product.description,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      images: this.orderedImages(product.images),
      colors: this.groupColors(product),
      sizes: this.groupSizes(product.variants),
      variants,
      similarProducts,
    };
  }

  private toSummary(product: SummarySource, now: Date): ProductSummaryDto {
    const quote = resolvePrice(product, { price: null }, now);
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      basePrice: product.basePrice,
      effectivePrice: quote.unitPrice,
      // Only an active promotion is advertised, never a scheduled or expired one.
      promoPrice: quote.appliedPromo ? product.promoPrice : null,
      promoStart: toIso(product.promoStart),
      promoEnd: toIso(product.promoEnd),
      isPromoActive: quote.appliedPromo,
      inStock: product.variants.some((variant) => availableStock(variant) > 0),
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      },
      brand: {
        id: product.brand.id,
        name: product.brand.name,
        slug: product.brand.slug,
        logo: product.brand.logo,
      },
      images: product.images.map(toImage),
    };
  }

  // Shared images first (hero shot), then the colour-specific ones.
  private orderedImages(images: ImageRow[]): ProductImageDto[] {
    const common = images
      .filter((image) => image.variantColor === null)
      .sort((left, right) => left.position - right.position);
    const specific = images
      .filter((image) => image.variantColor !== null)
      .sort(
        (left, right) =>
          (left.variantColor ?? '').localeCompare(right.variantColor ?? '') ||
          left.position - right.position,
      );
    return [...common, ...specific].map(toImage);
  }

  // CA #1: each colour carries its own images (specific + shared) and the sizes
  // still available in that colour.
  private groupColors(product: DetailProduct): ColorVariantDto[] {
    const images = this.orderedImages(product.images);
    const colors = [...new Set(product.variants.map((variant) => variant.color))];

    return colors
      .sort((left, right) => left.localeCompare(right))
      .map((color) => {
        const normalized = color.toLowerCase();
        const specificImages = images.filter(
          (image) => image.variantColor !== null && image.variantColor.toLowerCase() === normalized,
        );
        const commonImages = images.filter((image) => image.variantColor === null);
        const availableSizes = [
          ...new Set(
            product.variants
              .filter((variant) => variant.color === color && availableStock(variant) > 0)
              .map((variant) => variant.size),
          ),
        ].sort(compareSizes);
        return {
          color,
          slug: toSlug(color),
          images: [...specificImages, ...commonImages],
          availableSizes,
          hasStock: availableSizes.length > 0,
        };
      });
  }

  // Size aggregate across colours: the size selector is global on P04, so it
  // shows the best availability of that size whatever the colour.
  private groupSizes(variants: VariantRow[]): SizeVariantDto[] {
    const bySize = new Map<string, { available: number; threshold: number }>();
    for (const variant of variants) {
      const available = availableStock(variant);
      const current = bySize.get(variant.size);
      if (current === undefined) {
        bySize.set(variant.size, { available, threshold: variant.lowStockThreshold });
      } else {
        current.available = Math.max(current.available, available);
        current.threshold = Math.min(current.threshold, variant.lowStockThreshold);
      }
    }

    return [...bySize.entries()]
      .sort(([left], [right]) => compareSizes(left, right))
      .map(([size, entry]) => ({
        size,
        availableStock: entry.available,
        isAvailable: entry.available > 0,
        isLowStock: entry.available > 0 && entry.available <= entry.threshold,
      }));
  }
}
