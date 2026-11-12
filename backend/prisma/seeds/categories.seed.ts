// BRUNY SHOPPING — catégories (TEC-07).
//
// Catégories racine et sous-catégories, uniques par `Category.slug`
// (upsert). Le modèle `Category` supporte une hiérarchie parent/child
// via `parentId`, mais le cahier des charges n'exige que des feuilles
// de catalogue. On décide de ne pas créer de sous-catégories pour
// respecter la liste exacte des 6 catégories.
// Dépendances : aucune (exécuté après users.seed).
import type { PrismaClient } from '../../src/generated/prisma/client';

const CATEGORIES = [
  { name: 'Sneakers', slug: 'sneakers', position: 0 },
  { name: 'Bottes', slug: 'bottes', position: 1 },
  { name: 'Sandales', slug: 'sandales', position: 2 },
  { name: 'Chaussures de ville', slug: 'chaussures-ville', position: 3 },
  { name: 'Chaussures de sport', slug: 'chaussures-sport', position: 4 },
  { name: 'Chaussures enfant', slug: 'chaussures-enfant', position: 5 },
] as const;

export async function seedCategories(prisma: PrismaClient): Promise<void> {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        name: category.name,
        slug: category.slug,
        position: category.position,
      },
      update: {
        name: category.name,
        position: category.position,
      },
    });
  }
}
