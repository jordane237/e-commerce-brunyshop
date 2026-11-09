import { Module } from '@nestjs/common';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { CatalogCacheService } from './cache/catalog-cache.service';
import { AdminProductsController } from './admin/admin-products.controller';
import { AdminProductsService } from './admin/admin-products.service';
import { SlugGeneratorService } from './admin/slug/slug-generator.service';
import { SkuGeneratorService } from './admin/sku/sku-generator.service';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { ProductDetailService } from './products/product-detail.service';

@Module({
  // CacheModule is not @Global: it must be imported to inject RedisService.
  imports: [DatabaseModule, AuditModule, CacheModule],
  controllers: [CatalogController, AdminProductsController],
  providers: [
    CatalogService,
    CatalogCacheService,
    ProductDetailService,
    AdminProductsService,
    SlugGeneratorService,
    SkuGeneratorService,
  ],
  exports: [CatalogService, CatalogCacheService, ProductDetailService],
})
export class CatalogModule {}
