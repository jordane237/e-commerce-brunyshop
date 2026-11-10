import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';

import { RedisService } from '../../../infrastructure/cache/cache.module';
import type { ProductDetailDto } from '../dto/product-detail.dto';
import type { ProductFacetsDto, ProductListResponseDto } from '../dto/product-list.dto';
import type { SizeGuideResponseDto } from '../size-guides/dto/size-guide-response.dto';

// Catalogue cache (CAT-02 / CAT-03).
//
// Keys:
//   catalog:products:detail:{slug}:v1   — product detail (CAT-03)
//   catalog:products:list:{hash}:v1     — one entry per normalized list query
//   catalog:products:facets:v1          — global facets
// invalidateProducts() sweeps them all with SCAN.
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

  private get listTtlSeconds(): number {
    return Number(this.config.get<number>('app.catalog.productsListTtlSeconds') ?? 60);
  }

  private get sizeGuidesTtlSeconds(): number {
    return Number(this.config.get<number>('app.catalog.sizeGuidesTtlSeconds') ?? 1800);
  }

  static detailKey(slug: string): string {
    return `catalog:products:detail:${slug}:v1`;
  }

  // The query object is built with a fixed key order by the caller; hashing it
  // keeps keys short and avoids leaking free-text searches into Redis keys.
  static listKey(query: Record<string, unknown>): string {
    const hash = createHash('sha1').update(JSON.stringify(query)).digest('hex').slice(0, 20);
    return `catalog:products:list:${hash}:v1`;
  }

  static facetsKey(): string {
    return 'catalog:products:facets:v1';
  }

  static sizeGuideKey(categoryId: string): string {
    return `catalog:size-guides:${categoryId}:v1`;
  }

  private async readJson<T>(key: string, label: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (error) {
      this.logger.warn({ err: error, key }, `${label} cache read failed, serving from DB`);
      return null;
    }
  }

  private async writeJson(key: string, value: unknown, ttlSeconds: number, label: string) {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn({ err: error, key }, `${label} cache write failed`);
    }
  }

  getProductDetail(slug: string): Promise<ProductDetailDto | null> {
    return this.readJson<ProductDetailDto>(CatalogCacheService.detailKey(slug), 'catalog detail');
  }

  async setProductDetail(slug: string, detail: ProductDetailDto): Promise<void> {
    await this.writeJson(
      CatalogCacheService.detailKey(slug),
      detail,
      this.detailTtlSeconds,
      'catalog detail',
    );
  }

  getProductsList(query: Record<string, unknown>): Promise<ProductListResponseDto | null> {
    return this.readJson<ProductListResponseDto>(
      CatalogCacheService.listKey(query),
      'catalog list',
    );
  }

  async setProductsList(
    query: Record<string, unknown>,
    list: ProductListResponseDto,
  ): Promise<void> {
    await this.writeJson(
      CatalogCacheService.listKey(query),
      list,
      this.listTtlSeconds,
      'catalog list',
    );
  }

  getProductsFacets(): Promise<ProductFacetsDto | null> {
    return this.readJson<ProductFacetsDto>(CatalogCacheService.facetsKey(), 'catalog facets');
  }

  async setProductsFacets(facets: ProductFacetsDto): Promise<void> {
    await this.writeJson(
      CatalogCacheService.facetsKey(),
      facets,
      this.listTtlSeconds,
      'catalog facets',
    );
  }

  getSizeGuide(categoryId: string): Promise<SizeGuideResponseDto | null> {
    return this.readJson<SizeGuideResponseDto>(
      CatalogCacheService.sizeGuideKey(categoryId),
      'catalog size guide',
    );
  }

  async setSizeGuide(categoryId: string, guide: SizeGuideResponseDto): Promise<void> {
    await this.writeJson(
      CatalogCacheService.sizeGuideKey(categoryId),
      guide,
      this.sizeGuidesTtlSeconds,
      'catalog size guide',
    );
  }

  // Invalidates size guides only; product/category caches stay untouched.
  async invalidateSizeGuides(): Promise<void> {
    try {
      let cursor = '0';
      let iterations = 0;
      do {
        const [nextCursor, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          'catalog:size-guides:*',
          'COUNT',
          CatalogCacheService.SCAN_COUNT,
        );
        cursor = nextCursor;
        if (keys.length > 0) await this.redis.del(...keys);
        iterations += 1;
      } while (cursor !== '0' && iterations < CatalogCacheService.SCAN_MAX_ITERATIONS);
    } catch (error) {
      this.logger.warn({ err: error }, 'catalog size guides cache invalidation failed');
    }
  }

  // Invalidates every catalogue product cache entry (detail, list, facets).
  // SCAN is used instead of KEYS to keep Redis responsive on large keyspaces.
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
