import { InternalServerErrorException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../../../infrastructure/database/database.module';
import { OrderReferenceGenerator } from './order-reference.generator';

const AT = new Date('2026-11-17T09:00:00.000Z');

function setup(options: { prefix?: string; existing?: string[] } = {}) {
  const findUnique = vi.fn(async ({ where }: { where: { reference: string } }) =>
    (options.existing ?? []).includes(where.reference) ? { id: 'existing' } : null,
  );
  const prisma = { order: { findUnique } };
  const config = {
    get: vi.fn(() => ({ orders: { referencePrefix: options.prefix ?? 'BRN' } })),
  };
  const generator = new OrderReferenceGenerator(
    config as unknown as ConfigService,
    prisma as unknown as PrismaService,
  );
  return { generator, findUnique };
}

describe('OrderReferenceGenerator', () => {
  it('produit une référence BRN-YYMM-XXXX', async () => {
    const { generator } = setup();

    const reference = await generator.generate(AT);

    expect(reference).toMatch(/^BRN-2611-[A-Z2-9]{4}$/);
  });

  it('n’utilise jamais les caractères ambigus I, O, 0 ou 1', async () => {
    const { generator } = setup();

    const references = await Promise.all(Array.from({ length: 50 }, () => generator.generate(AT)));

    // Seul le suffixe aléatoire est contraint : le préfixe et la date YYMM
    // contiennent légitimement des chiffres.
    for (const reference of references) {
      expect(reference.slice(9)).not.toMatch(/[IO01]/);
    }
  });

  it('respecte le préfixe configuré', async () => {
    const { generator } = setup({ prefix: 'BSHOP' });

    const reference = await generator.generate(AT);

    expect(reference).toMatch(/^BSHOP-2611-[A-Z2-9]{4}$/);
  });

  it('réessaie quand la référence existe déjà en base', async () => {
    const { generator, findUnique } = setup();
    findUnique.mockResolvedValueOnce({ id: 'collision' }).mockResolvedValueOnce(null);

    const reference = await generator.generate(AT);

    expect(reference).toMatch(/^BRN-2611-[A-Z2-9]{4}$/);
    expect(findUnique).toHaveBeenCalledTimes(2);
  });

  it('échoue explicitement après 5 collisions', async () => {
    const { generator, findUnique } = setup();
    findUnique.mockResolvedValue({ id: 'collision' });

    await expect(generator.generate(AT)).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(findUnique).toHaveBeenCalledTimes(5);
  });
});
