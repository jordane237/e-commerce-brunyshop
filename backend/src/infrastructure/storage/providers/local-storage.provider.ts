import { createHmac, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';

import type { StorageSettings } from '../storage.settings';
import type {
  StorageObject,
  StoragePresignedUpload,
  StorageProvider,
  StorageUploadParams,
  StorageUploadResult,
} from './storage-provider.interface';

interface LocalUploadToken {
  key: string;
  contentType: string;
  exp: number;
}

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

// Development fallback: files live under backend/storage/uploads, never under
// public/, dist/ or src/. Writes are always server-generated keys; reads go
// through a controlled controller, never express.static on the root folder.
export class LocalStorageProvider implements StorageProvider {
  private readonly root: string;

  constructor(
    private readonly settings: StorageSettings,
    private readonly signingSecret: string,
  ) {
    this.root = resolve(process.cwd(), settings.localRoot);
  }

  async upload(params: StorageUploadParams): Promise<StorageUploadResult> {
    const target = this.pathFor(params.key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, params.buffer, { mode: 0o640 });
    return {
      key: params.key,
      url: this.getPublicUrl(params.key),
      size: params.buffer.length,
    };
  }

  async presignUpload(
    key: string,
    contentType: string,
    expiresInSeconds: number,
  ): Promise<StoragePresignedUpload> {
    const payload: LocalUploadToken = {
      key,
      contentType,
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = this.sign(encoded);
    return {
      uploadUrl: `${this.settings.apiBaseUrl.replace(/\/+$/, '')}/api/v1/media/local-upload?token=${encoded}.${signature}`,
      key,
      expiresIn: expiresInSeconds,
      headers: { 'Content-Type': contentType },
    };
  }

  verifyUploadToken(token: string): { key: string; contentType: string } | null {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) return null;
    const expected = this.sign(encoded);
    const left = Buffer.from(signature);
    const right = Buffer.from(expected);
    if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
    try {
      const payload = JSON.parse(
        Buffer.from(encoded, 'base64url').toString('utf8'),
      ) as LocalUploadToken;
      if (
        typeof payload.key !== 'string' ||
        typeof payload.contentType !== 'string' ||
        typeof payload.exp !== 'number' ||
        payload.exp < Math.floor(Date.now() / 1000)
      ) {
        return null;
      }
      this.pathFor(payload.key);
      return { key: payload.key, contentType: payload.contentType };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }

  getPublicUrl(key: string): string {
    return `${this.settings.apiBaseUrl.replace(/\/+$/, '')}/api/v1/media/files?key=${encodeURIComponent(key)}`;
  }

  async download(key: string): Promise<StorageObject | null> {
    try {
      const buffer = await readFile(this.pathFor(key));
      return { buffer, contentType: this.contentTypeFor(key) };
    } catch (error) {
      if (this.isMissing(error)) return null;
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await stat(this.pathFor(key));
      return true;
    } catch (error) {
      if (this.isMissing(error)) return false;
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await mkdir(this.root, { recursive: true });
      return true;
    } catch {
      return false;
    }
  }

  private sign(value: string): string {
    return createHmac('sha256', this.signingSecret).update(value).digest('base64url');
  }

  private pathFor(key: string): string {
    if (key.includes('\0') || key.startsWith('/') || key.split('/').includes('..')) {
      throw new Error('Invalid storage key');
    }
    const target = resolve(this.root, key);
    if (target !== this.root && !target.startsWith(`${this.root}${sep}`)) {
      throw new Error('Invalid storage key');
    }
    return target;
  }

  private contentTypeFor(key: string): string {
    const extension = key.split('.').pop()?.toLowerCase() ?? '';
    return MIME_BY_EXTENSION[extension] ?? 'application/octet-stream';
  }

  private isMissing(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error.code === 'ENOENT' || error.code === 'ENOTDIR')
    );
  }
}
