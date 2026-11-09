import { Module } from '@nestjs/common';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { CatalogCacheService } from './cache/catalog-cache.service';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { ProductDetailService } from './products/product-detail.service';

@Module({
  // CacheModule is not @Global: it must be imported to inject RedisService.
  imports: [DatabaseModule, AuditModule, CacheModule],
  controllers: [CatalogController],
  providers: [CatalogService, CatalogCacheService, ProductDetailService],
  exports: [CatalogService, CatalogCacheService, ProductDetailService],
})
export class CatalogModule {}
