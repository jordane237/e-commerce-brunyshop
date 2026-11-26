import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type { StorageSettings } from '../storage.settings';
import type {
  StorageObject,
  StoragePresignedUpload,
  StorageProvider,
  StorageUploadParams,
  StorageUploadResult,
} from './storage-provider.interface';

// S3-compatible provider (AWS S3, MinIO, Cloudflare R2).
// Credentials never leave the backend: only presigned URLs are returned.
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;

  constructor(private readonly settings: StorageSettings) {
    this.client = new S3Client({
      region: settings.region,
      ...(settings.endpoint ? { endpoint: settings.endpoint } : {}),
      ...(settings.accessKeyId && settings.secretAccessKey
        ? {
            credentials: {
              accessKeyId: settings.accessKeyId,
              secretAccessKey: settings.secretAccessKey,
            },
          }
        : {}),
      forcePathStyle: settings.forcePathStyle,
    });
  }

  async upload(params: StorageUploadParams): Promise<StorageUploadResult> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.settings.bucket,
        Key: params.key,
        Body: params.buffer,
        ContentType: params.contentType,
        CacheControl: 'public, max-age=31536000, immutable',
        ...(params.metadata ? { Metadata: params.metadata } : {}),
      }),
    );
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
    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.settings.bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: expiresInSeconds },
    );
    return {
      uploadUrl,
      key,
      expiresIn: expiresInSeconds,
      headers: { 'Content-Type': contentType },
    };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.settings.bucket,
        Key: key,
      }),
    );
  }

  getPublicUrl(key: string): string {
    return `${this.settings.publicUrl.replace(/\/+$/, '')}/${key.replace(/^\/+/, '')}`;
  }

  async download(key: string): Promise<StorageObject | null> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.settings.bucket,
          Key: key,
        }),
      );
      if (!response.Body) return null;
      const bytes = await response.Body.transformToByteArray();
      return {
        buffer: Buffer.from(bytes),
        contentType: response.ContentType ?? 'application/octet-stream',
      };
    } catch (error) {
      if (this.isNotFound(error)) return null;
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.settings.bucket,
          Key: key,
        }),
      );
      return true;
    } catch (error) {
      if (this.isNotFound(error)) return false;
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.settings.bucket }));
      return true;
    } catch {
      return false;
    }
  }

  private isNotFound(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) return false;
    const name = 'name' in error ? String(error.name) : '';
    const status =
      '$metadata' in error &&
      typeof error.$metadata === 'object' &&
      error.$metadata !== null &&
      'httpStatusCode' in error.$metadata
        ? Number(error.$metadata.httpStatusCode)
        : undefined;
    return name === 'NoSuchKey' || name === 'NotFound' || status === 404;
  }
}
