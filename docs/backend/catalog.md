# Catalogue — API publique

Documentation du catalogue public de BRUNY SHOPPING (module `backend/src/modules/catalog`).
Montants en XAF entiers (RG-PRX-01).

## Endpoints

| Méthode | Route | Authentification | Limite |
|---|---|---|---|
| `GET` | `/api/v1/products` | publique | 100 req/min/IP (globale) |
| `GET` | `/api/v1/products/:slug` | publique | 100 req/min/IP |
| `GET` | `/api/v1/categories` | publique | 100 req/min/IP |
| `POST` | `/api/v1/admin/products` | `ADMIN` / `STOCK_MANAGER` | 100 req/min/IP |

Le détail produit est servi par `ProductDetailService` (`products/product-detail.service.ts`),
la liste et les catégories par `CatalogService`. La route littérale `GET /products` est
déclarée **avant** `GET /products/:slug` : la liste n'est jamais capturée par le paramètre.

## `GET /products/:slug` (CAT-03)

Retourne la fiche complète d'un produit **publié** : description, images (communes et par
couleur), variantes, prix et promotion active, disponibilités et produits similaires.

### Réponse 200 — `ProductDetailDto`

```jsonc
{
  "id": "0e2f8031-…",
  "slug": "sneakers-urbanstep-air",
  "name": "Sneakers UrbanStep Air",
  "description": "Sneakers légères à semelle amortissante…",
  "seoTitle": null,
  "seoDescription": null,
  "basePrice": 24500,
  "effectivePrice": 24500,
  "promoPrice": null,
  "promoStart": null,
  "promoEnd": null,
  "isPromoActive": false,
  "inStock": true,
  "category": { "id": "…", "name": "Sneakers", "slug": "sneakers" },
  "brand": { "id": "…", "name": "Barrage Foot", "slug": "barrage-foot", "logo": null },
  "images": [
    { "id": "…", "url": "https://…", "alt": "…", "position": 0, "variantColor": null }
  ],
  "colors": [
    {
      "color": "BLANC",
      "slug": "blanc",
      "images": [{ "id": "…", "url": "https://…", "alt": null, "position": 0, "variantColor": null }],
      "availableSizes": ["36", "37", "38"],
      "hasStock": true
    }
  ],
  "sizes": [
    { "size": "36", "availableStock": 14, "isAvailable": true, "isLowStock": false }
  ],
  "variants": [
    {
      "id": "…",
      "sku": "BARRAGEF-SNEAKERSUR-36-BLANC",
      "size": "36",
      "color": "BLANC",
      "effectivePrice": 24500,
      "availableStock": 14,
      "isAvailable": true
    }
  ],
  "similarProducts": [
    {
      "id": "…",
      "slug": "sneakers-urbanstep-tempo",
      "name": "Sneakers UrbanStep Tempo",
      "basePrice": 21500,
      "effectivePrice": 21500,
      "promoPrice": null,
      "promoStart": null,
      "promoEnd": null,
      "isPromoActive": false,
      "inStock": true,
      "category": { "id": "…", "name": "Sneakers", "slug": "sneakers" },
      "brand": { "id": "…", "name": "Barrage Foot", "slug": "barrage-foot", "logo": null },
      "images": [{ "id": "…", "url": "https://…", "alt": null, "position": 0, "variantColor": null }]
    }
  ]
}
```

Les dates sont sérialisées en ISO 8601 (`string`) dans la réponse HTTP.

## Règles métier

### Stock disponible (CA #2)

`availableStock = Math.max(0, stock - reservedStock)`.

- Le champ **`stock` brut (stock physique interne) n'est jamais exposé**, à aucun niveau
  (variante, pointure, couleur, produit). Un test e2e vérifie que le JSON sérialisé ne
  contient ni `"stock":` ni `reservedStock`.
- `reservedStock` n'est pas encore maintenu par un job de réservation (le module inventory
  est un squelette, la réservation appartient au checkout). Il vaut `0` par défaut : la
  formule est donc déjà correcte et deviendra exacte sans changement de code dès que le job
  existera. Même règle que `CartStockService` (CRT-01).
- `sizes[].availableStock` est le **maximum** des variantes de cette pointure, toutes
  couleurs confondues (le sélecteur de pointure de la fiche est global).
- `isLowStock` : `0 < availableStock <= lowStockThreshold`, avec le seuil le plus bas des
  variantes de la pointure (alerte conservatrice).

### Prix effectif et promotion (RG-PRX-02)

Ordre de priorité, du plus fort au plus faible — identique au panier, source unique dans
`backend/src/common/pricing/product-pricing.ts` :

1. `variant.price` (override manuel de la variante) ;
2. `product.promoPrice` si `promoStart <= now <= promoEnd` (bornes incluses) ;
3. `product.basePrice`.

Conséquences :

