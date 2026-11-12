import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../../../infrastructure/database/database.module';
import { SkuGeneratorService, variantKey } from './sku-generator.service';

function makeService(existingSkus: string[] = []) {
  const findUnique = vi.fn(async ({ where }: { where: { sku: string } }) =>
    existingSkus.includes(where.sku) ? { id: `variant-${where.sku}` } : null,
  );
  const findMany = vi.fn(async ({ where }: { where: { sku: { in: string[] } } }) =>
    existingSkus.filter((sku) => where.sku.in.includes(sku)).map((sku) => ({ sku })),
  );
  const service = new SkuGeneratorService({
    productVariant: { findUnique, findMany },
  } as unknown as PrismaService);
  return { service, findUnique, findMany };
}

describe('SkuGeneratorService', () => {
  it('génère un SKU au format du seed', async () => {
    const { service } = makeService();
    await expect(
      service.generateSku({
        brandSlug: 'nike',
        productSlug: 'air-max-90',
        size: '42',
        color: 'noir',
      }),
    ).resolves.toBe('NIKE-AIRMAX90-42-NOIR');
  });

  it('nettoie une marque composée et une couleur avec tiret', async () => {
    const { service } = makeService();
    await expect(
      service.generateSku({
        brandSlug: 'new balance',
        productSlug: 'fresh-foam',
        size: 'xl',
        color: 'bleu-marine',
      }),
    ).resolves.toBe('NEWBALAN-FRESHFOAM-XL-BLEUMARINE');
  });

  it('suffixe -2 quand le SKU existe déjà', async () => {
    const { service } = makeService(['NIKE-AIRMAX90-42-NOIR']);
    await expect(
      service.generateSku({
        brandSlug: 'nike',
        productSlug: 'air-max-90',
        size: '42',
        color: 'noir',
      }),
    ).resolves.toBe('NIKE-AIRMAX90-42-NOIR-2');
  });

  it('accepte de conserver son propre SKU lors d’une mise à jour', async () => {
    const { service } = makeService(['NIKE-AIRMAX90-42-NOIR']);
    const sku = await service.generateSku({
      brandSlug: 'nike',
      productSlug: 'air-max-90',
      size: '42',
      color: 'noir',
      excludeId: 'variant-NIKE-AIRMAX90-42-NOIR',
    });
    expect(sku).toBe('NIKE-AIRMAX90-42-NOIR');
  });

  it('génère un lot sans collision interne', async () => {
    const { service } = makeService(['NIKE-AIRMAX90-42-NOIR']);
    const skus = await service.generateSkusForProduct('nike', 'air-max-90', [
      { color: 'noir', size: '42' },
      { color: 'blanc', size: '42' },
      { color: 'noir', size: '43' },
    ]);

    expect(skus.get(variantKey('noir', '42'))).toBe('NIKE-AIRMAX90-42-NOIR-2');
    expect(skus.get(variantKey('blanc', '42'))).toBe('NIKE-AIRMAX90-42-BLANC');
    expect(skus.get(variantKey('noir', '43'))).toBe('NIKE-AIRMAX90-43-NOIR');
    expect(new Set(skus.values()).size).toBe(3);
  });

  it('refuse un lot contenant deux fois la même variante', async () => {
    const { service } = makeService();
    await expect(
      service.generateSkusForProduct('nike', 'air-max-90', [
        { color: 'noir', size: '42' },
        { color: 'NOIR', size: '42' },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuse une marque vide', async () => {
    const { service } = makeService();
    await expect(
      service.generateSku({
        brandSlug: '   ',
        productSlug: 'air-max-90',
        size: '42',
        color: 'noir',
      }),
    ).rejects.toMatchObject({ response: { code: 'SKU_GENERATION_FAILED' } });
  });
});
