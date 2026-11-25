import { randomUUID } from 'node:crypto';
import type { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FakeStorageProvider } from '../../infrastructure/storage/providers/fake-storage.provider';
import type { StorageSettings } from '../../infrastructure/storage/storage.settings';
import type { PrismaService } from '../../infrastructure/database/database.module';
import type { AuditLogService } from '../audit/audit.service';
import type { CatalogCacheService } from '../catalog/cache/catalog-cache.service';
import type { ConfirmUploadDto } from './dto/confirm-upload.dto';
import type { PresignUploadDto } from './dto/presign-upload.dto';
import { ImageProcessorService } from './image-processor.service';
import { MediaService } from './media.service';

const SLUG = 'sneakers-test';
const ACTOR = { userId: 'user-1', ip: '127.0.0.1', userAgent: 'vitest' };

const SETTINGS: StorageSettings = {
  provider: 'fake',
  maxFileSizeBytes: 5 * 1024 * 1024,
  presignExpiresSeconds: 300,
  maxImagesPerProduct: 10,
  bucket: 'brunyshop-media',
  publicUrl: 'http://media.test/brunyshop-media',
  region: 'us-east-1',
  forcePathStyle: true,
  localRoot: 'storage/uploads',
  apiBaseUrl: 'http://localhost:4000',
};

function makeService() {
  const prisma = {
    product: { findUnique: vi.fn().mockResolvedValue({ id: 'product-1' }) },
    productImage: {
      count: vi.fn().mockResolvedValue(0),
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      aggregate: vi.fn().mockResolvedValue({ _max: { position: null } }),
      create: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
    },
    productVariant: {
      findMany: vi.fn().mockResolvedValue([{ color: 'NOIR' }]),
    },
    $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(prisma)),
  };
  const audit = { record: vi.fn().mockResolvedValue(undefined) };
  const cache = { invalidateProducts: vi.fn().mockResolvedValue(undefined) };
  const config = {
    getOrThrow: (): StorageSettings => SETTINGS,
  } as unknown as ConfigService;
  const storage = new FakeStorageProvider(SETTINGS);
  const processor = new ImageProcessorService(config);
  const service = new MediaService(
    prisma as unknown as PrismaService,
    audit as unknown as AuditLogService,
    cache as unknown as CatalogCacheService,
    processor,
    config,
    storage,
  );
  return { service, prisma, audit, cache, storage };
}

async function jpeg(): Promise<Buffer> {
  return sharp({
    create: { width: 80, height: 60, channels: 3, background: { r: 3, g: 4, b: 5 } },
  })
    .jpeg()
    .toBuffer();
}

function keyFor(color = 'noir', extension = 'jpg'): string {
  return `products/${SLUG}/${color}/${randomUUID()}.${extension}`;
}

function presignDto(overrides: Partial<PresignUploadDto> = {}): PresignUploadDto {
  return {
    productSlug: SLUG,
    contentType: 'image/jpeg',
    declaredSize: 1024,
    ...overrides,
  };
}

function confirmDto(key: string, overrides: Partial<ConfirmUploadDto> = {}): ConfirmUploadDto {
  return { key, productSlug: SLUG, ...overrides };
}

