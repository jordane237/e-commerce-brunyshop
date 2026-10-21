// BRUNY SHOPPING seed — reference data for local development.
// Idempotent: safe to run multiple times (upserts keyed on unique columns).
// Run with: pnpm db:seed (from backend/).
import { existsSync } from 'node:fs';
import { hash } from '@node-rs/argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  Prisma,
  PrismaClient as GeneratedPrismaClient,
  type PrismaClientOptions,
} from '../src/generated/prisma/client';

// Prisma 7 / tsx do not load .env automatically (see pris.ly/d/config-url).
if (existsSync('.env')) process.loadEnvFile('.env');
else if (existsSync('../.env')) process.loadEnvFile('../.env');

// Permission keys from the cahier des charges section 2 (access matrix).
const ROLES: Array<{ name: string; permissions: string[] }> = [
  {
    name: 'LIVREUR',
    permissions: ['order:read:assigned', 'order:status:deliver'],
  },
  {
    name: 'STOCK_MANAGER',
    permissions: ['dashboard:read:limited', 'product:write', 'stock:adjust', 'order:read'],
  },
  {
    name: 'ORDER_MANAGER',
    permissions: [
      'dashboard:read:limited',
      'order:read',
      'order:update:status',
      'order:refund',
      'customer:read:limited',
    ],
  },
  {
    name: 'ADMIN',
    permissions: [
      'dashboard:read',
      'product:write',
      'stock:adjust',
      'pricing:manage',
      'order:read',
      'order:update:status',
      'order:refund',
      'customer:read',
      'settings:manage',
      'audit:read',
    ],
  },
  {
    name: 'SUPER_ADMIN',
    permissions: [
      'dashboard:read',
      'product:write',
      'stock:adjust',
      'pricing:manage',
      'order:read',
      'order:update:status',
      'order:refund',
      'customer:read',
      'user:manage',
      'settings:manage',
      'audit:read',
    ],
  },
  { name: 'CUSTOMER', permissions: [] },
];

const CATEGORIES: Array<{
  name: string;
  slug: string;
  position: number;
  children: Array<{ name: string; slug: string; position: number }>;
}> = [
  {
    name: 'Hommes',
    slug: 'hommes',
    position: 0,
    children: [
      { name: 'Sneakers Hommes', slug: 'sneakers-hommes', position: 0 },
      { name: 'Sandales Hommes', slug: 'sandales-hommes', position: 1 },
      { name: 'Chaussures de ville', slug: 'chaussures-ville', position: 2 },
    ],
  },
  {
    name: 'Femmes',
    slug: 'femmes',
    position: 1,
    children: [
      { name: 'Sneakers Femmes', slug: 'sneakers-femmes', position: 0 },
      { name: 'Talons', slug: 'talons', position: 1 },
      { name: 'Sandales Femmes', slug: 'sandales-femmes', position: 2 },
    ],
  },
  {
    name: 'Enfants',
    slug: 'enfants',
    position: 2,
    children: [
      { name: 'Sneakers Enfants', slug: 'sneakers-enfants', position: 0 },
      { name: 'Chaussures scolaires', slug: 'chaussures-scolaires', position: 1 },
    ],
  },
];

const BRANDS = [
  { name: 'UrbanStep', slug: 'urbanstep' },
  { name: 'Sahel Walk', slug: 'sahel-walk' },
  { name: 'Kidzo', slug: 'kidzo' },
  { name: 'CamoStride', slug: 'camostride' },
];

interface SeedVariant {
  sku: string;
  color: string;
  size: string;
  stock: number;
}

interface SeedProduct {
  name: string;
  slug: string;
  description: string;
  categorySlug: string;
  brandSlug: string;
  basePrice: number;
  promo?: { price: number; days: number };
  variants: SeedVariant[];
}

function variants(
  prefix: string,
  color: string,
  sizes: string[],
  baseStock: number,
): SeedVariant[] {
  return sizes.map((size, index) => ({
    sku: `${prefix}-${color.slice(0, 3).toUpperCase()}-${size}`,
    color,
    size,
    stock: baseStock - index * 2,
  }));
}

