# CNT-01 — Guide d'Integration Backend & Frontend

## Backend : Stockage MinIO + Import Images

### Configuration MinIO (.env.example)

```
STORAGE_DRIVER=s3          # ou s3 (S3-compatible MinIO)
S3_ENDPOINT=http://localhost:9000  # http://localhost:9000 en local
S3_BUCKET=brunyshop-media      # brunyshop-media en prod
S3_REGION=cameroon             # ou us-east-1
S3_ACCESS_KEY_ID=CHANGE_ME
S3_SECRET_ACCESS_KEY=CHANGE_ME
```

### Structure des URLs d'images

**En production (MinIO + CDN)** :
- URL publique : `https://media.brunyshop.com/products/{slug}/{couleur}/{angle}.webp`
- MinIO en backend-only, le CDN (CloudFront / Bunny.net) sert les fichiers en lecture publique
- Format WebP optimisé pour le web (qualité 85%)

**En développement/local** :
- Chemin local : `/products/{slug}/{couleur}/{angle}.webp`
- À utiliser pour le développement local sans MinIO

### Script d'import Prisma via CSV

**Fichier d'entrée** : `product-images.csv` avec les colonnes :
- `productSlug` : slug du produit (ex: `air-max-90`)
- `couleur` : couleur du produit (ex: `noir`)
- `angle` : angle de la vue (ex: `face`)
- `url` : URL de l'image (format MinIO/CDN ou local)
- `alt` : texte alternatif de l'image
- `position` : ordre d'affichage (0=face, 1=profil, 2=dessus, 3=semelle, 4=detail, 5=porte)
- `isPrimary` : true uniquement pour l'angle `face`

**Exemple de product-images.csv** :

```csv
productSlug,couleur,angle,url,alt,position,isPrimary
air-max-90,noir,face,https://media.brunyshop.com/products/air-max-90/noir/face.webp,"Air Max 90 noire — vue de face",0,true
air-max-90,noir,profil,https://media.brunyshop.com/products/air-max-90/noir/profil.webp,"Air Max 90 noire — vue de profil",1,false
air-max-90,noir,dessus,https://media.brunyshop.com/products/air-max-90/noir/dessus.webp,"Air Max 90 noire — vue du dessus",2,false
air-max-90,noir,semelle,https://media.brunyshop.com/products/air-max-90/noir/semelle.webp,"Air Max 90 noire — vue de semelle",3,false
air-max-90,noir,detail,https://media.brunyshop.com/products/air-max-90/noir/detail.webp,"Air Max 90 noire — détail",4,false
air-max-90,noir,porte,https://media.brunyshop.com/products/air-max-90/noir/porte.webp,"Air Max 90 portée — vue lifestyle",5,false
stan-smith,blanc,face,https://media.brunyshop.com/products/stan-smith/blanc/face.webp,"Stan Smith blanche — vue de face",0,true
```

### Import via Prisma

Le script d'import lira ce CSV et fera un upsert dans la base de données via Prisma :

```typescript
// scripts/import-product-images.ts (conceptuel)
import { PrismaClient } from '@prisma/client';
import csvParse from 'csv-parse/sync';
import fs from 'fs';

const prisma = new PrismaClient();

const csvContent = fs.readFileSync('product-images.csv', 'utf-8');
const records = csvParse.parse(csvContent, { columns: true, skip_empty_lines: true });

for (const record of records) {
  await prisma.productImage.upsert({
    where: {
      productId_angle_couleur: {
        productId: /* look up product by slug */,
        angle: record.angle,
        couleur: record.couleur,
      },
    },
    update: {
      url: record.url,
      alt: record.alt,
      position: parseInt(record.position, 10),
      isPrimary: record.isPrimary === 'true',
    },
    create: {
      product: { connect: { slug: record.productSlug } },
      angle: record.angle, // si champ ajouté en DB
      couleur: record.couleur,
      url: record.url,
      alt: record.alt,
      position: parseInt(record.position, 10),
      isPrimary: record.isPrimary === 'true',
    },
  });
}
```

---

## Frontend : Composant P04 Galerie Photos

### Structure du composant `bruny-product-gallery`

Le composant P04 remplace l'affichage simple d'une seule image par une galerie interactive avec 6 angles.

### Props du composant

| Prop | Type | Description | Défaut |
|------|------|-------------|--------|
| `product` | `Product` | Données du produit (incluant `productImages`) | requis |
| `mainImageRatio` | `'1:1' \| '4:5'` | Ratio de l'image principale | `'1:1'` |
| `showAngles` | `boolean` | Afficher la galerie d'angles | `true` |
| `showColorSwitcher` | `boolean` | Afficher le sélecteur de couleur | `true` |

### Interface TypeScript (types) :

```typescript
type AngleName = 'face' | 'profil' | 'dessus' | 'semelle' | 'detail' | 'porte';

interface ProductImage {
  id: string;
  productId: string;
  variantColor?: string;
  url: string; // URL vers l'image webp
  alt: string;
  position: number; // 0-5 dans l'ordre face, profil, dessus, semelle, detail, porte
  isPrimary: boolean;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  // ... autres champs
  images: ProductImage[]; // 6 images, un par angle
}
```

### Interface utilisateur

1. **Image principale** : Affiche `isPrimary === true` (obligatoirement `face`). Utilise le ratio spécifié (`1:1` par défaut).
2. **Galerie d'angles** : Thumbnails cliquables permettant de basculer entre les 6 angles.
3. **Sélecteur de couleur** : Si plusieurs couleurs existent pour le même modèle, permet de changer la couleur affichée.
4. **États** :
   - Au survol : légère opacité ou bordure de focus
   - Cliqué : devient l'image principale temporaire ou permanente
   - `isPrimary` : étiquette "image principale" sur la vue `face`

### Exemple d'utilisation dans une carte produit

```tsx
<bruny-product-gallery
  product={product}
  mainImageRatio="1:1"
  showAngles={true}
  showColorSwitcher={true}
/>
```

### SEO & Pérformance

- **Texte alternatif** (`alt`) requis pour chaque image — important pour l'accessibilité et le SEO
- **Images WebP** servies via CDN — temps de chargement réduit de ~30% par rapport à JPEG de même qualité
- **Lazy loading** : les images de la galerie se chargent à la demande (intersection observer)
- **Résolution** : 3000px sur le grand côté, WebP qualité 85% équilibre qualité/taille
- **Cache CDN** : en-têtes de cache appropriés sur MinIO/CDN pour les images statiques