describe('MediaService — presign', () => {
  it('génère une clé UUID et une URL signée', async () => {
    const { service, prisma, audit } = makeService();
    const result = await service.presignUpload(presignDto({ variantColor: 'noir' }), ACTOR);

    expect(result.key).toMatch(new RegExp(`^products/${SLUG}/noir/[0-9a-f-]{36}\\.jpg$`));
    expect(result.uploadUrl).toBe(`fake://${result.key}`);
    expect(result).toMatchObject({ expiresIn: 300, method: 'PUT' });
    expect(result.headers).toEqual({ 'Content-Type': 'image/jpeg' });
    expect(prisma.product.findUnique).toHaveBeenCalledWith({
      where: { slug: SLUG },
      select: { id: true },
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: 'MEDIA_PRESIGN_GENERATED' }),
    );
  });

  it('slugifie une couleur multi-mots dans la clé sans perdre le libellé', async () => {
    const { service, prisma } = makeService();
    prisma.productVariant.findMany.mockResolvedValue([{ color: 'BLEU MARINE' }]);

    const result = await service.presignUpload(presignDto({ variantColor: 'BLEU MARINE' }), ACTOR);

    expect(result.key).toMatch(new RegExp(`^products/${SLUG}/bleu-marine/`));
  });

  it('refuse une couleur absente des variantes actives au presign', async () => {
    const { service, prisma } = makeService();
    prisma.productVariant.findMany.mockResolvedValue([{ color: 'NOIR' }]);

    await expect(
      service.presignUpload(presignDto({ variantColor: 'ROUGE' }), ACTOR),
    ).rejects.toMatchObject({ response: { code: 'INVALID_VARIANT_COLOR' } });
  });

  it('renvoie 404 pour un produit inexistant', async () => {
    const { service, prisma } = makeService();
    prisma.product.findUnique.mockResolvedValue(null);
    await expect(service.presignUpload(presignDto(), ACTOR)).rejects.toMatchObject({
      response: { code: 'PRODUCT_NOT_FOUND' },
    });
  });

  it('refuse au-delà du quota d’images', async () => {
    const { service, prisma } = makeService();
    prisma.productImage.count.mockResolvedValue(10);
    await expect(service.presignUpload(presignDto(), ACTOR)).rejects.toMatchObject({
      response: { code: 'MAX_IMAGES_REACHED' },
    });
  });

  it('refuse une taille déclarée supérieure au maximum', async () => {
    const { service } = makeService();
    await expect(
      service.presignUpload(presignDto({ declaredSize: 6 * 1024 * 1024 }), ACTOR),
    ).rejects.toMatchObject({ response: { code: 'FILE_TOO_LARGE' } });
  });

  it('refuse une clé appartenant à un autre produit au confirm', async () => {
    const { service } = makeService();
    await expect(
      service.confirmUpload(confirmDto('products/autre-produit/noir/uuid.jpg'), ACTOR),
    ).rejects.toMatchObject({ response: { code: 'INVALID_MEDIA_KEY' } });
  });
});

describe('MediaService — confirm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('valide, traite et stocke les 3 versions puis crée ProductImage', async () => {
    const { service, prisma, storage, audit, cache } = makeService();
    const key = keyFor('noir', 'png');
    storage.putRaw(key, await jpeg(), 'image/jpeg');
    prisma.productImage.create.mockImplementation((args: { data: Record<string, unknown> }) =>
      Promise.resolve({
        id: 'image-1',
        ...args.data,
        alt: args.data['alt'] ?? null,
        variantColor: args.data['variantColor'] ?? null,
        position: args.data['position'] ?? 0,
      }),
    );

    const result = await service.confirmUpload(
      confirmDto(key, { alt: 'Vue de face', variantColor: 'noir' }),
      ACTOR,
    );

    expect(result).toMatchObject({ id: 'image-1', alt: 'Vue de face', variantColor: 'NOIR' });
    expect(result.url).toMatch(/\.webp$/);
    expect(result.thumbnailUrl).toMatch(/-thumb\.webp$/);
    expect(storage.getObject(key)).toBeUndefined();
    expect(storage.getObject(key.replace(/\.png$/, '.webp'))).toBeDefined();
    expect(storage.getObject(key.replace(/\.png$/, '-thumb.webp'))).toBeDefined();
    expect(prisma.productImage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        productId: 'product-1',
        storageKey: key.replace(/\.png$/, '.webp'),
        alt: 'Vue de face',
        variantColor: 'NOIR',
      }),
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: 'MEDIA_UPLOADED' }),
    );
    expect(cache.invalidateProducts).toHaveBeenCalledOnce();
  });

  it('refuse un PDF, supprime le brut et audite le rejet', async () => {
    const { service, prisma, storage, audit } = makeService();
    const key = keyFor('common', 'jpg');
    storage.putRaw(key, Buffer.from('%PDF-1.7\nfake'), 'image/jpeg');

    await expect(service.confirmUpload(confirmDto(key), ACTOR)).rejects.toMatchObject({
      response: { code: 'INVALID_IMAGE_TYPE' },
    });

    expect(storage.getObject(key)).toBeUndefined();
    expect(prisma.productImage.create).not.toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: 'MEDIA_UPLOAD_REJECTED' }),
    );
  });

  it('renvoie 404 quand la clé est absente du stockage', async () => {
    const { service } = makeService();
    await expect(service.confirmUpload(confirmDto(keyFor('common')), ACTOR)).rejects.toMatchObject({
      response: { code: 'MEDIA_NOT_FOUND' },
    });
  });

  it('nettoie les versions si le quota est atteint à la confirmation', async () => {
    const { service, prisma, storage } = makeService();
    const key = keyFor('common');
    storage.putRaw(key, await jpeg(), 'image/jpeg');
    prisma.productImage.count.mockResolvedValue(10);

    await expect(service.confirmUpload(confirmDto(key), ACTOR)).rejects.toMatchObject({
      response: { code: 'MAX_IMAGES_REACHED' },
    });
    expect(storage.getObject(key.replace(/\.jpg$/, '.webp'))).toBeUndefined();
    expect(storage.getObject(key.replace(/\.jpg$/, '-thumb.webp'))).toBeUndefined();
  });

  it('nettoie le stockage si la création DB échoue', async () => {
    const { service, prisma, storage } = makeService();
    const key = keyFor('common');
    storage.putRaw(key, await jpeg(), 'image/jpeg');
    prisma.productImage.create.mockRejectedValue(new Error('db down'));

    await expect(service.confirmUpload(confirmDto(key), ACTOR)).rejects.toThrow('db down');
    expect(storage.getObject(key.replace(/\.jpg$/, '.webp'))).toBeUndefined();
  });
});

