import { Prisma } from '../../../generated/prisma/client';
import { resolvePrice } from '../../../common/pricing/product-pricing';
import type { AdminProductDetailDto } from './dto/admin-product-detail.dto';

export const adminProductInclude = {
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true, logo: true } },
  variants: { orderBy: [{ color: 'asc' as const }, { size: 'asc' as const }] },
  images: { orderBy: [{ position: 'asc' as const }, { createdAt: 'asc' as const }] },
} satisfies Prisma.ProductInclude;

export type AdminProductRow = Prisma.ProductGetPayload<{ include: typeof adminProductInclude }>;

export function toAdminProductDetail(
  product: AdminProductRow,
  at: Date = new Date(),
): AdminProductDetailDto {
  const { unitPrice } = resolvePrice(product, { price: null }, at);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    status: product.status,
    basePrice: product.basePrice,
    promoPrice: product.promoPrice,
    promoStart: product.promoStart?.toISOString() ?? null,
    promoEnd: product.promoEnd?.toISOString() ?? null,
    effectivePrice: unitPrice,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    categoryId: product.categoryId,
    brandId: product.brandId,
    category: product.category,
    brand: product.brand,
    deletedAt: product.deletedAt?.toISOString() ?? null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      color: variant.color,
      size: variant.size,
      price: variant.price,
      stock: variant.stock,
      reservedStock: variant.reservedStock,
      lowStockThreshold: variant.lowStockThreshold,
      version: variant.version,
    })),
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
      position: image.position,
      variantColor: image.variantColor,
    })),
  };
}
