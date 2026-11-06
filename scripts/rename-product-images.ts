#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import csvParse from 'csv-parse/sync';

const CONVENTION_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*-(face|profil|dessus|semelle|detail|porte)\.(jpg|jpeg|webp)$/;

interface MappingEntry {
  fichier_original: string;
  modele: string;
  couleur: string;
  angle: string;
}

function validateAngle(angle: string): angle is string {
  return ['face', 'profil', 'dessus', 'semelle', 'detail', 'porte'].includes(angle);
}

function validateFilename(filename: string): boolean {
  return CONVENTION_REGEX.test(filename);
}

interface RenamingResult {
  renamed: number;
  errors: number;
  report: string;
}

function renameFiles(photosDir: string, csvPath: string): RenamingResult {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = csvParse.parse<MappingEntry>(csvContent, { columns: true, skip_empty_lines: true });

  let renamed = 0;
  let errors = 0;
  const errorsList: string[] = [];

  for (const record of records) {
    if (!record.fichier_original || !record.modele || !record.couleur || !record.angle) {
      errors++;
      errorsList.push(`Ligne incomplète: ${record.fichier_original}`);
      continue;
    }

    if (!validateAngle(record.angle)) {
      errors++;
      errorsList.push(`Angle invalide: ${record.angle} pour ${record.fichier_original}`);
      continue;
    }

    const newFilename = `${record.modele}-${record.couleur}-${record.angle}.jpg`;
    
    if (!validateFilename(newFilename)) {
      errors++;
      errorsList.push(`Nouveau nom invalide: ${newFilename}`);
      continue;
    }

    const originalPath = path.join(photosDir, record.fichier_original);
    const newPath = path.join(photosDir, newFilename);

    if (!fs.existsSync(originalPath)) {
      errors++;
      errorsList.push(`Fichier original introuvable: ${originalPath}`);
      continue;
    }

    if (fs.existsSync(newPath)) {
      errors++;
      errorsList.push(`Fichier déjà existant: ${newFilename}`);
      continue;
    }

    try {
      fs.renameSync(originalPath, newPath);
      renamed++;
    } catch (err) {
      errors++;
      errorsList.push(`Erreur renommage ${record.fichier_original}: ${(err as Error).message}`);
    }
  }

  const report = `Renaming Report\n================\n- Renomées avec succès : ${renamed}\n- Erreurs : ${errors}\n\nErreurs détaillées:\n${errorsList.slice(0, 20).map((e, i) => `${i + 1}. ${e}`).join('\n')}`;

  return { renamed, errors, report };
}

if (require.main === module) {
  const photosDir = process.argv[2];
  const csvPath = process.argv[3];

  if (!photosDir || !csvPath) {
    console.error('Usage: node rename-product-images.js <dossier_photos> <fichier_csv>');
    process.exit(1);
  }

  const { renamed, errors, report } = renameFiles(photosDir, csvPath);
  console.log(report);
  
  fs.writeFileSync('rename-report.txt', report);
  
  if (errors > 0) {
    process.exit(1);
  }
}

export { renameFiles, validateFilename, CONVENTION_REGEX };