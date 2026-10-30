// BRUNY SHOPPING — produits (TEC-07).
//
// 20 produits (upsert sur `Product.slug`) répartis entre les 6
// catégories et les 4 marques. Chaque produit a 3 couleurs et 11
// pointures (36..46) => 33 variantes par produit, soit 660 variantes.
// Le SKU unique est du format {BRAND}-{PRODUCT_SLUG_SHORT}-{SIZE}-{COLOR}.
// On monte le stock de façon réaliste : 0..50, avec au moins 2 variantes
// à 0 pour représenter un produit indisponible.
// Dépendances : categories.seed + brands.seed (catégories/marques doivent
// exister).
import type { PrismaClient } from '../../src/generated/prisma/client';

// Nom court utilisé dans le SKU : on prend le slug, on coupe aux
// 8 premiers caractères et on le met en majuscule pour garder un SKU
// lisible et court.
function skuBrand(brandSlug: string): string {
  return brandSlug
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase()
    .slice(0, 8);
}

function skuProduct(slug: string): string {
  return slug
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase()
    .slice(0, 10);
}

type Color = 'NOIR' | 'BLANC' | 'ROUGE' | 'BLEU' | 'MARRON' | 'VERT' | 'ORANGE' | 'ROSE' | 'GRIS'; // eslint-disable-line @typescript-eslint/no-unused-vars

interface ProductDef {
  name: string;
  slug: string;
  description: string;
  categorySlug: string;
  brandSlug: string;
  basePrice: number;
  colors: [string, string, string][]; // [énoncé, couleur, couleur] -> 3 couleurs
}