const PRODUCTS: SeedProduct[] = [
  {
    name: 'Sneakers UrbanStep Air',
    slug: 'sneakers-urbanstep-air',
    description:
      'Sneakers légères à semelle amortissante, idéales pour la marche quotidienne en ville. Tige respirante, semelle antidérapante.',
    categorySlug: 'sneakers-hommes',
    brandSlug: 'urbanstep',
    basePrice: 24500,
    promo: { price: 19900, days: 30 },
    variants: variants('USA', 'Blanc', ['40', '41', '42', '43', '44'], 24),
  },
  {
    name: 'Baskets Sahel Cuir',
    slug: 'baskets-sahel-cuir',
    description:
      'Baskets en cuir véritable, finitions renforcées, confort toute la journée. Semelle intérieure amovible.',
    categorySlug: 'chaussures-ville',
    brandSlug: 'sahel-walk',
    basePrice: 32000,
    variants: variants('SWC', 'Marron', ['39', '40', '41', '42', '43'], 16),
  },
  {
    name: 'Sandales Sahel Confort',
    slug: 'sandales-sahel-confort',
    description:
      'Sandales en cuir avec sangle réglable, semelle souple adaptée aux chaleurs. Idéales pour la saison sèche.',
    categorySlug: 'sandales-hommes',
    brandSlug: 'sahel-walk',
    basePrice: 12500,
    variants: variants('SSC', 'Noir', ['40', '41', '42', '43'], 30),
  },
  {
    name: 'Sneakers UrbanStep Lady',
    slug: 'sneakers-urbanstep-lady',
    description:
      'Sneakers féminines au design épuré, mousse à mémoire de forme, parfaites pour un usage quotidien.',
    categorySlug: 'sneakers-femmes',
    brandSlug: 'urbanstep',
    basePrice: 22000,
    promo: { price: 17500, days: 14 },
    variants: variants('USL', 'Rose', ['36', '37', '38', '39', '40'], 20),
  },
  {
    name: 'Talons UrbanStep Élégance',
    slug: 'talons-urbanstep-elegance',
    description:
      'Talons 7 cm à plateau, tige synthétique doublée, fermeture par boucle. Stables grâce à leur base large.',
    categorySlug: 'talons',
    brandSlug: 'urbanstep',
    basePrice: 18500,
    variants: variants('UTE', 'Noir', ['36', '37', '38', '39'], 4),
  },
  {
    name: 'Sneakers Kidzo Play',
    slug: 'sneakers-kidzo-play',
    description:
      'Chaussures enfant résistantes, scratch double pour une mise rapide, semelle flexible et lavable.',
    categorySlug: 'sneakers-enfants',
    brandSlug: 'kidzo',
    basePrice: 9500,
    variants: [
      ...variants('KZP', 'Bleu', ['28', '30', '32', '34'], 18),
      ...variants('KZP', 'Rouge', ['28', '30', '32', '34'], 12),
    ],
  },
];

