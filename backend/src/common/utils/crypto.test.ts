import { describe, expect, it } from 'vitest';

import { decryptSecret, encryptSecret, randomToken, sha256hex } from './crypto';

describe('crypto utils', () => {
  const masterKey = 'unit-test-master-key';

  it('chiffre puis déchiffre un secret TOTP (roundtrip)', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const payload = encryptSecret(secret, masterKey);
    expect(payload).not.toContain(secret);
    expect(decryptSecret(payload, masterKey)).toBe(secret);
  });

  it('refuse un payload altéré (AES-GCM)', () => {
    const payload = Buffer.from(encryptSecret('secret', masterKey), 'base64');
    payload[payload.length - 1] ^= 0xff;
    expect(() => decryptSecret(payload.toString('base64'), masterKey)).toThrow();
  });

  it('refuse une autre clé maîtresse', () => {
    const payload = encryptSecret('secret', masterKey);
    expect(() => decryptSecret(payload, 'other-key')).toThrow();
  });

  it('les jetons opaques sont uniques et de taille suffisante', () => {
    const a = randomToken(32);
    const b = randomToken(32);
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(43);
  });

  it('sha256hex est déterministe en hex', () => {
    expect(sha256hex('bruny')).toBe(sha256hex('bruny'));
    expect(sha256hex('bruny')).toMatch(/^[0-9a-f]{64}$/);
  });
});