const PRODUCTS: ProductDef[] = [
  {
    name: 'Sneakers UrbanStep Air',
    slug: 'sneakers-urbanstep-air',
    description:
      'Sneakers légères à semelle amortissante, idéales pour la marche quotidienne en ville. Tige respirante, semelle antidérapante.',
    categorySlug: 'sneakers',
    brandSlug: 'barrage-foot',
    basePrice: 24500,
    colors: [['Blanc', 'BLANC', 'BLANC']],
  },
  {
    name: 'Baskets Sahel Cuir',
    slug: 'baskets-sahel-cuir',
    description:
      'Baskets en cuir véritable, finitions renforcées, confort toute la journée. Semelle intérieure amovible.',
    categorySlug: 'chaussures-ville',
    brandSlug: 'cameroon-sports',
    basePrice: 32000,
    colors: [['Marron', 'MARRON', 'MARRON']],
  },
  {
    name: 'Sandales Sahel Confort',
    slug: 'sandales-sahel-confort',
    description:
      'Sandales en cuir avec sangle réglable, semelle souple adaptée aux chaleurs. Idéales pour la saison sèche.',
    categorySlug: 'sandales',
    brandSlug: 'kepe',
    basePrice: 12500,
    colors: [['Noir', 'NOIR', 'NOIR']],
  },
  {
    name: 'Sneakers UrbanStep Lady',
    slug: 'sneakers-urbanstep-lady',
    description:
      'Sneakers féminines au design épuré, mousse à mémoire de forme, parfaites pour un usage quotidien.',
    categorySlug: 'sneakers',
    brandSlug: 'lesportif',
    basePrice: 22000,
    colors: [['Rose', 'ROSE', 'ROSE']],
  },
  {
    name: 'Talons UrbanStep Élégance',
    slug: 'talons-urbanstep-elegance',
    description:
      'Talons 7 cm à plateau, tige synthétique doublée, fermeture par boucle. Stables grâce à leur base large.',
    categorySlug: 'chaussures-ville',
    brandSlug: 'barrage-foot',
    basePrice: 18500,
    colors: [['Noir', 'NOIR', 'NOIR']],
  },
  {
    name: 'Sneakers Kidzo Play',
    slug: 'sneakers-kidzo-play',
    description:
      'Chaussures enfant résistantes, scratch double pour une mise rapide, semelle flexible et lavable.',
    categorySlug: 'chaussures-enfant',
    brandSlug: 'kepe',
    basePrice: 9500,
    colors: [['Bleu', 'BLEU', 'BLEU']],
  },
  {
    name: 'Baskets CamoStride Atlas',
    slug: 'baskets-camostride-atlas',
    description: 'Chaussures robustes au maintien confortable, pensées pour les longues journées.',
    categorySlug: 'chaussures-ville',
    brandSlug: 'cameroon-sports',
    basePrice: 28000,
    colors: [['Rouge', 'ROUGE', 'ROUGE']],
  },
  {
    name: 'Sneakers UrbanStep Tempo',
    slug: 'sneakers-urbanstep-tempo',
    description: 'Sneakers légères et respirantes pour les déplacements urbains.',
    categorySlug: 'sneakers',
    brandSlug: 'barrage-foot',
    basePrice: 21500,
    colors: [['Gris', 'GRIS', 'GRIS']],
  },
  {
    name: 'Sandales Sahel Nomade',
    slug: 'sandales-sahel-nomade',
    description: 'Sandales souples avec brides réglables pour un confort au quotidien.',
    categorySlug: 'sandales',
    brandSlug: 'kepe',
    basePrice: 14500,
    colors: [['Marron', 'MARRON', 'MARRON']],
  },
  {
    name: 'Mocassins CamoStride Élégance',
    slug: 'mocassins-camostride-elegance',
    description: 'Mocassins sobres aux finitions soignées pour les sorties et le bureau.',
    categorySlug: 'chaussures-ville',
    brandSlug: 'cameroon-sports',
    basePrice: 29500,
    colors: [['Noir', 'NOIR', 'NOIR']],
  },
  {
    name: 'Baskets Kidzo Sprint',
    slug: 'baskets-kidzo-sprint',
    description: 'Baskets enfant légères avec fermeture pratique et semelle flexible.',
    categorySlug: 'chaussures-enfant',
    brandSlug: 'kepe',
    basePrice: 11000,
    colors: [['Bleu', 'BLEU', 'BLEU']],
  },
  {
    name: 'Sandales UrbanStep Soleil',
    slug: 'sandales-urbanstep-soleil',
    description: 'Sandales estivales avec semelle amortissante et brides confortables.',
    categorySlug: 'sandales',
    brandSlug: 'lesportif',
    basePrice: 13500,
    colors: [['Rose', 'ROSE', 'ROSE']],
  },
  {
    name: 'Talons CamoStride Chic',
    slug: 'talons-camostride-chic',
    description: 'Escarpins élégants à talon stable et doublure douce.',
    categorySlug: 'chaussures-ville',
    brandSlug: 'cameroon-sports',
    basePrice: 24000,
    colors: [['Noir', 'NOIR', 'NOIR']],
  },
  {
    name: 'Baskets Sahel Horizon',
    slug: 'baskets-sahel-horizon',
    description: 'Baskets en cuir souple avec semelle antidérapante.',
    categorySlug: 'chaussures-ville',
    brandSlug: 'kepe',
    basePrice: 33500,
    colors: [['Marron', 'MARRON', 'MARRON']],
  },
  {
    name: 'Sneakers Kidzo Explorer',
    slug: 'sneakers-kidzo-explorer',
    description: 'Chaussures enfant résistantes adaptées aux jeux et aux sorties.',
    categorySlug: 'chaussures-enfant',
    brandSlug: 'lesportif',
    basePrice: 12500,
    colors: [['Vert', 'VERT', 'VERT']],
  },
  {
    name: 'Mules UrbanStep Douceur',
    slug: 'mules-urbanstep-douceur',
    description: 'Mules faciles à porter avec semelle intérieure moelleuse.',
    categorySlug: 'chaussures-ville',
    brandSlug: 'barrage-foot',
    basePrice: 12000,
    colors: [['Blanc', 'BLANC', 'BLANC']],
  },
  {
    name: 'Chaussures scolaires Kidzo',
    slug: 'chaussures-scolaires-kidzo',
    description: 'Chaussures scolaires solides, faciles à nettoyer et confortables.',
    categorySlug: 'chaussures-enfant',
    brandSlug: 'kepe',
    basePrice: 10500,
    colors: [['Orange', 'ORANGE', 'ORANGE']],
  },
  {
    name: 'Sneakers CamoStride Pulse',
    slug: 'sneakers-camostride-pulse',
    description: 'Sneakers au look contemporain avec maintien renforcé.',
    categorySlug: 'sneakers',
    brandSlug: 'cameroon-sports',
    basePrice: 26000,
    colors: [['Noir', 'NOIR', 'NOIR']],
  },
  {
    name: 'Ballerines Sahel Grâce',
    slug: 'ballerines-sahel-grace',
    description: 'Ballerines souples à la coupe intemporelle pour tous les jours.',
    categorySlug: 'chaussures-ville',
    brandSlug: 'kepe',
    basePrice: 16500,
    colors: [['Rose', 'ROSE', 'ROSE']],
  },
  {
    name: 'Sandales Kidzo Fun',
    slug: 'sandales-kidzo-fun',
    description: 'Sandales enfant à fermeture rapide et semelle souple.',
    categorySlug: 'chaussures-enfant',
    brandSlug: 'lesportif',
    basePrice: 8000,
    colors: [['Bleu', 'BLEU', 'BLEU']],
  },
];

