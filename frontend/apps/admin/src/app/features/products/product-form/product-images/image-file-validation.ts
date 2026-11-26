const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

/**
 * Reads the magic bytes instead of trusting the browser MIME or the extension.
 * A renamed PDF is therefore rejected before any signed URL is requested.
 */
export async function detectImageMime(file: File): Promise<string | null> {
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  } catch {
    return null;
  }

  if (startsWith(bytes, JPEG_SIGNATURE)) return 'image/jpeg';
  if (startsWith(bytes, PNG_SIGNATURE)) return 'image/png';
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff === 'RIFF' && webp === 'WEBP') return 'image/webp';
  return null;
}

export interface ImageValidationResult {
  mime: string | null;
  error: string | null;
}

export async function validateImageFile(
  file: File,
  maxBytes: number,
  allowedMimeTypes: readonly string[],
): Promise<ImageValidationResult> {
  if (file.size === 0) {
    return { mime: null, error: 'Ce fichier est vide.' };
  }
  if (file.size > maxBytes) {
    return {
      mime: null,
      error: `Fichier trop volumineux (${formatMegabytes(maxBytes)} Mo maximum).`,
    };
  }

  const mime = await detectImageMime(file);
  if (!mime || !allowedMimeTypes.includes(mime)) {
    return {
      mime: null,
      error: 'Format non pris en charge. Utilisez une image JPEG, PNG ou WebP.',
    };
  }
  return { mime, error: null };
}

export function formatMegabytes(bytes: number): string {
  return String(Math.round((bytes / (1024 * 1024)) * 10) / 10).replace('.', ',');
}

export function colorToSlug(color: string): string {
  return color
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
