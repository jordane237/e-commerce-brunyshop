export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

export interface StoredObject {
  key: string;
  url: string;
}

export interface StorageProvider {
  put(key: string, content: Uint8Array, contentType: string): Promise<StoredObject>;
  remove(key: string): Promise<void>;
}

/** Storage contract placeholder; configure a local or cloud adapter before uploads. */
export class UnconfiguredStorageProvider implements StorageProvider {
  async put(_key: string, _content: Uint8Array, _contentType: string): Promise<StoredObject> {
    throw new Error('No storage provider is configured');
  }

  async remove(_key: string): Promise<void> {
    throw new Error('No storage provider is configured');
  }
}
