# [CNT-01] Guide d'Integration Backend + Frontend

## Côté backend

### Structure MinIO

- **Bucket** : `brunyshop-media`
- **Politique de bucket** : lecture publique (GET) pour les images produits, écriture restreinte au service backend
- **Dossier organisation** : `products/{slug}/{couleur}/`
- **URLs publiques** : `https://media.brunyshop.com/products/{slug}/{couleur}/{angle}.webp` (en prod, avec CDN devant MinIO)

### Script d'import des ProductImage

Script parcourant le CSV `product-images.csv` (colonnes : productSlug, couleur, angle, url, alt, position, isPrimary), validant et upsertant dans ProductImage avec `where: { url }`.

```typescript
import { PrismaClient } from '@prisma/client';
import csvParse from 'csv-parse/sync';

const prisma = new PrismaClient();

interface ProductImageData {
  productSlug: string;
  couleur: string;
  angle: string;
  url: string;
  alt: string;
  position: number;
  isPrimary: boolean;
}

function isValidAngle(angle: string): angle is string {
  return ['face', 'profil', 'dessus', 'semelle', 'detail', 'porte'].includes(angle);
}

async function importProductImages(csvPath: string) {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = csvParse.parse<ProductImageData>(csvContent, { columns: true, skip_empty_lines: true });

  for (const record of records) {
    // Valider l'angle
    if (!isValidAngle(record.angle)) {
      console.error(`Angle invalide pour ${record.productSlug}: ${record.angle}`);
      continue;
    }

    // Construire l'URL complète
    const url = `https://media.brunyshop.com/products/${record.productSlug}/${record.couleur}/${record.angle}.webp`;

    // Upsert dans ProductImage
    await prisma.productImage.upsert({
      where: { url },
      update: {
        alt: record.alt,
        position: record.position,
        isPrimary: record.isPrimary,
      },
      create: {
        product: { connect: { slug: record.productSlug } },
        variantColor: record.couleur,
        url,
        alt: record.alt,
        position: record.position,
        isPrimary: record.isPrimary,
      },
    });

    console.log(`Importé : ${record.productSlug} - ${record.angle}`);
  }

  console.log('Import terminé');
}

// Exécution
importProductImages('./product-images.csv')
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
```

### (Optionnel) Ajout d'un champ `angle` à ProductImage

Migration additive : `ADD COLUMN angle VARCHAR(16)` + enum Prisma si pertinent. Décision documentée.

### Validation : script de vérification post-import

Compte les ProductImage par Product (doit être 6 × nombre de couleurs) et signale les produits incomplets.

## Côté frontend Angular

### Composant galerie produit (P04)

- Affiche les 6 angles, image principale = isPrimary
- Miniatures cliquables, lazy loading, alt depuis ProductImage.alt
- srcset pour WebP + JPEG fallback

```html
<picture>
  <source [srcset]="angleImage.webp" type="image/webp">
  <img [src]="angleImage.jpg" [alt]="angleImage.alt">
</picture>
```

### Optimisation

- `<picture><source srcset="face.webp" type="image/webp"><img src="face.jpg" alt="..."></picture>`
- Placeholder skeleton pendant le chargement (réutiliser le composant Skeleton du Design System)
- Fallback si image manquante : placeholder produit générique + log en console (dev) ou monitoring (prod)

### Cadrage CSS

```css
.gallery-image {
  aspect-ratio: 4/5; /* ou 1/1 selon décision */
  object-fit: cover;
  object-position: center;
}
```

## Côté SEO & performance

- Alt descriptif obligatoire (généré depuis modele + couleur + angle)
- Compression WebP systématique (économie ~30% par rapport au JPEG)
- Lazy loading (`loading="lazy"` sauf image principale above-the-fold)
- Dimensions width/height explicites pour éviter le CLS (Cumulative Layout Shift)