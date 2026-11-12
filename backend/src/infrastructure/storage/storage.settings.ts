// Typed storage configuration resolved from environment variables.
// Kept outside Nest DI so both configuration.ts and env.validation.ts can use it.

export type StorageProviderName = 's3' | 'local' | 'fake';

export interface StorageSettings {
  provider: StorageProviderName;
  maxFileSizeBytes: number;
  presignExpiresSeconds: number;
  maxImagesPerProduct: number;
  bucket: string;
  publicUrl: string;
  endpoint?: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  forcePathStyle: boolean;
  localRoot: string;
  apiBaseUrl: string;
}

const PROVIDER_NAMES: StorageProviderName[] = ['s3', 'local', 'fake'];

function asString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text === '' ? undefined : text;
}

function asInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asBool(value: unknown, fallback: boolean): boolean {
  const text = asString(value)?.toLowerCase();
  if (text === undefined) return fallback;
  return text === 'true' || text === '1' || text === 'yes';
}

// STORAGE_PROVIDER wins; STORAGE_DRIVER is the legacy name kept for the
// existing docker-compose/.env files (minio -> s3, local -> local, fake -> fake).
export function resolveStorageProvider(env: Record<string, unknown>): StorageProviderName {
  const explicit = asString(env['STORAGE_PROVIDER'])?.toLowerCase();
  if (explicit === 'minio') return 's3';
  if (explicit && PROVIDER_NAMES.includes(explicit as StorageProviderName)) {
    return explicit as StorageProviderName;
  }
  const driver = asString(env['STORAGE_DRIVER'])?.toLowerCase();
  if (driver === 'minio' || driver === 's3') return 's3';
  if (driver === 'fake') return 'fake';
  if (driver === 'local') return 'local';
  // Zero-config fallback: local disk keeps tests/CI and fresh clones bootable.
  return 'local';
}

export function readStorageSettings(env: Record<string, unknown>): StorageSettings {
  const provider = resolveStorageProvider(env);
  const port = asInt(env['PORT'], 4000);
  const bucket = asString(env['MEDIA_BUCKET']) ?? asString(env['S3_BUCKET']) ?? 'brunyshop-media';
  const endpoint = asString(env['S3_ENDPOINT']);
  const mediPublicUrl = asString(env['MEDIA_PUBLIC_URL']);
  return {
    provider,
    maxFileSizeBytes: asInt(env['STORAGE_MAX_FILE_SIZE_MB'], 5) * 1024 * 1024,
    presignExpiresSeconds: asInt(env['STORAGE_PRESIGN_EXPIRES_SECONDS'], 300),
    maxImagesPerProduct: asInt(env['STORAGE_MAX_IMAGES_PER_PRODUCT'], 10),
    bucket,
    publicUrl:
      mediPublicUrl ??
      (endpoint
        ? `${endpoint.replace(/\/+$/, '')}/${bucket}`
        : `http://localhost:${port}/media/${bucket}`),
    endpoint,
    region: asString(env['S3_REGION']) ?? 'us-east-1',
    accessKeyId: asString(env['S3_ACCESS_KEY_ID']),
    secretAccessKey: asString(env['S3_SECRET_ACCESS_KEY']),
    forcePathStyle: asBool(env['S3_FORCE_PATH_STYLE'], true),
    localRoot: asString(env['STORAGE_LOCAL_ROOT']) ?? 'storage/uploads',
    apiBaseUrl:
      asString(env['MEDIA_UPLOAD_BASE_URL']) ??
      asString(env['API_PUBLIC_URL']) ??
      `http://localhost:${port}`,
  };
}

// Only raster formats are accepted. SVG is intentionally excluded (it can
// carry scripts); GIF is excluded because it is not treated by the pipeline.
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export function isAllowedImageMime(value: string): value is AllowedImageMimeType {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(value);
}

export function extensionForMime(value: AllowedImageMimeType): 'jpg' | 'png' | 'webp' {
  if (value === 'image/png') return 'png';
  if (value === 'image/webp') return 'webp';
  return 'jpg';
}