describe('MediaService — configuration & métadonnées', () => {
  it('expose les limites configurées sans secret de stockage', () => {
    const { service } = makeService();

    expect(service.getConfig()).toEqual({
      maxFileSizeBytes: 5 * 1024 * 1024,
      maxImagesPerProduct: 10,
      presignExpiresSeconds: 300,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });
  });

  it('met à jour le texte alternatif et une couleur active', async () => {
    const { service, prisma, audit, cache } = makeService();
    prisma.productImage.findUnique.mockResolvedValue({
      id: 'image-1',
      productId: 'product-1',
      url: 'http://media.test/brunyshop-media/products/test/noir/a.webp',
      storageKey: `products/${SLUG}/noir/${randomUUID()}.webp`,
      alt: null,
      position: 0,
      variantColor: null,
    });
    prisma.productImage.update.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({
        id: 'image-1',
        productId: 'product-1',
        url: 'http://media.test/brunyshop-media/products/test/noir/a.webp',
        storageKey: `products/${SLUG}/noir/${randomUUID()}.webp`,
        alt: data['alt'],
        position: 0,
        variantColor: data['variantColor'],
      }),
    );

    const result = await service.updateImage(
      'image-1',
      { alt: '  Vue de face  ', variantColor: 'noir' },
      ACTOR,
    );

    expect(prisma.productVariant.findMany).toHaveBeenCalledWith({
      where: { productId: 'product-1', archivedAt: null },
      select: { color: true },
      distinct: ['color'],
    });
    expect(result).toMatchObject({ alt: 'Vue de face', variantColor: 'NOIR' });
    expect(result.thumbnailUrl).toMatch(/-thumb\.webp$/);
    expect(audit.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: 'MEDIA_UPDATED' }),
    );
    expect(cache.invalidateProducts).toHaveBeenCalledOnce();
  });

  it('refuse une couleur absente des variantes actives', async () => {
    const { service, prisma } = makeService();
    prisma.productImage.findUnique.mockResolvedValue({
      id: 'image-1',
      productId: 'product-1',
      url: 'http://media.test/a.webp',
      storageKey: `products/${SLUG}/noir/a.webp`,
      alt: null,
      position: 0,
      variantColor: null,
    });
    prisma.productVariant.findMany.mockResolvedValue([{ color: 'NOIR' }]);

    await expect(
      service.updateImage('image-1', { variantColor: 'ROUGE' }, ACTOR),
    ).rejects.toMatchObject({ response: { code: 'INVALID_VARIANT_COLOR' } });
    expect(prisma.productImage.update).not.toHaveBeenCalled();
  });

  it('conserve une couleur historique quand seul le texte alternatif change', async () => {
    const { service, prisma } = makeService();
    prisma.productImage.findUnique.mockResolvedValue({
      id: 'image-1',
      productId: 'product-1',
      url: 'http://media.test/a.webp',
      storageKey: `products/${SLUG}/ancienne/a.webp`,
      alt: null,
      position: 0,
      variantColor: 'ANCIENNE',
    });
    prisma.productVariant.findMany.mockResolvedValue([]);
    prisma.productImage.update.mockResolvedValue({
      id: 'image-1',
      productId: 'product-1',
      url: 'http://media.test/a.webp',
      storageKey: `products/${SLUG}/ancienne/a.webp`,
      alt: 'Vue historique',
      position: 0,
      variantColor: 'ANCIENNE',
    });

    await expect(
      service.updateImage('image-1', { alt: 'Vue historique' }, ACTOR),
    ).resolves.toMatchObject({ alt: 'Vue historique', variantColor: 'ANCIENNE' });
    expect(prisma.productVariant.findMany).not.toHaveBeenCalled();
  });

  it('renvoie 404 pour une image inconnue', async () => {
    const { service, prisma } = makeService();
    prisma.productImage.findUnique.mockResolvedValue(null);

    await expect(service.updateImage('missing', { alt: 'x' }, ACTOR)).rejects.toMatchObject({
      response: { code: 'IMAGE_NOT_FOUND' },
    });
  });
});