const EXTRA_PRODUCTS: SeedProduct[] = [
  [
    'Baskets CamoStride Atlas',
    'baskets-camostride-atlas',
    'Chaussures robustes au maintien confortable, pensées pour les longues journées.',
    'chaussures-ville',
    'camostride',
    28000,
  ],
  [
    'Sneakers UrbanStep Tempo',
    'sneakers-urbanstep-tempo',
    'Sneakers légères et respirantes pour les déplacements urbains.',
    'sneakers-hommes',
    'urbanstep',
    21500,
  ],
  [
    'Sandales Sahel Nomade',
    'sandales-sahel-nomade',
    'Sandales souples avec brides réglables pour un confort au quotidien.',
    'sandales-hommes',
    'sahel-walk',
    14500,
  ],
  [
    'Mocassins CamoStride Élégance',
    'mocassins-camostride-elegance',
    'Mocassins sobres aux finitions soignées pour les sorties et le bureau.',
    'chaussures-ville',
    'camostride',
    29500,
  ],
  [
    'Baskets Kidzo Sprint',
    'baskets-kidzo-sprint',
    'Baskets enfant légères avec fermeture pratique et semelle flexible.',
    'sneakers-enfants',
    'kidzo',
    11000,
  ],
  [
    'Sandales UrbanStep Soleil',
    'sandales-urbanstep-soleil',
    'Sandales estivales avec semelle amortissante et brides confortables.',
    'sandales-femmes',
    'urbanstep',
    13500,
  ],
  [
    'Talons CamoStride Chic',
    'talons-camostride-chic',
    'Escarpins élégants à talon stable et doublure douce.',
    'talons',
    'camostride',
    24000,
  ],
  [
    'Baskets Sahel Horizon',
    'baskets-sahel-horizon',
    'Baskets en cuir souple avec semelle antidérapante.',
    'chaussures-ville',
    'sahel-walk',
    33500,
  ],
  [
    'Sneakers Kidzo Explorer',
    'sneakers-kidzo-explorer',
    'Chaussures enfant résistantes adaptées aux jeux et aux sorties.',
    'sneakers-enfants',
    'kidzo',
    12500,
  ],
  [
    'Mules UrbanStep Douceur',
    'mules-urbanstep-douceur',
    'Mules faciles à porter avec semelle intérieure moelleuse.',
    'sandales-femmes',
    'urbanstep',
    12000,
  ],
  [
    'Chaussures scolaires Kidzo',
    'chaussures-scolaires-kidzo',
    'Chaussures scolaires solides, faciles à nettoyer et confortables.',
    'chaussures-scolaires',
    'kidzo',
    10500,
  ],
  [
    'Sneakers CamoStride Pulse',
    'sneakers-camostride-pulse',
    'Sneakers au look contemporain avec maintien renforcé.',
    'sneakers-hommes',
    'camostride',
    26000,
  ],
  [
    'Ballerines Sahel Grâce',
    'ballerines-sahel-grace',
    'Ballerines souples à la coupe intemporelle pour tous les jours.',
    'talons',
    'sahel-walk',
    16500,
  ],
  [
    'Sandales Kidzo Fun',
    'sandales-kidzo-fun',
    'Sandales enfant à fermeture rapide et semelle souple.',
    'sandales-hommes',
    'kidzo',
    8000,
  ],
].map(([name, slug, description, categorySlug, brandSlug, basePrice]) => ({
  name: String(name),
  slug: String(slug),
  description: String(description),
  categorySlug: String(categorySlug),
  brandSlug: String(brandSlug),
  basePrice: Number(basePrice),
  variants: [],
}));

function demoVariants(slug: string): SeedVariant[] {
  const colors = ['Noir', 'Blanc', 'Marron'];
  const sizes = Array.from({ length: 11 }, (_, index) => String(index + 36));
  return colors.flatMap((color, colorIndex) =>
    sizes.map((size, sizeIndex) => ({
      sku: `${slug.toUpperCase()}-${color.slice(0, 3).toUpperCase()}-${size}`,
      color,
      size,
      stock: 14 - colorIndex * 2 - (sizeIndex % 4),
    })),
  );
}

const ZONES = [
  {
    name: 'Douala',
    cities: ['Douala', 'Bonabéri'],
    fee: 1000,
    estimatedDays: 1,
  },
  {
    name: 'Yaoundé',
    cities: ['Yaoundé'],
    fee: 1000,
    estimatedDays: 1,
  },
  {
    name: 'Autres villes',
    cities: ['Bafoussam', 'Bamenda', 'Buea', 'Limbe', 'Garoua', 'Ngaoundéré'],
    fee: 2000,
    estimatedDays: 3,
  },
];

