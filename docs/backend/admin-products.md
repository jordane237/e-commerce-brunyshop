# Catalogue — Administration des produits et variantes (CAT-04)

Documentation des mutations admin du catalogue (`backend/src/modules/catalog/admin`). Montants en **XAF entiers** (`Int`, jamais `Decimal`/`Float`).

## Endpoints

Toutes les routes sont protégées par l’authentification JWT globale + `@Roles('STOCK_MANAGER', 'ADMIN', 'SUPER_ADMIN')` et limitées à **60 requêtes / 60 s / IP** (`@Throttle`).

| Méthode | Route | Rôle requis | Description |
|---|---|---|---|
| `POST` | `/api/v1/admin/products` | STOCK_MANAGER, ADMIN, SUPER_ADMIN | Créer un produit + variantes |
| `PATCH` | `/api/v1/admin/products/:id` | idem | Mettre à jour un produit (sans variantes/images) |
| `DELETE` | `/api/v1/admin/products/:id` | idem | Archiver (`status = ARCHIVED`, **pas de suppression physique**) |
| `PUT` | `/api/v1/admin/products/:id/variants` | idem | Remplacer l’ensemble des variantes (upsert différentiel) |
| `POST` | `/api/v1/admin/products/:id/duplicate` | idem | Dupliquer un produit (**copie toujours `DRAFT`**) |

`:id` est validé par `ParseUUIDPipe` (UUID invalide → 400).

## Codes de réponse

- `201` création / duplication réussie
- `200` mise à jour / remplacement variantes réussi
- `204` archivage réussi
- `400` validation DTO ou règle métier (`VALIDATION_ERROR`, `PROMO_PRICE_INVALID`, `PROMO_WINDOW_INVALID`, `PUBLISHED_REQUIRES_STOCK`, `DUPLICATE_VARIANT`, `CATEGORY_NOT_FOUND`, `BRAND_NOT_FOUND`, `VARIANT_NOT_OWNED`, `DUPLICATE_STATUS_FORBIDDEN`)
- `401` non authentifié
- `403` rôle insuffisant (ex. `CUSTOMER`)
- `404` produit introuvable (`PRODUCT_NOT_FOUND`)
- `409` conflit (`SLUG_ALREADY_EXISTS`, `SKU_ALREADY_EXISTS`, `VARIANT_HAS_ORDERS`)
- `429` dépassement du rate limit

## DTOs

### `CreateProductDto`

Champs principaux : `name`, `slug?` (généré si absent), `description`, `categoryId` (UUID), `brandId` (UUID), `status?` (`DRAFT` par défaut), `basePrice` (XAF), `promoPrice?`, `promoStart?`, `promoEnd?`, `seoTitle?`, `seoDescription?`, `images?[]`.

Variantes (XOR, validé) :
- **Format explicite** : `variants[]` (`color`, `size`, `price?`, `stock`, `lowStockThreshold?`). Contrôle fin.
- **Format cartésien** : `colors[]` + `sizes[]` → produit cartésien, stock initial `0`, prix variante `null`, SKU générés automatiquement.

Règles : au moins 1 variante ; pas de doublon `(color, size)` (normalisé en majuscules, accents retirés) ; `promoPrice < basePrice` ; `promoStart < promoEnd` ; `PUBLISHED` ⇒ au moins une variante avec `stock > 0`.

### `UpdateProductDto`

Mise à jour partielle des métadonnées/prix/promo/statut/SEO/catégorie/marque/slug. **Ne modifie pas** les variantes (réservé à `PUT /:id/variants`) ni les images.

### `UpdateVariantsDto`

`variants[]` avec `id?` (existant), `color`, `size`, `stock`, `price?`, `lowStockThreshold?`. Upsert différentiel :
- `id` présent → mise à jour (la variante doit appartenir au produit).
- `id` absent → création avec **SKU généré**.
- variante existante absente du payload → suppression, **sauf** si liée à une `OrderItem` → `409 VARIANT_HAS_ORDERS`.

`reservedStock` n’est **jamais modifiable** manuellement (maintenu par les réservations/checkout) ; le `ValidationPipe` global (`whitelist + forbidNonWhitelisted`) rejette le champ.

