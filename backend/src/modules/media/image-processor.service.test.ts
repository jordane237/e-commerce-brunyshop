import type { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import type { StorageSettings } from '../../infrastructure/storage/storage.settings';
import { ImageProcessorService } from './image-processor.service';

function processor(maxFileSizeBytes = 5 * 1024 * 1024): ImageProcessorService {
  const settings = { maxFileSizeBytes } as StorageSettings;
  const config = { getOrThrow: (): StorageSettings => settings } as unknown as ConfigService;
  return new ImageProcessorService(config);
}

async function jpeg(width = 120, height = 80): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 20, g: 40, b: 60 } },
  })
    .jpeg()
    .toBuffer();
}

describe('ImageProcessorService — validation magic bytes', () => {
  it('accepte un JPEG réel et retourne ses dimensions', async () => {
    const result = await processor().validateImage(await jpeg(120, 80), 'photo.jpg');
    expect(result).toMatchObject({ mime: 'image/jpeg', width: 120, height: 80 });
  });

  it('accepte un PNG réel', async () => {
    const buffer = await sharp({
      create: { width: 32, height: 24, channels: 3, background: { r: 1, g: 2, b: 3 } },
    })
      .png()
      .toBuffer();
    const result = await processor().validateImage(buffer, 'photo.png');
    expect(result.mime).toBe('image/png');
    expect(result.width).toBe(32);
  });

  it('accepte un WebP réel', async () => {
    const buffer = await sharp({
      create: { width: 40, height: 30, channels: 3, background: { r: 1, g: 2, b: 3 } },
    })
      .webp()
      .toBuffer();
    const result = await processor().validateImage(buffer, 'photo.webp');
    expect(result.mime).toBe('image/webp');
  });

  it.each([
    ['PDF', Buffer.from('%PDF-1.7\n%fake pdf content\n')],
    ['ZIP', Buffer.from('PK\u0003\u0004fake zip')],
    ['exécutable MZ', Buffer.from('MZ\u0090\u0000fake exe')],
    ['texte', Buffer.from('Hello World, definitely not an image')],
    ['SVG', Buffer.from('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>')],
  ])('refuse un fichier %s avec INVALID_IMAGE_TYPE', async (_label, buffer) => {
    await expect(processor().validateImage(buffer, 'fichier.bin')).rejects.toMatchObject({
      response: { code: 'INVALID_IMAGE_TYPE' },
    });
  });

  it('refuse une image corrompue avec INVALID_IMAGE', async () => {
    const valid = await jpeg();
    const truncated = valid.subarray(0, Math.min(80, valid.length));
    await expect(processor().validateImage(truncated, 'corrompue.jpg')).rejects.toMatchObject({
      response: { code: 'INVALID_IMAGE' },
    });
  });

  it('refuse un fichier au-dessus de la taille maximale', async () => {
    await expect(processor(10).validateImage(await jpeg(), 'trop-gros.jpg')).rejects.toMatchObject({
      response: { code: 'FILE_TOO_LARGE' },
    });
  });

  it('refuse un buffer vide', async () => {
    await expect(processor().validateImage(Buffer.alloc(0))).rejects.toMatchObject({
      response: { code: 'INVALID_IMAGE' },
    });
  });
});

describe('ImageProcessorService — traitement', () => {
  it('génère les 3 versions avec les bonnes dimensions', async () => {
    const source = await jpeg(3000, 1000);
    const result = await processor().processImage(source, 'products/slug/noir/uuid');

    expect(result.original.key).toBe('products/slug/noir/uuid.jpg');
    expect(result.webp.key).toBe('products/slug/noir/uuid.webp');
    expect(result.thumbnail.key).toBe('products/slug/noir/uuid-thumb.webp');

    const original = await sharp(result.original.buffer).metadata();
    const webp = await sharp(result.webp.buffer).metadata();
    const thumbnail = await sharp(result.thumbnail.buffer).metadata();

    expect(original).toMatchObject({ format: 'jpeg', width: 2000, height: 667 });
    expect(webp).toMatchObject({ format: 'webp', width: 1600, height: 533 });
    expect(thumbnail).toMatchObject({ format: 'webp', width: 400, height: 400 });
  });

  it('applique la rotation EXIF', async () => {
    const source = await sharp({
      create: { width: 800, height: 400, channels: 3, background: { r: 9, g: 8, b: 7 } },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();

    const result = await processor().processImage(source, 'products/slug/noir/exif');
    const original = await sharp(result.original.buffer).metadata();
    expect(original.width).toBe(400);
    expect(original.height).toBe(800);
  });

  it('refuse un buffer non décodable au traitement', async () => {
    await expect(
      processor().processImage(Buffer.from('not an image'), 'products/slug/noir/bad'),
    ).rejects.toMatchObject({ response: { code: 'INVALID_IMAGE' } });
  });
});
