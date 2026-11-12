import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';

import {
  isAllowedImageMime,
  type AllowedImageMimeType,
  type StorageSettings,
} from '../../infrastructure/storage/storage.settings';

export interface ValidatedImage {
  mime: AllowedImageMimeType;
  width: number;
  height: number;
}

export interface ProcessedImageVersion {
  key: string;
  buffer: Buffer;
  mime: string;
}

export interface ProcessedImage {
  original: ProcessedImageVersion;
  webp: ProcessedImageVersion;
  thumbnail: ProcessedImageVersion;
}

const MAX_INPUT_PIXELS = 50_000_000;

@Injectable()
export class ImageProcessorService {
  private readonly maxFileSizeBytes: number;

  constructor(config: ConfigService) {
    this.maxFileSizeBytes = config.getOrThrow<StorageSettings>('app.storage').maxFileSizeBytes;
  }

  /**
   * The client Content-Type and filename are never trusted: `file-type` reads
   * the magic bytes, then sharp decodes the pixels to reject truncated or
   * malformed files.
   */
  async validateImage(buffer: Buffer, _originalName = 'upload'): Promise<ValidatedImage> {
    if (buffer.length === 0) {
      throw new BadRequestException({
        code: 'INVALID_IMAGE',
        message: 'Le fichier est vide ou illisible.',
      });
    }
    if (buffer.length > this.maxFileSizeBytes) {
      throw new BadRequestException({
        code: 'FILE_TOO_LARGE',
        message: `Fichier trop volumineux (max ${this.maxFileSizeMb()} Mo).`,
      });
    }

    // file-type v22 is ESM-only; the backend compiles to CommonJS.
    const { fileTypeFromBuffer } = await import('file-type');
    const detected = await fileTypeFromBuffer(buffer);
    if (!detected || !isAllowedImageMime(detected.mime)) {
      throw new BadRequestException({
        code: 'INVALID_IMAGE_TYPE',
        message: 'Format non autorisé. Formats acceptés : JPEG, PNG, WebP.',
      });
    }

    try {
      const metadata = await sharp(buffer, {
        limitInputPixels: MAX_INPUT_PIXELS,
      }).metadata();
      if (!metadata.width || !metadata.height) {
        throw new Error('Missing image dimensions');
      }
      return {
        mime: detected.mime,
        width: metadata.width,
        height: metadata.height,
      };
    } catch {
      throw new BadRequestException({
        code: 'INVALID_IMAGE',
        message: 'Image corrompue ou illisible.',
      });
    }
  }

  /** Generates the optimized JPEG, WebP and 400x400 WebP thumbnail. */
  async processImage(buffer: Buffer, baseKey: string): Promise<ProcessedImage> {
    try {
      const [original, webp, thumbnail] = await Promise.all([
        sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS })
          .rotate()
          .resize({ width: 2000, withoutEnlargement: true, fit: 'inside' })
          .jpeg({ quality: 90 })
          .toBuffer(),
        sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS })
          .rotate()
          .resize({ width: 1600, withoutEnlargement: true, fit: 'inside' })
          .webp({ quality: 85 })
          .toBuffer(),
        sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS })
          .rotate()
          .resize({ width: 400, height: 400, fit: 'cover', position: 'centre' })
          .webp({ quality: 80 })
          .toBuffer(),
      ]);

      return {
        original: { key: `${baseKey}.jpg`, buffer: original, mime: 'image/jpeg' },
        webp: { key: `${baseKey}.webp`, buffer: webp, mime: 'image/webp' },
        thumbnail: {
          key: `${baseKey}-thumb.webp`,
          buffer: thumbnail,
          mime: 'image/webp',
        },
      };
    } catch {
      throw new BadRequestException({
        code: 'INVALID_IMAGE',
        message: 'Image corrompue ou illisible.',
      });
    }
  }

  get maxSizeBytes(): number {
    return this.maxFileSizeBytes;
  }

  private maxFileSizeMb(): number {
    return Math.round((this.maxFileSizeBytes / (1024 * 1024)) * 10) / 10;
  }
}
