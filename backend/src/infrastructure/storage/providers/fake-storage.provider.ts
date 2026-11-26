import type { StorageSettings } from '../storage.settings';
import type {
  StorageObject,
  StoragePresignedUpload,
  StorageProvider,
  StorageUploadParams,
  StorageUploadResult,
} from './storage-provider.interface';

interface FakeObject {
  buffer: Buffer;
  contentType: string;
}

// In-memory provider used by e2e tests (CI has no MinIO). Deterministic URLs
// make assertions readable; `putRaw` simulates a direct client upload.
export class FakeStorageProvider implements StorageProvider {
  private readonly objects = new Map<string, FakeObject>();

  constructor(private readonly settings: StorageSettings) {}

  async upload(params: StorageUploadParams): Promise<StorageUploadResult> {
    this.objects.set(params.key, {
      buffer: Buffer.from(params.buffer),
      contentType: params.contentType,
    });
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
    return {
      uploadUrl: `fake://${key}`,
      key,
      expiresIn: expiresInSeconds,
      headers: { 'Content-Type': contentType },
    };
  }

  async delete(key: string): Promise<void> {
    this.objects.delete(key);
  }

  getPublicUrl(key: string): string {
    return `${this.settings.publicUrl.replace(/\/+$/, '')}/${key.replace(/^\/+/, '')}`;
  }

  async download(key: string): Promise<StorageObject | null> {
    const object = this.objects.get(key);
    if (!object) return null;
    return { buffer: Buffer.from(object.buffer), contentType: object.contentType };
  }

  async exists(key: string): Promise<boolean> {
    return this.objects.has(key);
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  /** Simulates the direct browser -> storage PUT. */
  putRaw(key: string, buffer: Buffer, contentType = 'application/octet-stream'): void {
    this.objects.set(key, { buffer: Buffer.from(buffer), contentType });
  }

  getObject(key: string): FakeObject | undefined {
    return this.objects.get(key);
  }

  clear(): void {
    this.objects.clear();
  }
}
