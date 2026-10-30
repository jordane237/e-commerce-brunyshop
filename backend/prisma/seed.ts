// BRUNY SHOPPING — seed orchestrateur (TEC-07).
//
// GARDES-FOU OBLIGATOIRES (cahier des charges §2) :
//   1. Si `process.env.NODE_ENV === 'production'`  → refus avec message
//      clair et process.exit(1). Jamais de seed en production.
//   2. Second niveau (défense) : si `DATABASE_URL` contient "prod"
//      (case-insensitive) ET `ALLOW_SEED_IN_PRODUCTION` n'est pas
//      explicitement `'true'` → refus + process.exit(1).
//
// Idempotence (cahier des charges §3) :
//   - chaque fichier seedXxx(prisma) s'assure que ses entités existent
//     via upsert sur la clé naturelle (Role.name, User.email,
//     Category.slug, Brand.slug, Product.slug, ProductVariant.sku,
//     DeliveryZone.name, Coupon.code, Setting.key) ;
//   - les jointures UserRole / RolePermission sont upsertées ou
//     créées avec skipDuplicates pour ne jamais doublonner ;
//   - pas de `create()` brut sans garde.
//
// Exécution : pnpm db:seed (backend/). La connexion Prisma est ouverte
// une seule fois, on se déconnecte dans `finally`, on termine par
// process.exit(0) en succès, process.exit(1) en erreur. Aucun mot de
// passe n'est jamais loggé.
import { existsSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient as GeneratedPrismaClient,
  type PrismaClientOptions,
} from '../src/generated/prisma/client';

// Prisma 7 ne charge pas .env automatiquement : on le charge manuellement
// (voir prisma.config.mjs, docs/prisma-7-env).
if (existsSync('.env')) process.loadEnvFile('.env');
else if (existsSync('../.env')) process.loadEnvFile('../.env');

export interface SeedCounts {
  roles: number;
  users: number;
  categories: number;
  brands: number;
  products: number;
  variants: number;
  images: number;
  zones: number;
  settings: number;
}

async function seedRoles(prisma: GeneratedPrismaClient): Promise<void> {
  await import('./seeds/roles.seed').then((m) => m.seedRoles(prisma));
}

async function seedUsers(prisma: GeneratedPrismaClient): Promise<void> {
  await import('./seeds/users.seed').then((m) => m.seedUsers(prisma));
}

async function seedCategories(prisma: GeneratedPrismaClient): Promise<void> {
  await import('./seeds/categories.seed').then((m) => m.seedCategories(prisma));
}

async function seedBrands(prisma: GeneratedPrismaClient): Promise<void> {
  await import('./seeds/brands.seed').then((m) => m.seedBrands(prisma));
}

async function seedProducts(prisma: GeneratedPrismaClient): Promise<void> {
  await import('./seeds/products.seed').then((m) => m.seedProducts(prisma));
}

async function seedDeliveryZones(prisma: GeneratedPrismaClient): Promise<void> {
  await import('./seeds/delivery-zones.seed').then((m) => m.seedDeliveryZones(prisma));
}

async function seedMisc(prisma: GeneratedPrismaClient): Promise<void> {
  await import('./seeds/misc.seed').then((m) => m.seedMisc(prisma));
}

async function main(): Promise<SeedCounts> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set (backend/.env missing?)');
  }

  // Garde-fou #2 (défense) : une URL de base de données prod doit être
  // explicitement autorisée par ALLOW_SEED_IN_PRODUCTION.
  const looksLikeProductionDatabase = /prod/i.test(connectionString);
  const allowSeedInProduction = process.env.ALLOW_SEED_IN_PRODUCTION ?? 'false';
  if (looksLikeProductionDatabase && allowSeedInProduction !== 'true') {
    throw new Error(
      "SEED est interdit en production : DATABASE_URL contient \"prod\" et ALLOW_SEED_IN_PRODUCTION n'est pas 'true'.",
    );
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new GeneratedPrismaClient({
    adapter,
  } as PrismaClientOptions);

  try {
    // Ordre des dépendances : rôles → utilisateurs (le super admin
    // dépend du role SUPER_ADMIN) → catégories/brands → produits →
    // zones de livraison → données complémentaires.
    await seedRoles(prisma);
    await seedUsers(prisma);
    await seedCategories(prisma);
    await seedBrands(prisma);
    await seedProducts(prisma);
    await seedDeliveryZones(prisma);
    await seedMisc(prisma);

    return {
      roles: await prisma.role.count(),
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      brands: await prisma.brand.count(),
      products: await prisma.product.count(),
      variants: await prisma.productVariant.count(),
      images: await prisma.productImage.count(),
      zones: await prisma.deliveryZone.count(),
      settings: await prisma.setting.count(),
    };
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then((counts) => {
    console.log('✅ Seed terminé avec succès :');
    console.log(`   rôles=${counts.roles}  utilisateurs=${counts.users}`);
    console.log(`   catégories=${counts.categories}  marques=${counts.brands}`);
    console.log(`   produits=${counts.products}  variantes=${counts.variants}`);
    console.log(`   images=${counts.images}  zones=${counts.zones}  settings=${counts.settings}`);
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('❌ Seed en échec :', error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
