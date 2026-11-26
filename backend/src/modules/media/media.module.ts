import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { AuditModule } from '../audit/audit.module';
import { CatalogModule } from '../catalog/catalog.module';
import { AdminMediaController } from './admin-media.controller';
import { ImageProcessorService } from './image-processor.service';
import { MediaLocalController } from './media-local.controller';
import { MediaService } from './media.service';

@Module({
  imports: [DatabaseModule, AuditModule, CatalogModule, StorageModule],
  controllers: [AdminMediaController, MediaLocalController],
  providers: [MediaService, ImageProcessorService],
  exports: [MediaService],
})
export class MediaModule {}
