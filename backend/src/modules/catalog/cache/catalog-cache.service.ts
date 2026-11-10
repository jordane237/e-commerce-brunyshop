import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';

import { RedisService } from '../../../infrastructure/cache/cache.module';
import type { ProductDetailDto } from '../dto/product-detail.dto';

// Product detail cache (CAT-03).
//
// Key: catalog:products:detail:{slug}:v1 — deliberately distinct from the
// future catalogue list keys (catalog:products:list:*, catalog:products:facets:*),
// so invalidateProducts() can sweep them all without touching anything else.
//
// Fail-open by design: Redis is not on the read path for correctness. Any Redis
// error is logged and treated as a cache miss, so the catalogue stays available
// when the cache is degraded (readiness still reports the Redis outage).
@Injectable()
export class CatalogCacheService {
  // SCAN batch size and hard stop: bounded work per invalidation call.
  private static readonly SCAN_COUNT = 100;
  private static readonly SCAN_MAX_ITERATIONS = 1000;

  constructor(
    private readonly redisService: RedisService,
    private readonly config: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CatalogCacheService.name);
  }

  private get redis() {
    return this.redisService.redis;
  }

  private get detailTtlSeconds(): number {
    return Number(this.config.get<number>('app.catalog.productDetailTtlSeconds') ?? 300);
  }

  static detailKey(slug: string): string {
    return `catalog:products:detail:${slug}:v1`;
  }

  async getProductDetail(slug: string): Promise<ProductDetailDto | null> {
    try {
      const raw = await this.redis.get(CatalogCacheService.detailKey(slug));
      if (raw === null) return null;
      return JSON.parse(raw) as ProductDetailDto;
    } catch (error) {
      this.logger.warn({ err: error, slug }, 'catalog detail cache read failed, serving from DB');
      return null;
    }
  }

  async setProductDetail(slug: string, detail: ProductDetailDto): Promise<void> {
    try {
      await this.redis.set(
        CatalogCacheService.detailKey(slug),
        JSON.stringify(detail),
        'EX',
        this.detailTtlSeconds,
      );
    } catch (error) {
      this.logger.warn({ err: error, slug }, 'catalog detail cache write failed');
    }
  }

  // Invalidates every catalogue product cache entry (detail today, list and
  // facets once CAT-02 lands). SCAN is used instead of KEYS to keep Redis
  // responsive on large keyspaces.
  async invalidateProducts(): Promise<void> {
    try {
      let cursor = '0';
      let iterations = 0;
      do {
        const [nextCursor, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          'catalog:products:*',
          'COUNT',
          CatalogCacheService.SCAN_COUNT,
        );
        cursor = nextCursor;
        if (keys.length > 0) await this.redis.del(...keys);
        iterations += 1;
      } while (cursor !== '0' && iterations < CatalogCacheService.SCAN_MAX_ITERATIONS);
    } catch (error) {
      this.logger.warn({ err: error }, 'catalog cache invalidation failed');
    }
  }
}
