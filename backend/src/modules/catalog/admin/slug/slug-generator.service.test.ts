import { InternalServerErrorException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../../../infrastructure/database/database.module';
import { SlugGeneratorService, slugify } from './slug-generator.service';

function makeService(existing: Array<{ id: string; slug: string }> = []) {
  const findUnique = vi.fn(
    async ({ where }: { where: { slug: string } }) =>
      existing.find((row) => row.slug === where.slug) ?? null,
  );
  const service = new SlugGeneratorService({
    product: { findUnique },
  } as unknown as PrismaService);
  return { service, findUnique };
}

describe('slugify', () => {
  it('normalise espaces et majuscules', () => {
    expect(slugify('Sneakers Air Max 90')).toBe('sneakers-air-max-90');
  });

  it('supprime les accents', () => {
    expect(slugify('Chaussures Élégantes Été')).toBe('chaussures-elegantes-ete');
  });

  it('réduit les séparateurs multiples et les bords', () => {
    expect(slugify('  --Baskets   /  Running--  ')).toBe('baskets-running');
  });
});

describe('SlugGeneratorService', () => {
  it('retourne le slug libre quand aucun produit ne le possède', async () => {
    const { service } = makeService();
    await expect(service.generateUniqueSlug('Sneakers Air Max 90')).resolves.toBe(
      'sneakers-air-max-90',
    );
  });

  it('suffixe -2 quand le slug est déjà pris', async () => {
    const { service } = makeService([{ id: 'p1', slug: 'sneakers-air-max-90' }]);
    await expect(service.generateUniqueSlug('Sneakers Air Max 90')).resolves.toBe(
      'sneakers-air-max-90-2',
    );
  });

  it('incrémente jusqu’à -3 quand -2 est aussi pris', async () => {
    const { service } = makeService([
      { id: 'p1', slug: 'sneakers-air-max-90' },
      { id: 'p2', slug: 'sneakers-air-max-90-2' },
    ]);
    await expect(service.generateUniqueSlug('Sneakers Air Max 90')).resolves.toBe(
      'sneakers-air-max-90-3',
    );
  });

  it('accepte de conserver son propre slug lors d’une mise à jour', async () => {
    const { service } = makeService([{ id: 'self', slug: 'sneakers-air-max-90' }]);
    await expect(service.generateUniqueSlug('Sneakers Air Max 90', 'self')).resolves.toBe(
      'sneakers-air-max-90',
    );
  });

  it('refuse un nom qui ne produit aucun caractère exploitable', async () => {
    const { service } = makeService();
    await expect(service.generateUniqueSlug('!!! ???')).rejects.toMatchObject({
      response: { code: 'INVALID_SLUG' },
    });
  });

  it('échoue explicitement après 100 collisions', async () => {
    const root = 'sneakers-air';
    const taken = Array.from({ length: 100 }, (_, index) => ({
      id: `p${index}`,
      slug: index === 0 ? root : `${root}-${index + 1}`,
    }));
    const { service } = makeService(taken);
    await expect(service.generateUniqueSlug('Sneakers Air')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