Chaque changement de `stock` crée un `StockMovement` (`ADJUSTMENT`, `delta`, `before/after`, `userId`) et incrémente `version`.

### `DuplicateProductDto`

`name?`, `slug?`, `status?` (seul `DRAFT` accepté), `copyImages?` (défaut `true`), `copyVariants?` (défaut `true`), `resetStock?` (défaut `false`). La copie est **toujours `DRAFT`**. Les variantes copiées reçoivent de **nouveaux SKU** ; les images réutilisent les mêmes URLs (pas de duplication physique MinIO).

## Génération slug (`SlugGeneratorService`)

- Slugification : minuscules, accents supprimés, caractères non alphanumériques → `-`, tirets multiples réduits.
- Unicité vérifiée en base (`Product.slug`). Collision → suffixe `-2`, `-3`, … (max 100 tentatives, sinon échec interne).
- En mise à jour, l’`id` courant est exclu de la vérification.

## Génération SKU (`SkuGeneratorService`)

- Format aligné seed TEC-07 : `{MARQUE}-{PRODUIT}-{TAILLE}-{COULEUR}` (segments alphanumériques majuscules ; marque ~3, produit ~6-8, couleur ~3-4 selon implémentation).
- Unicité vérifiée (`ProductVariant.sku`) + suffixe `-2`, `-3`, … en cas de collision.
- Génération batch pour `colors × sizes` / variantes créées en une passe, avec détection des collisions internes.

## Statuts et transitions

`DRAFT` | `PUBLISHED` | `ARCHIVED`. Transitions libres via `PATCH`. La publication exige au moins une variante avec `stock > 0`. `DELETE /admin/products/:id` effectue un **archivage logique** (`ARCHIVED`) ; aucune suppression physique.

## Audit (AUT-08)

Chaque mutation écrit un `AuditLog` **dans la même transaction Prisma** que l’écriture métier (atomicité). Acteur : `userId` (JWT) + `ip`/`user-agent` transmis par le contrôleur. Actions catalogue (`catalog-audit.actions.ts`, colonne texte libre) :

- `PRODUCT_CREATED`
- `PRODUCT_UPDATED`
- `PRODUCT_PRICE_UPDATED` (prix produit/promo ou prix variante, `before/after`)
- `PRODUCT_STOCK_UPDATED` (stock variante, `before/after`)
- `PRODUCT_STATUS_UPDATED`
- `PRODUCT_ARCHIVED`
- `PRODUCT_DUPLICATED` (source + résultat)
- `PRODUCT_VARIANTS_UPDATED` (résumé)

## Cache

Après **chaque mutation réussie** (create/update/archive/replaceVariants/duplicate), `CatalogCacheService.invalidateProducts()` invalide les entrées `catalog:products:*` (détail, listes, facettes) par `SCAN`+`DEL`. Les endpoints publics reflètent la mutation immédiatement.

## Transactions Prisma

`create`, `update`, `archive`, `replaceVariants`, `duplicate` utilisent `prisma.$transaction` pour l’atomicité (produit/variantes/images/mouvements/audit). Un échec provoque un rollback complet.

## RBAC

`JwtAuthGuard` + `RolesGuard` sont globaux ; le contrôleur impose `@Roles('STOCK_MANAGER', 'ADMIN', 'SUPER_ADMIN')`. Sans JWT → 401, rôle `CUSTOMER` → 403.

## Exemples

Création (variantes explicites) :

```json
POST /api/v1/admin/products
{
  "name": "Air Max 90 Noir",
  "description": "Sneaker classique, confortable au quotidien.",
  "categoryId": "<uuid>",
  "brandId": "<uuid>",
  "basePrice": 45000,
  "variants": [
    { "color": "NOIR", "size": "40", "stock": 5 },
    { "color": "BLANC", "size": "42", "stock": 10 }
  ]
}
```

Création (cartésien) : fournir `colors` + `sizes` (sans `variants`).

Archivage : `DELETE /api/v1/admin/products/:id` → `204`, `status` passe à `ARCHIVED`.

Duplication : `POST /api/v1/admin/products/:id/duplicate` avec `{ "name": "...", "resetStock": true }` → `201`, produit `DRAFT`.
