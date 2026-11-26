export interface ProductImageItem {
  id: string | null;
  url: string;
  thumbnailUrl: string;
  alt: string;
  variantColor: string | null;
  position: number;
  persisted: boolean;
}

export type UploadStatus =
  | 'pending'
  | 'validating'
  | 'uploading'
  | 'processing'
  | 'success'
  | 'error';

export interface UploadQueueItem {
  localId: string;
  file: File;
  fileName: string;
  fileSize: number;
  previewUrl: string | null;
  mimeType: string;
  alt: string;
  variantColor: string | null;
  status: UploadStatus;
  progress: number;
  error: string | null;
}

export interface UploadContext {
  productId: string;
  productSlug: string;
}

export const DEFAULT_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const DEFAULT_MAX_IMAGES = 10;
export const FALLBACK_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