- la promotion produit s'applique à toutes les variantes **sauf** celles qui ont un prix
  override explicite (l'override gagne : décision documentée, cohérente avec CRT-01) ;
- `promoPrice` n'est renvoyé que si la promotion est **active** ; `promoStart` / `promoEnd`
  restent les dates stockées (une promo future ou expirée est visible dans les dates mais
  `promoPrice` vaut `null` et `isPromoActive` vaut `false`) ;
- `effectivePrice` au niveau produit est le prix de base effectif (promo ou base), pas
  nécessairement celui d'une variante avec override ;
- le prix affiché est exactement celui que `POST /cart/validate` recalculera.

### Images par couleur (CA #1)

`ProductImage.variantColor` :

- `null` → image commune à toutes les couleurs ;
- valeur non nulle → image spécifique à cette couleur (comparaison insensible à la casse,
  les couleurs étant stockées en majuscules : `NOIR`).

`colors[].images` = images spécifiques de la couleur **puis** images communes.
`images` (galerie globale) = images communes d'abord (hero), puis les spécifiques triées par
couleur et position.

### Groupements calculés côté serveur

- `colors[]` : une entrée par couleur, avec `slug` kebab-case, images, `availableSizes`
  (pointures disponibles pour cette couleur) et `hasStock`.
- `sizes[]` : une entrée par pointure, triée numériquement, avec stock disponible maximal et
  indicateur de stock faible.
- `variants[]` : toutes les variantes à plat, fallback pour l'ajout au panier par `id`.

Aucun recalcul n'est nécessaire côté storefront (P04).

### 404 uniforme (CA #4)

Produit inexistant, `DRAFT`, `ARCHIVED` ou `deletedAt != null` → **même** réponse :

```json
{ "statusCode": 404, "code": "PRODUCT_NOT_FOUND", "message": "Produit introuvable." }
```

Le filtre d'exceptions global ajoute `errors`, `requestId` et `timestamp`. Le statut réel
n'est jamais révélé : le filtre `status: 'PUBLISHED', deletedAt: null` est poussé dans la
requête, aucun produit non publié n'est chargé.

Un slug non kebab-case (majuscules, underscore, caractères spéciaux) est rejeté avant la
base : `400 VALIDATION_ERROR`.

### Produits similaires (CA #3)

- même `categoryId`, produit courant exclu ;
- `PUBLISHED` et `deletedAt = null` ;
- fenêtre de prix : prix de base dans `[effectivePrice × 0,5 ; effectivePrice × 1,5]`
  (préfiltre SQL sur `basePrice`, puis classement par distance au prix effectif) ;
- limite `SIMILAR_PRODUCTS_LIMIT` (6 par défaut, 1 à 12) ;
- si aucun produit dans la fenêtre → **fallback** : les plus récents de la même catégorie,
  sans contrainte de prix ;
- tri : distance de prix croissante, puis `createdAt` décroissant.

### Cache Redis

- clé : `catalog:products:detail:{slug}:v1` (distincte des futures clés de liste
  `catalog:products:list:*` et de facettes) ;
- TTL : `CACHE_PRODUCT_DETAIL_TTL_SECONDS` (300 s par défaut) — un changement de prix ou de
  stock met donc au plus 5 minutes à apparaître, acceptable pour le MVP ;
- invalidation : `CatalogCacheService.invalidateProducts()` (`SCAN catalog:products:*`,
  jamais `KEYS`), appelée après une mise à jour admin de produit ;
- **fail-open** : toute erreur Redis est journalisée (pino) et traitée comme un miss ; l'API
  reste servie depuis PostgreSQL, la readiness signale la panne Redis.

## Configuration

| Variable | Défaut | Description |
|---|---|---|
| `CACHE_PRODUCT_DETAIL_TTL_SECONDS` | `300` | TTL du cache de la fiche produit (secondes, ≥ 1) |
| `SIMILAR_PRODUCTS_LIMIT` | `6` | Nombre de produits similaires (1 à 12) |

Validation par `class-validator` dans `backend/src/config/env.validation.ts` (pas de Joi dans
ce dépôt), exposition typée sous `app.catalog` dans `configuration.ts`.

## Limites connues

1. **Liste CAT-01 non alignée** : `GET /products` expose encore `variants[].stock` brut et
   n'a ni filtres marque/stock/promo, ni facettes, ni cache. CAT-02 (absent du dépôt) devra
   aligner la liste et les cartes produit sur `availableStock`.
2. **`reservedStock` non maintenu** : aucun job de réservation pour l'instant (voir plus haut).
3. **Pas de publication admin** : le seul endpoint d'écriture (`POST /admin/products`) crée
   un brouillon ; `updateProduct` invalide le cache, mais aucune route de publication /
   changement de prix n'existe encore.
4. **Pas de section « produits similaires » côté UI** : l'API renvoie les données, le
   storefront n'affiche pas encore ce bloc.
5. **Mode production** : le filtre d'exceptions remplace les messages par un texte générique
   anglais ; l'uniformité du 404 est conservée, mais le message français n'apparaît qu'en
   développement.
