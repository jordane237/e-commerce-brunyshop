import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FakeStorageProvider } from './providers/fake-storage.provider';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { STORAGE_PROVIDER } from './providers/storage-provider.interface';
import type { StorageProvider } from './providers/storage-provider.interface';
import type { StorageSettings } from './storage.settings';

export { STORAGE_PROVIDER };

@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService): StorageProvider => {
        const settings = config.getOrThrow<StorageSettings>('app.storage');
        if (settings.provider === 'fake') return new FakeStorageProvider(settings);
        if (settings.provider === 'local') {
          return new LocalStorageProvider(settings, config.getOrThrow<string>('JWT_ACCESS_SECRET'));
        }
        return new S3StorageProvider(settings);
      },
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
