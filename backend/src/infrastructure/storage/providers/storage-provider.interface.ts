// Common storage contract. Implementations must never receive the original
// client file name: keys are always generated server-side.

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

export interface StorageUploadParams {
  buffer: Buffer;
  key: string;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface StorageUploadResult {
  key: string;
  url: string;
  size: number;
}

export interface StoragePresignedUpload {
  uploadUrl: string;
  key: string;
  expiresIn: number;
  /** POST-form fields when the provider uses presigned POST. */
  fields?: Record<string, string>;
  /** Headers the client must send with the direct PUT. */
  headers?: Record<string, string>;
}

export interface StorageObject {
  buffer: Buffer;
  contentType: string;
}

export interface StorageProvider {
  upload(params: StorageUploadParams): Promise<StorageUploadResult>;
  presignUpload(
    key: string,
    contentType: string,
    expiresInSeconds: number,
  ): Promise<StoragePresignedUpload>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
  download(key: string): Promise<StorageObject | null>;
  exists(key: string): Promise<boolean>;
  healthCheck(): Promise<boolean>;
}
