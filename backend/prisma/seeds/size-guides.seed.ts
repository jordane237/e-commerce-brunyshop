// BRUNY SHOPPING — guides des tailles (CAT-06).
//
// Source : tables de conversion EU/US/UK/cm usuellement admises
// (ISO 9407 Mondopoint, EN 13402, tables fabricants Nike/Adidas/Puma).
// ⚠️ Ces données doivent être validées par le propriétaire avant mise en
// production (ticket CNT-02). Voir docs/backend/size-guides.md.
//
// Un seul guide global porte les trois publics (men/women/kids) : la relation
// Category.sizeGuideId est unique par catégorie, et la maquette P05 n'existe
// pas encore pour trancher entre onglets et pages distinctes.
// Dépendances : categories.seed (les 6 catégories doivent exister).
import type { PrismaClient } from '../../src/generated/prisma/client';
import type { SizeGuideTable } from '../../src/modules/catalog/size-guides/size-guide.types';

const GUIDE_SLUG = 'guide-pointures-brunyshop';

const TABLE: SizeGuideTable = {
  men: [
    { eu: 39, us: 6.5, uk: 6, cm: 24.5 },
    { eu: 40, us: 7, uk: 6.5, cm: 25.0 },
    { eu: 41, us: 8, uk: 7.5, cm: 25.7 },
    { eu: 42, us: 8.5, uk: 8, cm: 26.5 },
    { eu: 43, us: 9.5, uk: 9, cm: 27.3 },
    { eu: 44, us: 10, uk: 9.5, cm: 28.0 },
    { eu: 45, us: 11, uk: 10.5, cm: 28.8 },
    { eu: 46, us: 12, uk: 11.5, cm: 29.5 },
    { eu: 47, us: 12.5, uk: 12, cm: 30.2 },
    { eu: 48, us: 13, uk: 12.5, cm: 31.0 },
  ],
  women: [
    { eu: 35, us: 5, uk: 3, cm: 22.0 },
    { eu: 36, us: 5.5, uk: 3.5, cm: 22.8 },
    { eu: 37, us: 6.5, uk: 4.5, cm: 23.5 },
    { eu: 38, us: 7.5, uk: 5.5, cm: 24.1 },
    { eu: 39, us: 8.5, uk: 6.5, cm: 24.8 },
    { eu: 40, us: 9, uk: 7, cm: 25.5 },
    { eu: 41, us: 10, uk: 8, cm: 26.2 },
    { eu: 42, us: 11, uk: 9, cm: 26.8 },
    { eu: 43, us: 12, uk: 10, cm: 27.5 },
  ],
  kids: [
    { eu: 20, us: 4.5, uk: 3.5, cm: 12.0 },
    { eu: 21, us: 5, uk: 4.5, cm: 12.7 },
    { eu: 22, us: 5.5, uk: 5, cm: 13.3 },
    { eu: 23, us: 6, uk: 5.5, cm: 14.0 },
    { eu: 24, us: 6.5, uk: 6, cm: 14.6 },
    { eu: 25, us: 7, uk: 6.5, cm: 15.2 },
    { eu: 26, us: 7.5, uk: 7, cm: 15.9 },
    { eu: 27, us: 8, uk: 7.5, cm: 16.5 },
    { eu: 28, us: 8.5, uk: 8, cm: 17.1 },
    { eu: 29, us: 9, uk: 8.5, cm: 17.8 },
    { eu: 30, us: 9.5, uk: 9, cm: 18.4 },
    { eu: 31, us: 10, uk: 9.5, cm: 19.1 },
    { eu: 32, us: 10.5, uk: 10, cm: 19.7 },
    { eu: 33, us: 11, uk: 10.5, cm: 20.3 },
    { eu: 34, us: 11.5, uk: 11, cm: 21.0 },
    { eu: 35, us: 12, uk: 11.5, cm: 21.6 },
    { eu: 36, us: 12.5, uk: 12, cm: 22.2 },
    { eu: 37, us: 13, uk: 12.5, cm: 22.9 },
    { eu: 38, us: 13.5, uk: 13, cm: 23.5 },
  ],
};

const DESCRIPTION =
  'Mesurez votre pied du talon au bout de l’orteil le plus long, debout et en fin de journée. Ajoutez 0,5 à 1 cm pour le confort. En cas d’hésitation entre deux pointures, choisissez la plus grande.';

/**
 * Creates the initial guide and links every root category. Admin edits are
 * preserved on re-seed because only `create` writes the table; `update` is
 * intentionally empty.
 */
export async function seedSizeGuides(prisma: PrismaClient): Promise<void> {
  const guide = await prisma.sizeGuide.upsert({
    where: { slug: GUIDE_SLUG },
    create: {
      name: 'Guide des pointures — Homme, Femme, Enfant',
      slug: GUIDE_SLUG,
      description: DESCRIPTION,
      table: TABLE,
      version: 'v1',
      publishedAt: new Date('2026-11-10T00:00:00.000Z'),
    },
    update: {},
    select: { id: true },
  });

  const categories = [
    'sneakers',
    'bottes',
    'sandales',
    'chaussures-ville',
    'chaussures-sport',
    'chaussures-enfant',
  ];
  await prisma.category.updateMany({
    where: { slug: { in: categories } },
    data: { sizeGuideId: guide.id },
  });
}
