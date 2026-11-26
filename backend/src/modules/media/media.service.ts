import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/database.module';
import {
  STORAGE_PROVIDER,
  type StorageProvider,
} from '../../infrastructure/storage/providers/storage-provider.interface';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  extensionForMime,
  type AllowedImageMimeType,
  type StorageSettings,
} from '../../infrastructure/storage/storage.settings';
import { AuditLogService } from '../audit/audit.service';
import { CatalogCacheService } from '../catalog/cache/catalog-cache.service';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import { UpdateProductImageDto } from './dto/update-image.dto';
import { ImageProcessorService, type ProcessedImage } from './image-processor.service';
import { MEDIA_AUDIT_ACTIONS as ACTIONS } from './media-audit.actions';

export interface MediaActor {
  userId: string;
  ip?: string;
  userAgent?: string;
}

export interface PresignResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
  method: 'PUT';
  headers: Record<string, string>;
}

export interface ConfirmResponse {
  id: string;
  url: string;
  thumbnailUrl: string;
  alt: string | null;
  position: number;
  variantColor: string | null;
}

interface ImageRow {
  id: string;
  productId: string;
  url: string;
  storageKey: string | null;
}

interface EditableImageRow extends ImageRow {
  alt: string | null;
  position: number;
  variantColor: string | null;
}

