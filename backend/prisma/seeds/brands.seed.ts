// BRUNY SHOPPING — marques (TEC-07).
//
// Marques uniques par `Brand.slug` (upsert). Le cahier des charges
// propose soit 4 marques génériques, soit des marques locales
// camerounaises. On choisit une liste de marques locales
// camerounaises (économie locale, chaussures du Cameroun) et on
// documente cette décision dans le README seed.
// Dépendances : aucune (exécuté après categories.seed).
import type { PrismaClient } from '../../src/generated/prisma/client';

const BRANDS = [
  { name: 'Barrage Foot', slug: 'barrage-foot' },
  { name: 'Cameroon Sports', slug: 'cameroon-sports' },
  { name: 'Kepe', slug: 'kepe' },
  { name: 'LeSportif', slug: 'lesportif' },
] as const;

export async function seedBrands(prisma: PrismaClient): Promise<void> {
  for (const brand of BRANDS) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      create: brand,
      update: { name: brand.name },
    });
  }
}
