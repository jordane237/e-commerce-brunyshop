"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256hex = sha256hex;
exports.randomToken = randomToken;
exports.encryptSecret = encryptSecret;
exports.decryptSecret = decryptSecret;
const node_crypto_1 = require("node:crypto");
// Hex SHA-256 — used for opaque refresh tokens (already 256-bit random,
// a slow hash is not required) and password-reset codes.
function sha256hex(input) {
    return (0, node_crypto_1.createHash)('sha256').update(input).digest('hex');
}
// Random opaque token (URL-safe, 256 bits) for refresh cookies and reset codes.
function randomToken(bytes = 32) {
    return (0, node_crypto_1.randomBytes)(bytes).toString('base64url');
}
// AES-256-GCM envelope for secrets at rest (2FA TOTP secrets, cachier §10.2:
// "secret chiffré en base"). Output: base64(iv || tag || ciphertext).
function deriveKey(masterKey) {
    return (0, node_crypto_1.scryptSync)(masterKey, 'bruny:2fa', 32);
}
function encryptSecret(plaintext, masterKey) {
    const iv = (0, node_crypto_1.randomBytes)(12);
    const cipher = (0, node_crypto_1.createCipheriv)('aes-256-gcm', deriveKey(masterKey), iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
}
function decryptSecret(payload, masterKey) {
    const raw = Buffer.from(payload, 'base64');
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);
    const decipher = (0, node_crypto_1.createDecipheriv)('aes-256-gcm', deriveKey(masterKey), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
