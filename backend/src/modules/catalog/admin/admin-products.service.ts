// admin-products.service.ts
// Mutations admin du catalogue (CAT-04) : création, mise à jour, archivage,
// remplacement des variantes et duplication.
//
// Règles structurantes :
//   - chaque mutation multi-entités est atomique (prisma.$transaction) ;
//   - l'audit (AUT-08) est écrit DANS la même transaction ;
//   - le cache public est invalidé après chaque mutation réussie ;
//   - reservedStock n'est jamais modifiable ; seul stock l'est (et laisse une
//     trace StockMovement ADJUSTMENT + audit).

import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/database.module';
import { AuditLogService } from '../../audit/audit.service';
import { CatalogCacheService } from '../cache/catalog-cache.service';
import {
  adminProductInclude,
  toAdminProductDetail,
  type AdminProductRow,
} from './admin-product.mapper';
import { CATALOG_AUDIT_ACTIONS as ACTIONS } from './catalog-audit.actions';
import type { AdminProductDetailDto } from './dto/admin-product-detail.dto';
import type {
  CreateProductDto,
  CreateProductVariantDto,
  ProductStatusValue,
} from './dto/create-product.dto';
import type { DuplicateProductDto } from './dto/duplicate-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import type { UpdateVariantsDto } from './dto/update-variants.dto';
import { SkuGeneratorService, variantKey } from './sku/sku-generator.service';
import { SlugGeneratorService } from './slug/slug-generator.service';

export interface CatalogActor {
  userId: string;
  ip?: string;
  userAgent?: string;
}

interface NormalizedVariant {
  color: string;
  size: string;
  price: number | null;
  stock: number;
  lowStockThreshold: number;
}

interface AuditEventInput {
  action: string;
  entity: string;
  entityId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
}

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

// Les couleurs/pointures existantes sont en majuscules (seed TEC-07) : on
// normalise toute saisie admin pour ne pas fragmenter les facettes publiques.
function normalizeLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function sameDate(left: Date | null, right: Date | null): boolean {
  return (left?.getTime() ?? null) === (right?.getTime() ?? null);
}