describe('MediaService — delete & reorder', () => {
  it('supprime les 3 versions, la ligne, audite et invalide le cache', async () => {
    const { service, prisma, storage, audit, cache } = makeService();
    const base = `products/${SLUG}/noir/${randomUUID()}`;
    storage.putRaw(`${base}.jpg`, await jpeg());
    storage.putRaw(`${base}.webp`, await jpeg());
    storage.putRaw(`${base}-thumb.webp`, await jpeg());
    prisma.productImage.findUnique.mockResolvedValue({
      id: 'image-1',
      productId: 'product-1',
      url: `http://media.test/brunyshop-media/${base}.webp`,
      storageKey: `${base}.webp`,
    });

    await service.deleteImage('image-1', ACTOR);

    expect(prisma.productImage.delete).toHaveBeenCalledWith({ where: { id: 'image-1' } });
    expect(storage.getObject(`${base}.jpg`)).toBeUndefined();
    expect(storage.getObject(`${base}.webp`)).toBeUndefined();
    expect(storage.getObject(`${base}-thumb.webp`)).toBeUndefined();
    expect(audit.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: 'MEDIA_DELETED' }),
    );
    expect(cache.invalidateProducts).toHaveBeenCalledOnce();
  });

  it('renvoie 404 pour une image inconnue', async () => {
    const { service, prisma } = makeService();
    prisma.productImage.findUnique.mockResolvedValue(null);
    await expect(service.deleteImage(randomUUID(), ACTOR)).rejects.toMatchObject({
      response: { code: 'IMAGE_NOT_FOUND' },
    });
  });

  it('réordonne les images du produit en transaction', async () => {
    const { service, prisma, audit, cache } = makeService();
    const ids = [randomUUID(), randomUUID()];
    prisma.productImage.findMany.mockResolvedValue(ids.map((id) => ({ id })));

    const result = await service.reorderImages(
      {
        productId: 'product-1',
        order: [
          { id: ids[0]!, position: 1 },
          { id: ids[1]!, position: 0 },
        ],
      },
      ACTOR,
    );

    expect(result).toEqual({ updated: 2 });
    expect(prisma.productImage.update).toHaveBeenCalledTimes(2);
    expect(audit.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: 'MEDIA_REORDERED' }),
    );
    expect(cache.invalidateProducts).toHaveBeenCalledOnce();
  });

  it('refuse une image étrangère au produit', async () => {
    const { service, prisma } = makeService();
    prisma.productImage.findMany.mockResolvedValue([]);
    await expect(
      service.reorderImages(
        { productId: 'product-1', order: [{ id: randomUUID(), position: 0 }] },
        ACTOR,
      ),
    ).rejects.toMatchObject({ response: { code: 'INVALID_IMAGE_ORDER' } });
  });
});