function normalizeColor(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function colorSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class MediaService {
  private readonly settings: StorageSettings;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly cache: CatalogCacheService,
    private readonly processor: ImageProcessorService,
    config: ConfigService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {
    this.settings = config.getOrThrow<StorageSettings>('app.storage');
  }

  async presignUpload(dto: PresignUploadDto, actor: MediaActor): Promise<PresignResponse> {
    const product = await this.prisma.product.findUnique({
      where: { slug: dto.productSlug },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Produit introuvable.',
      });
    }
    if (dto.variantColor) {
      await this.assertActiveProductColor(product.id, normalizeColor(dto.variantColor));
    }

    const imageCount = await this.prisma.productImage.count({
      where: { productId: product.id },
    });
    if (imageCount >= this.settings.maxImagesPerProduct) {
      throw new BadRequestException({
        code: 'MAX_IMAGES_REACHED',
        message: `Ce produit a atteint la limite de ${this.settings.maxImagesPerProduct} images.`,
      });
    }

    if (dto.declaredSize > this.settings.maxFileSizeBytes) {
      throw new BadRequestException({
        code: 'FILE_TOO_LARGE',
        message: `Fichier trop volumineux (max ${this.maxFileSizeMb()} Mo).`,
      });
    }

    const extension = extensionForMime(dto.contentType as AllowedImageMimeType);
    const colorSegment = dto.variantColor ? colorSlug(dto.variantColor) : 'common';
    const key = `products/${dto.productSlug}/${colorSegment}/${randomUUID()}.${extension}`;
    const signed = await this.storage.presignUpload(
      key,
      dto.contentType,
      this.settings.presignExpiresSeconds,
    );

    await this.audit.record(this.prisma, {
      userId: actor.userId,
      action: ACTIONS.MEDIA_PRESIGN_GENERATED,
      entity: 'ProductImage',
      entityId: product.id,
      ip: actor.ip,
      userAgent: actor.userAgent,
      after: { key, contentType: dto.contentType, declaredSize: dto.declaredSize },
    });

    return {
      uploadUrl: signed.uploadUrl,
      key,
      publicUrl: this.storage.getPublicUrl(key),
      expiresIn: signed.expiresIn,
      method: 'PUT',
      headers: signed.headers ?? { 'Content-Type': dto.contentType },
    };
  }

  async confirmUpload(dto: ConfirmUploadDto, actor: MediaActor): Promise<ConfirmResponse> {
    const product = await this.prisma.product.findUnique({
      where: { slug: dto.productSlug },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Produit introuvable.',
      });
    }
    if (dto.variantColor) {
      await this.assertActiveProductColor(product.id, normalizeColor(dto.variantColor));
    }

    this.assertKeyOwnership(dto.key, dto.productSlug, dto.variantColor);
    const raw = await this.storage.download(dto.key);
    if (!raw) {
      throw new NotFoundException({
        code: 'MEDIA_NOT_FOUND',
        message: 'Fichier téléversé introuvable.',
      });
    }

    let processed: ProcessedImage;
    try {
      await this.processor.validateImage(raw.buffer, dto.key);
      const baseKey = dto.key.replace(/\.[a-z0-9]+$/i, '');
      processed = await this.processor.processImage(raw.buffer, baseKey);
    } catch (error) {
      await this.storage.delete(dto.key).catch(() => undefined);
      await this.auditRejected(product.id, dto.key, error, actor);
      throw error;
    }

    // The raw file is replaced by the optimized versions, whatever its
    // declared extension was. Delete it before uploads so a `.jpg` present in
    // both is not removed after being optimized.
    await this.storage.delete(dto.key).catch(() => undefined);

    const versions = [processed.original, processed.webp, processed.thumbnail];
    const uploadedKeys: string[] = [];
    try {
      for (const version of versions) {
        await this.storage.upload({
          buffer: version.buffer,
          key: version.key,
          contentType: version.mime,
          metadata: { source: 'brunyshop-cat05' },
        });
        uploadedKeys.push(version.key);
      }
    } catch {
      await this.deleteKeys(uploadedKeys);
      throw new InternalServerErrorException({
        code: 'MEDIA_STORAGE_FAILED',
        message: 'Le stockage des images a échoué.',
      });
    }

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const count = await tx.productImage.count({ where: { productId: product.id } });
        if (count >= this.settings.maxImagesPerProduct) {
          throw new BadRequestException({
            code: 'MAX_IMAGES_REACHED',
            message: `Ce produit a atteint la limite de ${this.settings.maxImagesPerProduct} images.`,
          });
        }
        const aggregate = await tx.productImage.aggregate({
          where: { productId: product.id },
          _max: { position: true },
        });
        const position = dto.position ?? (aggregate._max.position ?? -1) + 1;
        const image = await tx.productImage.create({
          data: {
            productId: product.id,
            url: this.storage.getPublicUrl(processed.webp.key),
            storageKey: processed.webp.key,
            alt: dto.alt?.trim() ?? null,
            position,
            variantColor: dto.variantColor ? normalizeColor(dto.variantColor) : null,
          },
        });
        await this.audit.record(tx, {
          userId: actor.userId,
          action: ACTIONS.MEDIA_UPLOADED,
          entity: 'ProductImage',
          entityId: image.id,
          ip: actor.ip,
          userAgent: actor.userAgent,
          after: {
            productId: product.id,
            url: image.url,
            storageKey: image.storageKey,
            position: image.position,
            variantColor: image.variantColor,
            size: raw.buffer.length,
          },
        });
        return image;
      });

      await this.cache.invalidateProducts();
      return {
        id: created.id,
        url: created.url,
        thumbnailUrl: this.storage.getPublicUrl(processed.thumbnail.key),
        alt: created.alt,
        position: created.position,
        variantColor: created.variantColor,
      };
    } catch (error) {
      await this.deleteKeys(uploadedKeys);
      if (error instanceof BadRequestException) {
        await this.auditRejected(product.id, dto.key, error, actor);
      }
      throw error;
    }
  }

  getConfig(): {
    maxFileSizeBytes: number;
    maxImagesPerProduct: number;
    presignExpiresSeconds: number;
    allowedMimeTypes: string[];
  } {
    return {
      maxFileSizeBytes: this.settings.maxFileSizeBytes,
      maxImagesPerProduct: this.settings.maxImagesPerProduct,
      presignExpiresSeconds: this.settings.presignExpiresSeconds,
      allowedMimeTypes: [...ALLOWED_IMAGE_MIME_TYPES],
    };
  }

  async updateImage(
    imageId: string,
    dto: UpdateProductImageDto,
    actor: MediaActor,
  ): Promise<ConfirmResponse> {
    const image: EditableImageRow | null = await this.prisma.productImage.findUnique({
      where: { id: imageId },
      select: {
        id: true,
        productId: true,
        url: true,
        storageKey: true,
        alt: true,
        position: true,
        variantColor: true,
      },
    });
    if (!image) {
      throw new NotFoundException({
        code: 'IMAGE_NOT_FOUND',
        message: 'Image introuvable.',
      });
    }

    const variantColor =
      dto.variantColor === undefined
        ? undefined
        : dto.variantColor === null
          ? null
          : normalizeColor(dto.variantColor);

    if (
      variantColor !== undefined &&
      variantColor !== null &&
      variantColor !== image.variantColor
    ) {
      await this.assertActiveProductColor(image.productId, variantColor);
    }

    const alt =
      dto.alt === undefined ? undefined : dto.alt === null ? null : dto.alt.trim() || null;

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.productImage.update({
        where: { id: image.id },
        data: {
          ...(alt !== undefined ? { alt } : {}),
          ...(variantColor !== undefined ? { variantColor } : {}),
        },
      });
      await this.audit.record(tx, {
        userId: actor.userId,
        action: ACTIONS.MEDIA_UPDATED,
        entity: 'ProductImage',
        entityId: image.id,
        ip: actor.ip,
        userAgent: actor.userAgent,
        before: {
          alt: image.alt,
          variantColor: image.variantColor,
          position: image.position,
        },
        after: { alt: row.alt, variantColor: row.variantColor, position: row.position },
      });
      return row;
    });

    await this.cache.invalidateProducts();
    return {
      id: updated.id,
      url: updated.url,
      thumbnailUrl: this.thumbnailUrl(updated.url, updated.storageKey),
      alt: updated.alt,
      position: updated.position,
      variantColor: updated.variantColor,
    };
  }

  async deleteImage(imageId: string, actor: MediaActor): Promise<void> {
    const image: ImageRow | null = await this.prisma.productImage.findUnique({
      where: { id: imageId },
      select: { id: true, productId: true, url: true, storageKey: true },
    });
    if (!image) {
      throw new NotFoundException({
        code: 'IMAGE_NOT_FOUND',
        message: 'Image introuvable.',
      });
    }

    const keys = this.versionKeys(image.url, image.storageKey);
    await this.prisma.$transaction(async (tx) => {
      await tx.productImage.delete({ where: { id: image.id } });
      await this.audit.record(tx, {
        userId: actor.userId,
        action: ACTIONS.MEDIA_DELETED,
        entity: 'ProductImage',
        entityId: image.id,
        ip: actor.ip,
        userAgent: actor.userAgent,
        before: { productId: image.productId, url: image.url, keys },
      });
    });

    await this.deleteKeys(keys);
    await this.cache.invalidateProducts();
  }

  async reorderImages(dto: ReorderImagesDto, actor: MediaActor): Promise<{ updated: number }> {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Produit introuvable.',
      });
    }

    const ids = dto.order.map((item) => item.id);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException({
        code: 'INVALID_IMAGE_ORDER',
        message: 'Chaque image ne peut apparaître qu’une fois.',
      });
    }
    const owned = await this.prisma.productImage.findMany({
      where: { id: { in: ids }, productId: dto.productId },
      select: { id: true },
    });
    if (owned.length !== ids.length) {
      throw new BadRequestException({
        code: 'INVALID_IMAGE_ORDER',
        message: 'Toutes les images doivent appartenir au produit.',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.order) {
        await tx.productImage.update({
          where: { id: item.id },
          data: { position: item.position },
        });
      }
      await this.audit.record(tx, {
        userId: actor.userId,
        action: ACTIONS.MEDIA_REORDERED,
        entity: 'Product',
        entityId: dto.productId,
        ip: actor.ip,
        userAgent: actor.userAgent,
        after: { order: dto.order.map((item) => ({ id: item.id, position: item.position })) },
      });
    });

    await this.cache.invalidateProducts();
    return { updated: dto.order.length };
  }

  private async assertActiveProductColor(productId: string, color: string): Promise<void> {
    const variants = await this.prisma.productVariant.findMany({
      where: { productId, archivedAt: null },
      select: { color: true },
      distinct: ['color'],
    });
    if (!variants.some((variant) => normalizeColor(variant.color) === color)) {
      throw new BadRequestException({
        code: 'INVALID_VARIANT_COLOR',
        message: 'Cette couleur n’existe pas parmi les variantes actives du produit.',
      });
    }
  }

  private thumbnailUrl(url: string, storageKey: string | null = null): string {
    const key = storageKey ?? this.keyFromUrl(url);
    if (!key) return url;
    return this.storage.getPublicUrl(
      key.endsWith('.webp') ? key.replace(/\.webp$/, '-thumb.webp') : key,
    );
  }

  private assertKeyOwnership(key: string, slug: string, variantColor?: string): void {
    const colorSegment = variantColor ? colorSlug(variantColor) : 'common';
    const expectedPrefix = `products/${slug}/${colorSegment}/`;
    if (!key.startsWith(expectedPrefix) || key.includes('..')) {
      throw new BadRequestException({
        code: 'INVALID_MEDIA_KEY',
        message: 'La clé ne correspond pas au produit ou à la couleur.',
      });
    }
  }

  private versionKeys(url: string, storageKey: string | null): string[] {
    const key = storageKey ?? this.keyFromUrl(url);
    if (!key) return [];
    if (key.endsWith('.webp')) {
      return [key.replace(/\.webp$/, '.jpg'), key, key.replace(/\.webp$/, '-thumb.webp')];
    }
    return [key];
  }

  private keyFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      const fromQuery = parsed.searchParams.get('key');
      if (fromQuery) return fromQuery;
      const base = new URL(this.settings.publicUrl);
      if (parsed.origin === base.origin) {
        const prefix = base.pathname.replace(/\/+$/, '');
        if (parsed.pathname.startsWith(`${prefix}/`)) {
          return decodeURIComponent(parsed.pathname.slice(prefix.length + 1));
        }
      }
    } catch {
      return null;
    }
    return null;
  }

  private async deleteKeys(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.storage.delete(key).catch(() => undefined)));
  }

  private async auditRejected(
    productId: string,
    key: string,
    error: unknown,
    actor: MediaActor,
  ): Promise<void> {
    const response = error instanceof BadRequestException ? error.getResponse() : null;
    const code =
      typeof response === 'object' && response !== null && 'code' in response
        ? String((response as { code?: unknown }).code ?? 'INVALID_IMAGE')
        : 'INVALID_IMAGE';
    await this.audit
      .record(this.prisma, {
        userId: actor.userId,
        action: ACTIONS.MEDIA_UPLOAD_REJECTED,
        entity: 'ProductImage',
        entityId: productId,
        ip: actor.ip,
        userAgent: actor.userAgent,
        after: { key, code },
      })
      .catch(() => undefined);
  }

  private maxFileSizeMb(): number {
    return Math.round((this.settings.maxFileSizeBytes / (1024 * 1024)) * 10) / 10;
  }
}