@Injectable()
export class AdminProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly cache: CatalogCacheService,
    private readonly slugGenerator: SlugGeneratorService,
    private readonly skuGenerator: SkuGeneratorService,
  ) {}

  async create(dto: CreateProductDto, actor: CatalogActor): Promise<AdminProductDetailDto> {
    const variants = this.resolveCreateVariants(dto);
    const status: ProductStatusValue = dto.status ?? 'DRAFT';
    const promoStart = dto.promoStart ? new Date(dto.promoStart) : null;
    const promoEnd = dto.promoEnd ? new Date(dto.promoEnd) : null;

    this.assertPromoRules(dto.basePrice, dto.promoPrice ?? null, promoStart, promoEnd);
    if (status === 'PUBLISHED') this.assertHasStock(variants);

    const { category, brand } = await this.assertRelations(dto.categoryId, dto.brandId);
    const slug = dto.slug
      ? await this.assertSlugFree(dto.slug)
      : await this.slugGenerator.generateUniqueSlug(dto.name);
    const skus = await this.skuGenerator.generateSkusForProduct(brand.slug, slug, variants);

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            name: dto.name.trim(),
            slug,
            description: dto.description.trim(),
            categoryId: category.id,
            brandId: brand.id,
            status,
            basePrice: dto.basePrice,
            promoPrice: dto.promoPrice ?? null,
            promoStart,
            promoEnd,
            seoTitle: dto.seoTitle?.trim() ?? null,
            seoDescription: dto.seoDescription?.trim() ?? null,
            variants: {
              create: variants.map((variant) => ({
                sku: this.requireSku(skus, variant),
                color: variant.color,
                size: variant.size,
                price: variant.price,
                stock: variant.stock,
                lowStockThreshold: variant.lowStockThreshold,
              })),
            },
            ...(dto.images && dto.images.length > 0
              ? {
                  images: {
                    create: dto.images.map((image, index) => ({
                      url: image.url,
                      alt: image.alt ?? null,
                      position: image.position ?? index,
                      variantColor: image.variantColor ? normalizeLabel(image.variantColor) : null,
                    })),
                  },
                }
              : {}),
          },
          include: adminProductInclude,
        });
        await this.audit(tx, actor, {
          action: ACTIONS.PRODUCT_CREATED,
          entity: 'Product',
          entityId: product.id,
          after: this.snapshot(product),
        });
        return product;
      });

      await this.cache.invalidateProducts();
      return toAdminProductDetail(created);
    } catch (error) {
      this.rethrowWriteError(error);
    }
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    actor: CatalogActor,
  ): Promise<AdminProductDetailDto> {
    const existing = await this.findProductOrThrow(id);

    const basePrice = dto.basePrice ?? existing.basePrice;
    const promoPrice = dto.promoPrice ?? existing.promoPrice;
    const promoStart = dto.promoStart ? new Date(dto.promoStart) : existing.promoStart;
    const promoEnd = dto.promoEnd ? new Date(dto.promoEnd) : existing.promoEnd;
    const status: ProductStatusValue = dto.status ?? existing.status;

    this.assertPromoRules(basePrice, promoPrice, promoStart, promoEnd);
    if (status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      this.assertHasStock(existing.variants);
    }
    if (dto.categoryId !== undefined || dto.brandId !== undefined) {
      await this.assertRelations(
        dto.categoryId ?? existing.categoryId,
        dto.brandId ?? existing.brandId,
      );
    }

    const slug =
      dto.slug !== undefined && dto.slug !== existing.slug
        ? await this.assertSlugFree(dto.slug, id)
        : existing.slug;

    const name = dto.name?.trim() ?? existing.name;
    const description = dto.description?.trim() ?? existing.description;
    const seoTitle = dto.seoTitle?.trim() ?? existing.seoTitle;
    const seoDescription = dto.seoDescription?.trim() ?? existing.seoDescription;

    const priceChanged =
      basePrice !== existing.basePrice ||
      promoPrice !== existing.promoPrice ||
      !sameDate(promoStart, existing.promoStart) ||
      !sameDate(promoEnd, existing.promoEnd);
    const statusChanged = status !== existing.status;
    const coreChanged =
      name !== existing.name ||
      description !== existing.description ||
      slug !== existing.slug ||
      seoTitle !== existing.seoTitle ||
      seoDescription !== existing.seoDescription ||
      (dto.categoryId !== undefined && dto.categoryId !== existing.categoryId) ||
      (dto.brandId !== undefined && dto.brandId !== existing.brandId);

    if (!priceChanged && !statusChanged && !coreChanged) {
      return toAdminProductDetail(existing);
    }

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.update({
          where: { id },
          data: {
            name,
            slug,
            description,
            categoryId: dto.categoryId ?? existing.categoryId,
            brandId: dto.brandId ?? existing.brandId,
            status,
            basePrice,
            promoPrice,
            promoStart,
            promoEnd,
            seoTitle,
            seoDescription,
          },
          include: adminProductInclude,
        });

        if (priceChanged) {
          await this.audit(tx, actor, {
            action: ACTIONS.PRODUCT_PRICE_UPDATED,
            entity: 'Product',
            entityId: id,
            before: {
              basePrice: existing.basePrice,
              promoPrice: existing.promoPrice,
              promoStart: existing.promoStart?.toISOString() ?? null,
              promoEnd: existing.promoEnd?.toISOString() ?? null,
            },
            after: {
              basePrice,
              promoPrice,
              promoStart: promoStart?.toISOString() ?? null,
              promoEnd: promoEnd?.toISOString() ?? null,
            },
          });
        }
        if (statusChanged) {
          await this.audit(tx, actor, {
            action: ACTIONS.PRODUCT_STATUS_UPDATED,
            entity: 'Product',
            entityId: id,
            before: { status: existing.status },
            after: { status },
          });
        }
        if (coreChanged) {
          await this.audit(tx, actor, {
            action: ACTIONS.PRODUCT_UPDATED,
            entity: 'Product',
            entityId: id,
            before: { name: existing.name, slug: existing.slug },
            after: { name, slug },
          });
        }
        return product;
      });

      await this.cache.invalidateProducts();
      return toAdminProductDetail(updated);
    } catch (error) {
      this.rethrowWriteError(error);
    }
  }

  async archive(id: string, actor: CatalogActor): Promise<void> {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (existing === null) this.throwProductNotFound();
    if (existing.status === 'ARCHIVED') return;

    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: { status: 'ARCHIVED' } });
      await this.audit(tx, actor, {
        action: ACTIONS.PRODUCT_ARCHIVED,
        entity: 'Product',
        entityId: id,
        before: { status: existing.status },
        after: { status: 'ARCHIVED' },
      });
    });
    await this.cache.invalidateProducts();
  }

  async replaceVariants(
    id: string,
    dto: UpdateVariantsDto,
    actor: CatalogActor,
  ): Promise<AdminProductDetailDto> {
    const product = await this.findProductOrThrow(id);
    const existingById = new Map(product.variants.map((variant) => [variant.id, variant]));

    const payloadIds = new Set<string>();
    for (const variant of dto.variants) {
      if (variant.id === undefined) continue;
      if (!existingById.has(variant.id)) {
        throw new BadRequestException({
          code: 'VARIANT_NOT_OWNED',
          message: `La variante ${variant.id} n'appartient pas à ce produit.`,
        });
      }
      if (payloadIds.has(variant.id)) {
        throw new BadRequestException({
          code: 'DUPLICATE_VARIANT',
          message: 'Une même variante est présente deux fois dans la requête.',
        });
      }
      payloadIds.add(variant.id);
    }

    const variants = dto.variants.map((variant) => {
      if ((variant as { reservedStock?: unknown }).reservedStock !== undefined) {
        throw new BadRequestException({
          code: 'RESERVED_STOCK_FORBIDDEN',
          message: 'reservedStock n’est pas modifiable manuellement.',
        });
      }
      return {
        id: variant.id,
        color: normalizeLabel(variant.color),
        size: normalizeLabel(variant.size),
        price: variant.price,
        stock: variant.stock,
        lowStockThreshold: variant.lowStockThreshold,
      };
    });
    this.assertUniqueLabels(variants);

    const removals = product.variants.filter((variant) => !payloadIds.has(variant.id));
    if (removals.length > 0) {
      const linked = await this.prisma.orderItem.findMany({
        where: { variantId: { in: removals.map((variant) => variant.id) } },
        select: { variantId: true },
        distinct: ['variantId'],
      });
      if (linked.length > 0) {
        const skus = removals
          .filter((variant) => linked.some((row) => row.variantId === variant.id))
          .map((variant) => variant.sku);
        throw new ConflictException({
          code: 'VARIANT_HAS_ORDERS',
          message: `Variante(s) liée(s) à une commande, suppression refusée : ${skus.join(', ')}.`,
        });
      }
    }

    const creations = variants.filter((variant) => variant.id === undefined);
    const skus =
      creations.length > 0
        ? await this.skuGenerator.generateSkusForProduct(
            product.brand.slug,
            product.slug,
            creations,
          )
        : new Map<string, string>();

    try {
      await this.prisma.$transaction(async (tx) => {
        if (removals.length > 0) {
          await tx.productVariant.deleteMany({
            where: { id: { in: removals.map((variant) => variant.id) } },
          });
        }

        for (const variant of variants) {
          if (variant.id === undefined) {
            await tx.productVariant.create({
              data: {
                productId: id,
                sku: this.requireSku(skus, variant),
                color: variant.color,
                size: variant.size,
                price: variant.price ?? null,
                stock: variant.stock,
                lowStockThreshold: variant.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD,
              },
            });
            continue;
          }

          const before = existingById.get(variant.id);
          if (before === undefined) {
            throw new BadRequestException({
              code: 'VARIANT_NOT_OWNED',
              message: `La variante ${variant.id} n'appartient pas à ce produit.`,
            });
          }
          const stockChanged = variant.stock !== before.stock;
          const priceChanged = variant.price !== undefined && variant.price !== before.price;

          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              color: variant.color,
              size: variant.size,
              stock: variant.stock,
              ...(variant.price !== undefined ? { price: variant.price } : {}),
              ...(variant.lowStockThreshold !== undefined
                ? { lowStockThreshold: variant.lowStockThreshold }
                : {}),
              ...(stockChanged ? { version: { increment: 1 } } : {}),
            },
          });

          if (stockChanged) {
            await tx.stockMovement.create({
              data: {
                variantId: variant.id,
                delta: variant.stock - before.stock,
                reason: 'ADJUSTMENT',
                userId: actor.userId,
                before: before.stock,
                after: variant.stock,
              },
            });
            await this.audit(tx, actor, {
              action: ACTIONS.PRODUCT_STOCK_UPDATED,
              entity: 'ProductVariant',
              entityId: variant.id,
              before: { sku: before.sku, stock: before.stock },
              after: { sku: before.sku, stock: variant.stock },
            });
          }
          if (priceChanged) {
            await this.audit(tx, actor, {
              action: ACTIONS.PRODUCT_PRICE_UPDATED,
              entity: 'ProductVariant',
              entityId: variant.id,
              before: { sku: before.sku, price: before.price },
              after: { sku: before.sku, price: variant.price ?? null },
            });
          }
        }

        await this.audit(tx, actor, {
          action: ACTIONS.PRODUCT_VARIANTS_UPDATED,
          entity: 'Product',
          entityId: id,
          before: {
            variants: product.variants.map((variant) => ({
              id: variant.id,
              sku: variant.sku,
              stock: variant.stock,
              price: variant.price,
            })),
          },
          after: {
            variants: variants.map((variant) => ({
              id: variant.id ?? null,
              color: variant.color,
              size: variant.size,
              stock: variant.stock,
              price: variant.price ?? null,
            })),
          },
        });
      });

      await this.cache.invalidateProducts();
      const refreshed = await this.prisma.product.findUniqueOrThrow({
        where: { id },
        include: adminProductInclude,
      });
      return toAdminProductDetail(refreshed);
    } catch (error) {
      this.rethrowWriteError(error);
    }
  }

  async duplicate(
    id: string,
    dto: DuplicateProductDto,
    actor: CatalogActor,
  ): Promise<AdminProductDetailDto> {
    const source = await this.findProductOrThrow(id);
    if (dto.status !== undefined && dto.status !== 'DRAFT') {
      throw new BadRequestException({
        code: 'DUPLICATE_STATUS_FORBIDDEN',
        message: 'Une copie est toujours créée en brouillon (DRAFT).',
      });
    }

    const name = dto.name?.trim() || `${source.name} (copie)`;
    const slug = dto.slug
      ? await this.assertSlugFree(dto.slug)
      : await this.slugGenerator.generateUniqueSlug(name);
    const copyVariants = dto.copyVariants ?? true;
    const copyImages = dto.copyImages ?? true;
    const resetStock = dto.resetStock ?? false;

    const variants = copyVariants
      ? source.variants.map((variant) => ({
          color: variant.color,
          size: variant.size,
          price: variant.price,
          stock: resetStock ? 0 : variant.stock,
          lowStockThreshold: variant.lowStockThreshold,
        }))
      : [];
    const skus =
      variants.length > 0
        ? await this.skuGenerator.generateSkusForProduct(source.brand.slug, slug, variants)
        : new Map<string, string>();

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            name,
            slug,
            description: source.description,
            categoryId: source.categoryId,
            brandId: source.brandId,
            status: 'DRAFT',
            basePrice: source.basePrice,
            promoPrice: source.promoPrice,
            promoStart: source.promoStart,
            promoEnd: source.promoEnd,
            seoTitle: source.seoTitle,
            seoDescription: source.seoDescription,
            ...(variants.length > 0
              ? {
                  variants: {
                    create: variants.map((variant) => ({
                      sku: this.requireSku(skus, variant),
                      color: variant.color,
                      size: variant.size,
                      price: variant.price,
                      stock: variant.stock,
                      lowStockThreshold: variant.lowStockThreshold,
                    })),
                  },
                }
              : {}),
            ...(copyImages && source.images.length > 0
              ? {
                  images: {
                    create: source.images.map((image) => ({
                      url: image.url,
                      alt: image.alt,
                      position: image.position,
                      variantColor: image.variantColor,
                    })),
                  },
                }
              : {}),
          },
          include: adminProductInclude,
        });
        await this.audit(tx, actor, {
          action: ACTIONS.PRODUCT_DUPLICATED,
          entity: 'Product',
          entityId: product.id,
          before: { sourceId: source.id, sourceSlug: source.slug },
          after: {
            sourceId: source.id,
            name: product.name,
            slug: product.slug,
            status: product.status,
            variantCount: product.variants.length,
            imageCount: product.images.length,
          },
        });
        return product;
      });

      await this.cache.invalidateProducts();
      return toAdminProductDetail(created);
    } catch (error) {
      this.rethrowWriteError(error);
    }
  }

  // ---------------------------------------------------------------- helpers

  private async findProductOrThrow(id: string): Promise<AdminProductRow> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: adminProductInclude,
    });
    if (product === null) this.throwProductNotFound();
    return product;
  }

  private throwProductNotFound(): never {
    throw new NotFoundException({
      code: 'PRODUCT_NOT_FOUND',
      message: 'Produit introuvable.',
    });
  }

  private resolveCreateVariants(dto: CreateProductDto): NormalizedVariant[] {
    const hasExplicit = dto.variants !== undefined;
    const hasCartesian = dto.colors !== undefined || dto.sizes !== undefined;
    if (hasExplicit && hasCartesian) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Fournissez variants[] ou colors[]+sizes[], pas les deux.',
      });
    }

    let raw: CreateProductVariantDto[];
    if (hasExplicit) {
      raw = dto.variants ?? [];
    } else if (dto.colors !== undefined && dto.sizes !== undefined) {
      const colors = dto.colors;
      const sizes = dto.sizes;
      raw = colors.flatMap((color) => sizes.map((size) => ({ color, size, stock: 0 })));
    } else {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'variants[] ou colors[]+sizes[] est requis.',
      });
    }

    const variants = raw.map((variant) => ({
      color: normalizeLabel(variant.color),
      size: normalizeLabel(variant.size),
      price: variant.price ?? null,
      stock: variant.stock,
      lowStockThreshold: variant.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD,
    }));
    this.assertUniqueLabels(variants);
    return variants;
  }

  private assertUniqueLabels(variants: { color: string; size: string }[]): void {
    const seen = new Set<string>();
    for (const variant of variants) {
      const key = variantKey(variant.color, variant.size);
      if (seen.has(key)) {
        throw new BadRequestException({
          code: 'DUPLICATE_VARIANT',
          message: `Variante en doublon : ${variant.color} / ${variant.size}.`,
        });
      }
      seen.add(key);
    }
  }

  private assertPromoRules(
    basePrice: number,
    promoPrice: number | null,
    promoStart: Date | null,
    promoEnd: Date | null,
  ): void {
    if (promoPrice !== null && promoPrice >= basePrice) {
      throw new BadRequestException({
        code: 'PROMO_PRICE_INVALID',
        message: 'Le prix promotionnel doit être strictement inférieur au prix de base.',
      });
    }
    if (promoStart !== null && promoEnd !== null && promoStart.getTime() >= promoEnd.getTime()) {
      throw new BadRequestException({
        code: 'PROMO_WINDOW_INVALID',
        message: 'La date de début de promotion doit précéder la date de fin.',
      });
    }
  }

  private assertHasStock(variants: { color: string; size: string; stock: number }[]): void {
    if (!variants.some((variant) => variant.stock > 0)) {
      throw new BadRequestException({
        code: 'PUBLISHED_REQUIRES_STOCK',
        message: 'Un produit publié doit avoir au moins une variante en stock.',
      });
    }
  }

  private async assertRelations(
    categoryId: string,
    brandId: string,
  ): Promise<{
    category: { id: string; name: string; slug: string };
    brand: { id: string; name: string; slug: string };
  }> {
    const [category, brand] = await Promise.all([
      this.prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true, name: true, slug: true },
      }),
      this.prisma.brand.findUnique({
        where: { id: brandId },
        select: { id: true, name: true, slug: true },
      }),
    ]);
    if (category === null) {
      throw new BadRequestException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Catégorie introuvable.',
      });
    }
    if (brand === null) {
      throw new BadRequestException({
        code: 'BRAND_NOT_FOUND',
        message: 'Marque introuvable.',
      });
    }
    return { category, brand };
  }

  private async assertSlugFree(slug: string, excludeId?: string): Promise<string> {
    const existing = await this.prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existing !== null && existing.id !== excludeId) {
      throw new ConflictException({
        code: 'SLUG_ALREADY_EXISTS',
        message: `Le slug « ${slug} » est déjà utilisé.`,
      });
    }
    return slug;
  }

  private requireSku(skus: Map<string, string>, variant: { color: string; size: string }): string {
    const sku = skus.get(variantKey(variant.color, variant.size));
    if (sku === undefined) {
      throw new InternalServerErrorException({
        code: 'SKU_GENERATION_FAILED',
        message: 'SKU manquant pour une variante du produit.',
      });
    }
    return sku;
  }

  private async audit(
    client: Prisma.TransactionClient,
    actor: CatalogActor,
    event: AuditEventInput,
  ): Promise<void> {
    await this.auditLog.record(client, {
      userId: actor.userId,
      ip: actor.ip,
      userAgent: actor.userAgent,
      ...event,
    });
  }

  private snapshot(product: AdminProductRow): Prisma.InputJsonValue {
    return {
      name: product.name,
      slug: product.slug,
      status: product.status,
      basePrice: product.basePrice,
      promoPrice: product.promoPrice,
      variants: product.variants.map((variant) => ({
        sku: variant.sku,
        color: variant.color,
        size: variant.size,
        price: variant.price,
        stock: variant.stock,
      })),
    } as Prisma.InputJsonValue;
  }

  private rethrowWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = Array.isArray(error.meta?.target) ? (error.meta.target as string[]) : [];
        if (target.includes('sku')) {
          throw new ConflictException({
            code: 'SKU_ALREADY_EXISTS',
            message: 'Ce SKU est déjà utilisé.',
          });
        }
        if (target.includes('slug')) {
          throw new ConflictException({
            code: 'SLUG_ALREADY_EXISTS',
            message: 'Ce slug est déjà utilisé.',
          });
        }
        if (target.includes('color') || target.includes('size')) {
          throw new ConflictException({
            code: 'DUPLICATE_VARIANT',
            message: 'Cette couleur/pointure existe déjà pour ce produit.',
          });
        }
      }
      if (error.code === 'P2025') this.throwProductNotFound();
    }
    throw error;
  }
}
