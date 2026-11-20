import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../../infrastructure/database/database.module';
import type { AuditLogService } from '../../audit/audit.service';
import type { CatalogCacheService } from '../cache/catalog-cache.service';
import { SizeGuidesService } from './size-guides.service';

const NOW = new Date('2026-11-10T12:00:00.000Z');
const ACTOR = { userId: 'user-1', ip: '127.0.0.1', userAgent: 'vitest' };

function guide(overrides: Record<string, unknown> = {}) {
  return {
    id: 'guide-1',
    name: 'Guide des pointures',
    slug: 'guide-pointures',
    description: 'Mesurez votre pied.',
    table: {
      men: [
        { eu: 42, us: 8.5, uk: 8, cm: 26.5 },
        { eu: 41, us: 8, uk: 7.5, cm: 25.7 },
      ],
      women: [{ eu: 38, us: 7.5, uk: 5.5, cm: 24.1 }],
      kids: [{ eu: 30, us: 9.5, uk: 9, cm: 18.4 }],
    },
    version: 'v1',
    publishedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeService() {
  const prisma = {
    category: { findUnique: vi.fn() },
    sizeGuide: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(prisma)),
  };
  const cache = {
    getSizeGuide: vi.fn().mockResolvedValue(null),
    setSizeGuide: vi.fn().mockResolvedValue(undefined),
    invalidateSizeGuides: vi.fn().mockResolvedValue(undefined),
  };
  const audit = { record: vi.fn().mockResolvedValue(undefined) };
  const service = new SizeGuidesService(
    prisma as unknown as PrismaService,
    cache as unknown as CatalogCacheService,
    audit as unknown as AuditLogService,
  );
  return { service, prisma, cache, audit };
}

describe('SizeGuidesService — lecture publique', () => {
  it('retourne le guide lié et trie les pointures EU', async () => {
    const { service, prisma, cache } = makeService();
    prisma.category.findUnique.mockResolvedValue({ id: 'cat-1', sizeGuideId: 'guide-1' });
    prisma.sizeGuide.findUnique.mockResolvedValue(guide());

    const result = await service.getByCategoryId('cat-1');

    expect(result.table.men?.map((entry) => entry.eu)).toEqual([41, 42]);
    expect(result).toMatchObject({ id: 'guide-1', version: 'v1', slug: 'guide-pointures' });
    expect(cache.setSizeGuide).toHaveBeenCalledWith('cat-1', result);
  });

  it('sert un cache hit sans interroger Prisma', async () => {
    const { service, prisma, cache } = makeService();
    const cached = { id: 'guide-1', version: 'v1' };
    cache.getSizeGuide.mockResolvedValue(cached);

    await expect(service.getByCategoryId('cat-1')).resolves.toBe(cached);
    expect(prisma.category.findUnique).not.toHaveBeenCalled();
  });

  it('renvoie 404 CATEGORY_NOT_FOUND pour une catégorie inconnue', async () => {
    const { service, prisma } = makeService();
    prisma.category.findUnique.mockResolvedValue(null);

    await expect(service.getByCategoryId('inconnue')).rejects.toMatchObject({
      response: { code: 'CATEGORY_NOT_FOUND' },
    });
  });

  it('renvoie 404 SIZE_GUIDE_NOT_FOUND sans guide lié', async () => {
    const { service, prisma } = makeService();
    prisma.category.findUnique.mockResolvedValue({ id: 'cat-1', sizeGuideId: null });

    await expect(service.getByCategoryId('cat-1')).rejects.toMatchObject({
      response: { code: 'SIZE_GUIDE_NOT_FOUND' },
    });
    expect(prisma.sizeGuide.findUnique).not.toHaveBeenCalled();
  });

  it('renvoie 404 SIZE_GUIDE_NOT_FOUND si la FK pointe vers un guide absent', async () => {
    const { service, prisma } = makeService();
    prisma.category.findUnique.mockResolvedValue({ id: 'cat-1', sizeGuideId: 'guide-1' });
    prisma.sizeGuide.findUnique.mockResolvedValue(null);

    await expect(service.getByCategoryId('cat-1')).rejects.toMatchObject({
      response: { code: 'SIZE_GUIDE_NOT_FOUND' },
    });
  });
});

describe('SizeGuidesService — mise à jour admin', () => {
  it('incrémente la version, trie la table, audite et invalide le cache', async () => {
    const { service, prisma, cache, audit } = makeService();
    prisma.sizeGuide.findUnique.mockResolvedValue(guide());
    prisma.sizeGuide.update.mockImplementation((args: { data: Record<string, unknown> }) =>
      Promise.resolve(guide({ ...args.data, version: 'v2', updatedAt: new Date() })),
    );

    const result = await service.update(
      'guide-1',
      {
        table: {
          men: [
            { eu: 43, us: 9.5, uk: 9, cm: 27.3 },
            { eu: 41, us: 8, uk: 7.5, cm: 25.7 },
          ],
        },
      },
      ACTOR,
    );

    expect(result.version).toBe('v2');
    expect(result.table.men?.map((entry) => entry.eu)).toEqual([41, 43]);
    expect(prisma.sizeGuide.update).toHaveBeenCalledWith({
      where: { id: 'guide-1' },
      data: expect.objectContaining({
        version: 'v2',
        table: { men: expect.any(Array) },
      }),
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        action: 'SIZE_GUIDE_UPDATED',
        before: expect.objectContaining({ version: 'v1', counts: { men: 2, women: 1, kids: 1 } }),
        after: expect.objectContaining({ version: 'v2', counts: { men: 2, women: 0, kids: 0 } }),
      }),
    );
    expect(cache.invalidateSizeGuides).toHaveBeenCalledOnce();
  });

  it('ne modifie pas la version quand seul le nom change', async () => {
    const { service, prisma } = makeService();
    prisma.sizeGuide.findUnique.mockResolvedValue(guide());
    prisma.sizeGuide.update.mockResolvedValue(guide({ name: 'Nouveau nom', version: 'v1' }));

    const result = await service.update('guide-1', { name: 'Nouveau nom' }, ACTOR);

    expect(result.version).toBe('v1');
    expect(prisma.sizeGuide.update).toHaveBeenCalledWith({
      where: { id: 'guide-1' },
      data: { name: 'Nouveau nom' },
    });
  });

  it('refuse un doublon EU par public (400 VALIDATION_ERROR)', async () => {
    const { service, prisma } = makeService();
    prisma.sizeGuide.findUnique.mockResolvedValue(guide());

    await expect(
      service.update(
        'guide-1',
        {
          table: {
            men: [
              { eu: 42, us: 8, uk: 7, cm: 26 },
              { eu: 42, us: 9, uk: 8, cm: 27 },
            ],
          },
        },
        ACTOR,
      ),
    ).rejects.toMatchObject({ response: { code: 'VALIDATION_ERROR' } });
    expect(prisma.sizeGuide.update).not.toHaveBeenCalled();
  });

  it('refuse une table vide', async () => {
    const { service, prisma } = makeService();
    prisma.sizeGuide.findUnique.mockResolvedValue(guide());

    await expect(service.update('guide-1', { table: { men: [] } }, ACTOR)).rejects.toMatchObject({
      response: { code: 'VALIDATION_ERROR' },
    });
  });

  it('refuse une entrée non positive', async () => {
    const { service, prisma } = makeService();
    prisma.sizeGuide.findUnique.mockResolvedValue(guide());

    await expect(
      service.update('guide-1', { table: { women: [{ eu: 0, us: 5, uk: 3, cm: 22 }] } }, ACTOR),
    ).rejects.toMatchObject({ response: { code: 'VALIDATION_ERROR' } });
  });

  it('refuse un body vide', async () => {
    const { service, prisma } = makeService();
    prisma.sizeGuide.findUnique.mockResolvedValue(guide());

    await expect(service.update('guide-1', {}, ACTOR)).rejects.toMatchObject({
      response: { code: 'VALIDATION_ERROR' },
    });
  });

  it('renvoie 404 pour un guide inconnu', async () => {
    const { service, prisma } = makeService();
    prisma.sizeGuide.findUnique.mockResolvedValue(null);

    await expect(service.update('guide-inconnu', { name: 'X' }, ACTOR)).rejects.toMatchObject({
      response: { code: 'SIZE_GUIDE_NOT_FOUND' },
    });
  });

  it('ne fait rien si la table envoyée est identique (version inchangée)', async () => {
    const { service, prisma } = makeService();
    prisma.sizeGuide.findUnique.mockResolvedValue(guide());

    const result = await service.update(
      'guide-1',
      {
        table: {
          men: [
            { eu: 41, us: 8, uk: 7.5, cm: 25.7 },
            { eu: 42, us: 8.5, uk: 8, cm: 26.5 },
          ],
          women: [{ eu: 38, us: 7.5, uk: 5.5, cm: 24.1 }],
          kids: [{ eu: 30, us: 9.5, uk: 9, cm: 18.4 }],
        },
      },
      ACTOR,
    );

    expect(result.version).toBe('v1');
    expect(prisma.sizeGuide.update).not.toHaveBeenCalled();
  });
});