const SETTINGS: Array<{ key: string; value: Prisma.InputJsonValue }> = [
  { key: 'store.name', value: 'BRUNY SHOPPING' },
  { key: 'store.currency', value: 'XAF' },
  { key: 'store.country', value: 'CM' },
  { key: 'support.whatsapp', value: '+237600000000' },
  { key: 'order.reference.prefix', value: 'BRN' },
  { key: 'stock.low.defaultThreshold', value: 5 },
];

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set (backend/.env missing?)');
  }
  const adapter = new PrismaPg({ connectionString });
  const prisma = new GeneratedPrismaClient({
    adapter,
  } as PrismaClientOptions);

  try {
    // --- Roles (section 2 access matrix) --------------------------------
    for (const role of ROLES) {
      const roleRecord = await prisma.role.upsert({
        where: { name: role.name },
        create: { name: role.name, permissions: role.permissions },
        update: { permissions: role.permissions },
      });
      for (const key of role.permissions) {
        const permission = await prisma.permission.upsert({
          where: { key },
          create: { key, description: key.replaceAll(':', ' ') },
          update: { description: key.replaceAll(':', ' ') },
        });
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: roleRecord.id, permissionId: permission.id } },
          create: { roleId: roleRecord.id, permissionId: permission.id },
          update: {},
        });
      }
    }

    // --- Admin account --------------------------------------------------
    const adminEmail = process.env['SEED_ADMIN_EMAIL'] ?? 'admin@brunyshop.dev';
    const adminPassword = process.env['SEED_ADMIN_PASSWORD'] ?? 'BrunyDev!2026Admin';
    if (adminPassword.length < 10) {
      throw new Error('SEED_ADMIN_PASSWORD must be at least 10 characters');
    }
    const passwordHash = await hash(adminPassword);
    const superAdminRole = await prisma.role.findUniqueOrThrow({
      where: { name: 'SUPER_ADMIN' },
    });
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      create: {
        email: adminEmail,
        passwordHash,
        firstName: 'Super',
        lastName: 'Admin',
        phone: '+237600000001',
      },
      update: { passwordHash },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: superAdminRole.id } },
      create: { userId: admin.id, roleId: superAdminRole.id },
      update: {},
    });

    // --- Categories (parents then children) -----------------------------
    for (const parent of CATEGORIES) {
      await prisma.category.upsert({
        where: { slug: parent.slug },
        create: { name: parent.name, slug: parent.slug, position: parent.position },
        update: { name: parent.name, position: parent.position },
      });
      for (const child of parent.children) {
        await prisma.category.upsert({
          where: { slug: child.slug },
          create: {
            name: child.name,
            slug: child.slug,
            position: child.position,
            parentId: (
              await prisma.category.findUniqueOrThrow({
                where: { slug: parent.slug },
              })
            ).id,
          },
          update: { name: child.name, position: child.position },
        });
      }
    }

    // --- Brands ---------------------------------------------------------
    for (const brand of BRANDS) {
      await prisma.brand.upsert({
        where: { slug: brand.slug },
        create: brand,
        update: { name: brand.name },
      });
    }

    // --- Products, variants, images -------------------------------------
    const now = Date.now();
    for (const product of [...PRODUCTS, ...EXTRA_PRODUCTS]) {
      const category = await prisma.category.findUniqueOrThrow({
        where: { slug: product.categorySlug },
      });
      const brand = await prisma.brand.findUniqueOrThrow({
        where: { slug: product.brandSlug },
      });
      const record = await prisma.product.upsert({
        where: { slug: product.slug },
        create: {
          name: product.name,
          slug: product.slug,
          description: product.description,
          categoryId: category.id,
          brandId: brand.id,
          status: 'PUBLISHED',
          basePrice: product.basePrice,
          promoPrice: product.promo?.price,
          promoStart: product.promo ? new Date(now - 86_400_000) : null,
          promoEnd: product.promo ? new Date(now + product.promo.days * 86_400_000) : null,
        },
        update: {
          basePrice: product.basePrice,
          promoPrice: product.promo?.price ?? null,
          promoStart: product.promo ? new Date(now - 86_400_000) : null,
          promoEnd: product.promo ? new Date(now + product.promo.days * 86_400_000) : null,
        },
      });

      for (const variant of demoVariants(product.slug)) {
        await prisma.productVariant.upsert({
          where: { sku: variant.sku },
          create: {
            productId: record.id,
            sku: variant.sku,
            color: variant.color,
            size: variant.size,
            stock: variant.stock,
            lowStockThreshold: 5,
          },
          update: { stock: variant.stock },
        });
      }

      // Images have no natural unique key: create once, keyed on absence.
      const imageCount = await prisma.productImage.count({
        where: { productId: record.id },
      });
      if (imageCount === 0) {
        await prisma.productImage.createMany({
          data: [0, 1].map((index) => ({
            productId: record.id,
            url: `https://picsum.photos/seed/${product.slug}-${index}/800/800`,
            position: index,
            alt: `${product.name} — vue ${index + 1}`,
          })),
        });
      }
    }

    // --- Delivery zones -------------------------------------------------
    for (const zone of ZONES) {
      const existing = await prisma.deliveryZone.findFirst({
        where: { name: zone.name },
      });
      if (existing) {
        await prisma.deliveryZone.update({ where: { id: existing.id }, data: zone });
      } else {
        await prisma.deliveryZone.create({ data: zone });
      }
    }

    // --- Settings -------------------------------------------------------
    for (const setting of SETTINGS) {
      await prisma.setting.upsert({
        where: { key: setting.key },
        create: { key: setting.key, value: setting.value },
        update: { value: setting.value },
      });
    }

    const counts = {
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
    console.log('seed: done', counts);
    console.log(`seed: admin = ${adminEmail}`);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('seed failed:', error);
    process.exit(1);
  });
