/**
 * Script d'import d'images via CSV vers Prisma
 * Usage: npx ts-node scripts/import-product-images.ts product-images.csv
 *
 * Ce script :
 * 1. Lit le fichier product-images.csv
 * 2. Pour chaque ligne, upsert une entrée ProductImage en DB
 * 3. Génère un rapport d'import
 */

import { PrismaClient } from '@prisma/client';
import csvParse from 'csv-parse/sync';
import fs from 'fs';

const prisma = new PrismaClient();

interface ProductImageData {
  productId: string;
  couleur: string;
  angle: string;
  url: string;
  alt: string;
  position: number;
  isPrimary: boolean;
}

interface ImportResult {
  success: number;
  error: number;
  errors: string[];
}

async function importImages(csvPath: string): Promise<ImportResult> {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = csvParse.parse<ProductImageData>(csvContent, { columns: true, skip_empty_lines: true });

  let success = 0;
  let error = 0;
  const errors: string[] = [];

  for (const record of records) {
    try {
      await prisma.productImage.upsert({
        where: {
          productId_angle_couleur: {
            productId: record.productId,
            angle: record.angle,
            couleur: record.couleur,
          },
        },
        update: {
          url: record.url,
          alt: record.alt,
          position: record.position,
          isPrimary: record.isPrimary,
        },
        create: {
          product: { connect: { id: record.productId } },
          couleur: record.couleur,
          angle: record.angle,
          url: record.url,
          alt: record.alt,
          position: record.position,
          isPrimary: record.isPrimary,
        },
      });
      success++;
    } catch (err) {
      error++;
      errors.push(`Échec pour ${record.productId}-${record.couleur}-${record.angle}: ${(err as Error).message}`);
    }
  }

  return { success, error, errors };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: npx ts-node scripts/import-product-images.ts product-images.csv');
    process.exit(1);
  }

  const csvPath = args[0];

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Fichier CSV introuvable: ${csvPath}`);
    process.exit(1);
  }

  console.log(`✓ Début de l'import depuis ${csvPath}...`);
  const { success, error, errors } = await importImages(csvPath);

  console.log(`\n=== RAPPORT D'IMPORT ===\n`);
  console.log(`Avec succès : ${success}`);
  console.log(`Erreurs     : ${error}\n`);

  if (errors.length > 0) {
    console.log('Détails des erreurs :');
    errors.slice(0, 10).forEach((e, i) => console.log(`${i + 1}. ${e}`));
    if (errors.length > 10) console.log(`... et ${errors.length - 10} autres erreurs`);
  }

  if (error === 0) {
    console.log('\n✓ Import terminé sans erreur');
  } else {
    console.log('\n⚠ Import terminé avec des erreurs');
  }

  // Déconnexion Prisma
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});