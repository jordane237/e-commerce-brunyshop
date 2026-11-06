# [CNT-01] Convention de Nommage & Arborescence

## Convention de nommage obligatoire

**Format :** `modele-couleur-angle.ext`

- **modele** : slug kebab-case du produit (ex : air-max-90, stan-smith, chuck-taylor)
- **couleur** : slug kebab-case (ex : noir, blanc, rouge, bleu-marine, gris-clair)
- **angle** : parmi {face, profil, dessus, semelle, detail, porte}
- **extension** : .jpg (source) ou .webp (optimisé)
- **Exemples valides** : air-max-90-noir-face.jpg, air-max-90-noir-profil.jpg, air-max-90-noir-porte.jpg, stan-smith-blanc-detail.webp
- **INTERDITS** : espaces, majuscules, accents, caractères spéciaux, parenthèses, underscores (préférer kebab-case), numérotation libre

**Format regex stricte :**
```
^[a-z0-9]+(-[a-z0-9]+)*-(face|profil|dessus|semelle|detail|porte)\.(jpg|jpeg|webp)$
## Arborescence de dossiers

```
media/
├── products/
│   ├── air-max-90/
│   │   ├── noir/
│   │ │ ├── face.jpg
│   │ │ ├── profil.jpg
│   │ │ ├── dessus.jpg
│   │ │ ├── semelle.jpg
│   │ │ ├── detail.jpg
│   │ │ └── porte.jpg
│   │   ├── blanc/
│   │ │ │ └── ...
│   │   └── rouge/
│   │       └── ...
│   ├── stan-smith/
│   │   └── ...
│   └── ...
└── _archive/
    └── raw/
        └── YYYY-MM-DD/  # fichiers RAW/JPEG originaux, conservation 30j
```
## Mapping avec le schéma Prisma

- **ProductImage.url** pointera vers une URL MinIO du type `http://minio:9000/brunyshop-media/products/{modele}/{couleur}/{angle}.jpg`
- **ProductImage.alt** doit être descriptif : "Air Max 90 noire — vue de face" (généré automatiquement depuis modele + couleur + angle)
- **ProductImage.position** : ordre d'affichage (face=0, profil=1, dessus=2, semelle=3, detail=4, porte=5)
- **ProductImage.isPrimary** : true uniquement sur "face" (ou "porte" si le PO préfère une photo lifestyle en principal — documenter le choix)
## Script de renommage automatique

Script Node.js prenant un dossier de photos avec un nommage aléatoire (IMG_1234.jpg) et un fichier CSV de correspondance, et renommant tous les fichiers selon la convention.

**Entrée attendue :**
- Un dossier contenant les photos originales
- Un fichier CSV `mapping.csv` avec les colonnes : `fichier_original, modele, couleur, angle`

**Script :** `scripts/rename-product-images.ts`

```typescript
import fs from 'fs';
import path from 'path';
import csvParse from 'csv-parse/sync';
import { execSync } from 'child_process';

// Convention regex
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

function renameFiles(photosDir: string, csvPath: string): {
  renamed: number;
  errors: number;
  report: string;
} {
  // Lire le CSV
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = csvParse.parse<MappingEntry>(csvContent, { columns: true, skip_empty_lines: true });

  let renamed = 0;
  let errors = 0;
  const errorsList: string[] = [];

  for (const record of records) {
    // Valider que les champs requis sont présents
    if (!record.fichier_original || !record.modele || !record.couleur || !record.angle) {
      errors++;
      errorsList.push(`Ligne incomplète: ${record.fichier_original}`);
      continue;
    }

    // Valider l'angle
    if (!validateAngle(record.angle)) {
      errors++;
      errorsList.push(`Angle invalide: ${record.angle} pour ${record.fichier_original}`);
      continue;
    }

    // Construire le nouveau nom : modele-couleur-angle.ext
    const newFilename = `${record.modele}-${record.couleur}-${record.angle}.jpg`;
    
    // Valider le nouveau nom contre la regex
    if (!validateFilename(newFilename)) {
      errors++;
      errorsList.push(`Nouveau nom invalide: ${newFilename}`);
      continue;
    }

    // Chemins complets
    const originalPath = path.join(photosDir, record.fichier_original);
    const newPath = path.join(photosDir, newFilename);

    // Vérifier que le fichier original existe
    if (!fs.existsSync(originalPath)) {
      errors++;
      errorsList.push(`Fichier original introuvable: ${originalPath}`);
      continue;
    }

    // Vérifier que le fichier nouveau nom n'existe pas déjà
    if (fs.existsSync(newPath)) {
      errors++;
      errorsList.push(`Fichier déjà existant: ${newFilename}`);
      continue;
    }

    // Renommer
    try {
      fs.renameSync(originalPath, newPath);
      renamed++;
    } catch (err) {
      errors++;
      errorsList.push(`Erreur renommage ${record.fichier_original}: ${(err as Error).message}`);
    }
  }

  // Générer le rapport
  const report = `Renaming Report\n================\n- Renomées avec succès : ${renamed}\n- Erreurs : ${errors}\n\nErreurs détaillées:\n${errorsList.slice(0, 20).map((e, i) => \`${i + 1}. \${e}\`).join('\n')}`;

  return { renamed, errors, report };
}

// Exécution si appelé directement
if (require.main === module) {
  const photosDir = process.argv[2];
  const csvPath = process.argv[3];

  if (!photosDir || !csvPath) {
    console.error('Usage: node rename-product-images.js <dossier_photos> <fichier_csv>');
    process.exit(1);
  }

  const { renamed, errors, report } = renameFiles(photosDir, csvPath);
  console.log(report);
  
  // Écrire le rapport dans un fichier
  fs.writeFileSync('rename-report.txt', report);
  
  if (errors > 0) {
    process.exit(1);
  }
}

export { renameFiles, validateFilename, CONVENTION_REGEX };
```

**Exemple de CSV de correspondance (`mapping.csv`) :**

```csv
fichier_original,modele,couleur,angle
IMG_001.jpg,air-max-90,noir,face
IMG_002.jpg,air-max-90,noir,profil
IMG_003.jpg,air-max-90,noir,dessus
IMG_004.jpg,air-max-90,noir,semelle
IMG_005.jpg,air-max-90,noir,detail
IMG_006.jpg,air-max-90,noir,porte
IMG_007.jpg,stan-smith,blanc,face
...
```

**Utilisation :**

```bash
# Depuis la racine du projet
cd docs/content/CNT-01
mv IMG_001.jpg air-max-90-noir-face.jpg  # (après avoir rempli mapping.csv)

# Ou via le script
node scripts/rename-product-images.ts ./media/products ./mapping.csv
```

Le script valide chaque ligne contre la regex, log les erreurs, et génère un rapport `rename-report.txt`.
```
- Si un champ `angle` est ajouté à ProductImage (migration additive), il prendra les valeurs de l'enum Angle { FACE, PROFIL, DESSUS, SEMELLE, DETAIL, PORTE } — sinon, l'angle est encodé uniquement dans le nom de fichier