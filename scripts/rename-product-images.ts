/**
 * Script de renommage automatique des photos produits
 * Usage: npx ts-node scripts/rename-product-images.ts /chemin/dossier mapping.csv
 */

import fs from 'fs';
import path from 'path';

const CONVENTION_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*-(face|profil|dessus|semelle|detail|porte)\.(jpg|jpeg|webp)$/;

interface MappingRow {
  fichier_original: string;
  modele: string;
  couleur: string;
  angle: string;
}

interface RenamingResult {
  original: string;
  newName: string;
  status: 'OK' | 'KO';
  reason?: string;
}

function validateConvention(filename: string): boolean {
  return CONVENTION_REGEX.test(filename);
}

function generateNewName(modele: string, couleur: string, angle: string, ext: string): string {
  const modeleClean = modele.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const couleurClean = couleur.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const angleClean = angle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${modeleClean}-${couleurClean}-${angleClean}.${ext}`;
}

async function renameFiles(folderPath: string, mappingCsvPath: string): Promise<RenamingResult[]> {
  const results: RenamingResult[] = [];
  const csvContent = fs.readFileSync(mappingCsvPath, 'utf-8');
  const lines = csvContent.trim().split('\n');

  if (lines.length < 2) return results;

  const header = lines[0].trim().split(',').map(h => h.trim());
  const fileCol = header.indexOf('fichier_original');
  const modelCol = header.indexOf('modele');
  const colorCol = header.indexOf('couleur');
  const angleCol = header.indexOf('angle');

  if (fileCol === -1 || modelCol === -1 || colorCol === -1 || angleCol === -1) {
    console.error('❌ Mapping CSV doit contenir: fichier_original, modele, couleur, angle');
    return results;
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].trim().split(',').map(c => c.trim());
    if (cols.length < 4) {
      results.push({ original: lines[i], newName: '', status: 'KO', reason: 'Ligne incomplète' });
      continue;
    }

    const originalFile = cols[fileCol].trim();
    const modele = cols[modelCol].trim();
    const couleur = cols[colorCol].trim();
    const angle = cols[angleCol].trim();

    const originalPath = path.join(folderPath, originalFile);
    if (!fs.existsSync(originalPath)) {
      results.push({ original: originalFile, newName: '', status: 'KO', reason: `Fichier introuvable: ${originalFile}` });
      continue;
    }

    const ext = path.extname(originalFile);
    if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.webp') {
      results.push({ original: originalFile, newName: '', status: 'KO', reason: `Extension: ${ext}` });
      continue;
    }

    if (!validateConvention(originalFile)) {
      results.push({ original: originalFile, newName: '', status: 'KO', reason: 'Convention non respectée' });
      continue;
    }

    const newName = generateNewName(modele, couleur, angle, ext.slice(1));
    const newPath = path.join(folderPath, newName);

    if (fs.existsSync(newPath)) {
      results.push({ original: originalFile, newName: newName, status: 'KO', reason: `Existant: ${newName}` });
      continue;
    }

    try {
      fs.renameSync(originalPath, newPath);
      results.push({ original: originalFile, newName: newName, status: 'OK' });
    } catch (err) {
      results.push({ original: originalFile, newName: newName, status: 'KO', reason: String(err) });
    }
  }
  return results;
}

function generateReport(results: RenamingResult[], outputPath: string): void {
  const ok = results.filter(r => r.status === 'OK').length;
  const ko = results.filter(r => r.status === 'KO').length;
  let report = `=== RAPPORT RENAMMNAGE ===\nTotal: ${results.length}\nOK: ${ok}\nErreurs: ${ko}\n`;
  report += '\nSUCCES:\n';
  results.filter(r => r.status === 'OK').forEach(r => report += `✓ ${r.original} → ${r.newName}\n`);
  report += '\nERREURS:\n';
  results.filter(r => r.status === 'KO').forEach(r => report += `✗ ${r.original} → ${r.reason || 'Inconnu'}\n`);
  fs.writeFileSync(outputPath, report, 'utf-8');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: npx ts-node scripts/rename-product-images.ts <dossier_photos> <mapping.csv>');
    process.exit(1);
  }

  const folderPath = args[0];
  const mappingCsvPath = args[1];

  if (!fs.existsSync(folderPath)) {
    console.error(`❌ Dossier introuvable: ${folderPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(mappingCsvPath)) {
    console.error(`❌ Mapping CSV introuvable: ${mappingCsvPath}`);
    process.exit(1);
  }

  const results = await renameFiles(folderPath, mappingCsvPath);
  generateReport(results, path.join(folderPath, '../rename-report.txt'));
}

main().catch(err => { console.error('Erreur fatale:', err); process.exit(1); });