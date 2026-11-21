import { describe, expect, it, vi } from 'vitest';

import type { ConfigService } from '@nestjs/config';
import type { PinoLogger } from 'nestjs-pino';
import type { RedisService } from '../../../infrastructure/cache/cache.module';
import { CatalogCacheService } from './catalog-cache.service';

function makeService() {
  const redis = {
    get: vi.fn(),
    set: vi.fn(),
    scan: vi.fn(),
    del: vi.fn(),
  };
  const logger = { setContext: vi.fn(), warn: vi.fn() };
  const config = {
    get: vi.fn((key: string) =>
      key === 'app.catalog.productsListTtlSeconds'
        ? 60
        : key === 'app.catalog.sizeGuidesTtlSeconds'
          ? 1800
          : 300,
    ),
  };
  const service = new CatalogCacheService(
    { redis } as unknown as RedisService,
    config as unknown as ConfigService,
    logger as unknown as PinoLogger,
  );
  return { service, redis, logger, config };
}

describe('CatalogCacheService', () => {
  it('utilise une clé de détail distincte des clés de liste', () => {
    expect(CatalogCacheService.detailKey('sneakers-urbanstep-air')).toBe(
      'catalog:products:detail:sneakers-urbanstep-air:v1',
    );
  });

  it('retourne la fiche désérialisée en cas de hit', async () => {
    const { service, redis } = makeService();
    redis.get.mockResolvedValue(JSON.stringify({ slug: 'sneakers-urbanstep-air' }));

    await expect(service.getProductDetail('sneakers-urbanstep-air')).resolves.toEqual({
      slug: 'sneakers-urbanstep-air',
    });
    expect(redis.get).toHaveBeenCalledWith('catalog:products:detail:sneakers-urbanstep-air:v1');
  });

  it('retourne null en cas de miss', async () => {
    const { service, redis } = makeService();
    redis.get.mockResolvedValue(null);

    await expect(service.getProductDetail('inconnu')).resolves.toBeNull();
  });

  it('échoue en open (null + log) quand Redis ne répond pas', async () => {
    const { service, redis, logger } = makeService();
    redis.get.mockRejectedValue(new Error('redis down'));

    await expect(service.getProductDetail('inconnu')).resolves.toBeNull();
    expect(logger.warn).toHaveBeenCalled();
  });

  it('écrit la fiche avec le TTL configuré', async () => {
    const { service, redis, config } = makeService();
    config.get.mockReturnValue(120);
    const detail = { slug: 'sneakers-urbanstep-air' };

    await service.setProductDetail('sneakers-urbanstep-air', detail as never);

    expect(redis.set).toHaveBeenCalledWith(
      'catalog:products:detail:sneakers-urbanstep-air:v1',
      JSON.stringify(detail),
      'EX',
      120,
    );
  });

  it('n’échoue pas si l’écriture cache échoue', async () => {
    const { service, redis, logger } = makeService();
    redis.set.mockRejectedValue(new Error('redis down'));

    await expect(
      service.setProductDetail('sneakers-urbanstep-air', { slug: 'x' } as never),
    ).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalled();
  });

  it('dérive une clé de liste stable et distincte par requête', () => {
    const first = CatalogCacheService.listKey({ page: 1, limit: 12, sort: 'newest' });
    const same = CatalogCacheService.listKey({ page: 1, limit: 12, sort: 'newest' });
    const other = CatalogCacheService.listKey({ page: 2, limit: 12, sort: 'newest' });

    expect(first).toMatch(/^catalog:products:list:[0-9a-f]{20}:v1$/);
    expect(first).toBe(same);
    expect(first).not.toBe(other);
    expect(CatalogCacheService.facetsKey()).toBe('catalog:products:facets:v1');
  });

  it('cache la liste avec le TTL configuré', async () => {
    const { service, redis } = makeService();
    const list = { items: [], pagination: {}, facets: {} };

    await service.setProductsList({ page: 1 }, list as never);

    expect(redis.set).toHaveBeenCalledWith(
      CatalogCacheService.listKey({ page: 1 }),
      JSON.stringify(list),
      'EX',
      60,
    );
  });

  it('lit la liste et les facettes en cache', async () => {
    const { service, redis } = makeService();
    redis.get.mockResolvedValue(JSON.stringify({ items: [], facets: {} }));

    await expect(service.getProductsList({ page: 1 })).resolves.toEqual({ items: [], facets: {} });
    await expect(service.getProductsFacets()).resolves.toEqual({ items: [], facets: {} });
    expect(redis.get).toHaveBeenCalledWith(CatalogCacheService.facetsKey());
  });

  it('invalide toutes les clés catalogue via SCAN, pas KEYS', async () => {
    const { service, redis } = makeService();
    redis.scan
      .mockResolvedValueOnce([
        '12',
        ['catalog:products:detail:a:v1', 'catalog:products:detail:b:v1'],
      ])
      .mockResolvedValueOnce(['0', ['catalog:products:list:1:v1']]);
    redis.del.mockResolvedValue(2);

    await service.invalidateProducts();

    expect(redis.scan).toHaveBeenCalledTimes(2);
    expect(redis.scan).toHaveBeenCalledWith('0', 'MATCH', 'catalog:products:*', 'COUNT', 100);
    expect(redis.del).toHaveBeenNthCalledWith(
      1,
      'catalog:products:detail:a:v1',
      'catalog:products:detail:b:v1',
    );
    expect(redis.del).toHaveBeenNthCalledWith(2, 'catalog:products:list:1:v1');
  });

  it('utilise une clé de guide distincte et le TTL de 30 min', async () => {
    const { service, redis } = makeService();
    const guide = { id: 'guide-1', version: 'v1' };

    expect(CatalogCacheService.sizeGuideKey('cat-1')).toBe('catalog:size-guides:cat-1:v1');
    await service.setSizeGuide('cat-1', guide as never);
    expect(redis.set).toHaveBeenCalledWith(
      'catalog:size-guides:cat-1:v1',
      JSON.stringify(guide),
      'EX',
      1800,
    );
    redis.get.mockResolvedValue(JSON.stringify(guide));
    await expect(service.getSizeGuide('cat-1')).resolves.toEqual(guide);
  });

  it('invalide uniquement les guides via SCAN', async () => {
    const { service, redis } = makeService();
    redis.scan.mockResolvedValueOnce(['0', ['catalog:size-guides:cat-1:v1']]);

    await service.invalidateSizeGuides();

    expect(redis.scan).toHaveBeenCalledWith('0', 'MATCH', 'catalog:size-guides:*', 'COUNT', 100);
    expect(redis.del).toHaveBeenCalledWith('catalog:size-guides:cat-1:v1');
  });

  it('n’échoue pas si l’invalidation cache échoue', async () => {
    const { service, redis, logger } = makeService();
    redis.scan.mockRejectedValue(new Error('redis down'));

    await expect(service.invalidateProducts()).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalled();
  });
});