const SIZES = Array.from({ length: 11 }, (_, i) => String(i + 36)); // 36..46

function colorIndex(color: string): number {
  const map: Record<string, number> = {
    NOIR: 0,
    BLANC: 1,
    ROUGE: 2,
    BLEU: 3,
    MARRON: 4,
    VERT: 5,
    ORANGE: 6,
    ROSE: 7,
    GRIS: 8,
  };
  return map[color] ?? 0;
}

function variantsFor(
  productSlug: string,
  brandSlug: string,
  colors: [string, string, string][],
): {
  sku: string;
  color: string;
  size: string;
  stock: number;
}[] {
  const variants: {
    sku: string;
    color: string;
    size: string;
    stock: number;
  }[] = [];
  for (let _colorIndex = 0; _colorIndex < colors.length; _colorIndex += 1) {
    const [, color, _] = colors[_colorIndex];
    for (let sizeIndex = 0; sizeIndex < SIZES.length; sizeIndex += 1) {
      const size = SIZES[sizeIndex];
      // 14 - 2*colorIndex - (sizeIndex % 4) : plage 0..14, au moins 2 variantes à 0.
      const stock = Math.max(0, 14 - colorIndex * 2 - (sizeIndex % 4));
      variants.push({
        sku: `${skuBrand(brandSlug)}-${skuProduct(productSlug)}-${size}-${color}`,
        color,
        size,
        stock,
      });
    }
  }
  return variants;
}

export async function seedProducts(prisma: PrismaClient): Promise<void> {
  for (const product of PRODUCTS) {
    // Résoudre catégorie et marque en premier.
    const category = await prisma.category.findUnique({
      where: { slug: product.categorySlug },
    });
    if (!category) {
      throw new Error(`Catégorie introuvable : ${product.categorySlug} (produit ${product.name})`);
    }
    const brand = await prisma.brand.findUnique({
      where: { slug: product.brandSlug },
    });
    if (!brand) {
      throw new Error(`Marque introuvable : ${product.brandSlug} (produit ${product.name})`);
    }

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
      },
      update: {
        name: product.name,
        description: product.description,
        basePrice: product.basePrice,
      },
    });

    // Variants : 3 couleurs × 11 pointures = 33 variantes par produit.
    const variants = variantsFor(product.slug, product.brandSlug, product.colors);
    await Promise.all(
      variants.map((variant) =>
        prisma.productVariant.upsert({
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
        }),
      ),
    );

    // Images : 2 par produit, uniquement si absent (pas de clé unique
    // naturelle pour l'image, on utilise l'absence).
    const imageCount = await prisma.productImage.count({
      where: { productId: record.id },
    });
    if (imageCount === 0) {
      await prisma.productImage.createMany({
        data: [
          {
            productId: record.id,
            url: `https://placehold.co/800x800/1a1a2e/FFF?text=${encodeURIComponent(product.name)}`,
            position: 0,
            alt: `${product.name} — vue 1`,
          },
          {
            productId: record.id,
            url: `https://placehold.co/800x800/16213e/FFF?text=${encodeURIComponent(product.name)}`,
            position: 1,
            alt: `${product.name} — vue 2`,
          },
        ],
      });
    }
  }
}
