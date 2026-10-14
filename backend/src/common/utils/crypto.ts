import { randomBytes, createHash, createCipheriv, createDecipheriv, scryptSync } from 'node:crypto';

// Hex SHA-256 — used for opaque refresh tokens (already 256-bit random,
// a slow hash is not required) and password-reset codes.
export function sha256hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

// Random opaque token (URL-safe, 256 bits) for refresh cookies and reset codes.
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

// AES-256-GCM envelope for secrets at rest (2FA TOTP secrets, cachier §10.2:
// "secret chiffré en base"). Output: base64(iv || tag || ciphertext).
function deriveKey(masterKey: string): Buffer {
  return scryptSync(masterKey, 'bruny:2fa', 32);
}

export function encryptSecret(plaintext: string, masterKey: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(masterKey), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
}

export function decryptSecret(payload: string, masterKey: string): string {
  const raw = Buffer.from(payload, 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', deriveKey(masterKey), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
