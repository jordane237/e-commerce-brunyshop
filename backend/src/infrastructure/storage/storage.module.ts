import { Module } from '@nestjs/common';
import { STORAGE_PROVIDER, UnconfiguredStorageProvider } from './storage.provider';

@Module({
  providers: [{ provide: STORAGE_PROVIDER, useClass: UnconfiguredStorageProvider }],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
