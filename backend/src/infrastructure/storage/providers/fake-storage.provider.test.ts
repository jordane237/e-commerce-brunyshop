import { describe, expect, it } from 'vitest';

import type { StorageSettings } from '../storage.settings';
import { FakeStorageProvider } from './fake-storage.provider';

const SETTINGS = {
  provider: 'fake',
  publicUrl: 'http://media.test/bucket',
} as StorageSettings;

describe('FakeStorageProvider', () => {
  it('stocke, relit et supprime un objet', async () => {
    const provider = new FakeStorageProvider(SETTINGS);
    const buffer = Buffer.from('image-bytes');

    const uploaded = await provider.upload({
      buffer,
      key: 'products/slug/common/a.webp',
      contentType: 'image/webp',
    });

    expect(uploaded).toMatchObject({
      key: 'products/slug/common/a.webp',
      url: 'http://media.test/bucket/products/slug/common/a.webp',
      size: buffer.length,
    });
    expect(await provider.exists('products/slug/common/a.webp')).toBe(true);
    expect((await provider.download('products/slug/common/a.webp'))?.buffer.equals(buffer)).toBe(
      true,
    );

    await provider.delete('products/slug/common/a.webp');
    expect(await provider.exists('products/slug/common/a.webp')).toBe(false);
    expect(await provider.download('products/slug/common/a.webp')).toBeNull();
  });

  it('retourne une URL presign fake et un healthcheck positif', async () => {
    const provider = new FakeStorageProvider(SETTINGS);
    await expect(provider.presignUpload('key.jpg', 'image/jpeg', 300)).resolves.toEqual({
      uploadUrl: 'fake://key.jpg',
      key: 'key.jpg',
      expiresIn: 300,
      headers: { 'Content-Type': 'image/jpeg' },
    });
    expect(await provider.healthCheck()).toBe(true);
  });

  it('simule un upload direct et vide la mémoire', () => {
    const provider = new FakeStorageProvider(SETTINGS);
    provider.putRaw('raw/key.jpg', Buffer.from('raw'));
    expect(provider.getObject('raw/key.jpg')?.contentType).toBe('application/octet-stream');
    provider.clear();
    expect(provider.getObject('raw/key.jpg')).toBeUndefined();
  });
});
