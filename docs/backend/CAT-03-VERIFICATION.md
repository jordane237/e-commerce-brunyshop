# CAT-03 — Vérification de la fiche produit API

Branche active : `feature/CAT-03-product-detail-api` (`git branch --show-current`).
Date des vérifications : 10 novembre 2026.

## Résultats des 11 contrôles

| # | Vérification | Résultat | Preuve |
|---|---|---|---|
| 1 | Branche active | ✅ | `feature/CAT-03-product-detail-api` |
| 2 | Build backend | ✅ | `pnpm -C backend build` → Prisma generate + `tsc` sans erreur |
| 3 | Tests unitaires complets | ✅ | `pnpm -C backend test` → **102/102** (12 fichiers), dont **18** pour `product-detail.service.test.ts` |
| 4 | Tests e2e CAT-03 | ✅ | `test/product-detail.e2e-spec.ts` → **15/15** |
| 5 | E2E sans régression | ✅ | `pnpm -C backend test:e2e` → **41/41** (3 fichiers : api, cart-validation, product-detail) |
| 6 | ESLint | ✅ | `pnpm -C backend exec eslint src test --max-warnings=0` → 0 erreur / 0 warning |
| 7 | Docker Compose | ✅ | PostgreSQL `15432` et Redis `16379` healthy (utilisés par les e2e) |
| 8 | Prisma generate | ✅ | Client 7.10.0 généré (inclus dans le build) |
| 9 | Démarrage + readiness | ✅ | `PORT=4020 node dist/main.js` → `GET /api/v1/health/ready` **200** (`database: up`, `redis: up`) |
| 10 | Fiche produit réelle | ✅ | `GET /api/v1/products/sneakers-urbanstep-lady` → **200**, 20 clés DTO, 11 variantes, 11 pointures, 3 similaires, `availableStock = 14` |
| 11 | 404 / slug invalide / liste | ✅ | slug inconnu → **404 PRODUCT_NOT_FOUND** ; `INVALID_SLUG` → **400 VALIDATION_ERROR** ; `GET /products?page=1&limit=2` → **200**, 2 items / total 20 |

## Absence de stock brut (CA #2)

Sur la réponse réelle de la fiche :

```text
"stock" occurrences         : 0
"reservedStock" occurrences : 0
availableStock              : 14
```

Le test e2e crée une variante `stock = 10`, `reservedStock = 4` → `availableStock = 6` et
vérifie que le JSON sérialisé ne contient ni `"stock":` ni `reservedStock`. Le test unitaire
couvre `stock = 2`, `reservedStock = 5` → `0` (plancher `Math.max(0, …)`).

## Preuves runtime

### Fiche produit (extrait réel)

```json
{
  "slug": "sneakers-urbanstep-lady",
  "basePrice": 22000,
  "effectivePrice": 22000,
  "promoPrice": null,
  "isPromoActive": false,
  "inStock": true,
  "variants": 11,
  "colors": 1,
  "sizes": 11,
  "similarProducts": 3,
  "variants[0]": {
    "sku": "BARRAGEF-SNEAKERSUR-36-BLANC",
    "size": "36",
    "color": "BLANC",
    "effectivePrice": 22000,
    "availableStock": 14,
    "isAvailable": true
  }
}
```

### 404 uniforme

```json
{
  "statusCode": 404,
  "code": "PRODUCT_NOT_FOUND",
  "message": "Produit introuvable.",
  "errors": [],
  "requestId": "…",
  "timestamp": "…"
}
```

Le e2e compare ce corps (hors `requestId`/`timestamp`) pour un slug inconnu, un `DRAFT`, un
`ARCHIVED` et un produit `deletedAt != null` : identique dans les quatre cas.

### Produits similaires (CA #3)

- Même catégorie, produit courant exclu, `status = PUBLISHED`, `deletedAt = null`.
- Fenêtre ±50 % sur le **prix effectif** (promo active incluse). La requête pré-filtre en SQL
  sur `basePrice` **ou** `promoPrice`, puis vérifie le prix effectif en mémoire.
- Limite configurable (`SIMILAR_PRODUCTS_LIMIT`, défaut 6), tri par proximité de prix puis
  récence ; fallback sur les produits les plus récents de la catégorie si la fenêtre est vide.
- Un test unitaire dédié couvre un produit dont seule la promo active entre dans la fenêtre.

### Cache détail

- Clé : `catalog:products:detail:{slug}:v1`, distincte de `catalog:products:list:*` / `facets:*`.
- TTL : `CACHE_PRODUCT_DETAIL_TTL_SECONDS` (défaut 300 s).
- Invalidation : `invalidateProducts()` (SCAN `catalog:products:*`), couverte par le e2e
  « cache puis invalidation ».
- Les 404 ne sont jamais mis en cache.

## Points d’alignement avec le prompt

- Route publique `GET /api/v1/products/:slug`, `@Throttle` 100/min/IP, déclarée après
  `GET /products` (non-régression e2e).
- Slug validé par `ProductSlugParamDto` (`@Matches` kebab-case).
- Prix : `variant.price` override > promo produit active > `basePrice`, source unique
  `backend/src/common/pricing/product-pricing.ts` (partagée avec CRT-01).
- Groupements `colors` et `sizes` calculés côté serveur ; images spécifiques + communes.
- `.env.example` et validation Joi : `CACHE_PRODUCT_DETAIL_TTL_SECONDS=300`,
  `SIMILAR_PRODUCTS_LIMIT=6`.
- Swagger et `openapi.json` régénérés (18 paths, `products/{slug}` présent).

## Limites connues (hors périmètre CAT-03)

- La liste `GET /products` de cette branche (antérieure à CAT-02) sérialise encore les lignes
  Prisma avec le stock brut ; l’alignement liste est traité par CAT-02, absent de cette
  branche. La fiche détail CAT-03 n’expose jamais le stock brut.
- `reservedStock` n’est pas encore alimenté par un job de réservation : il vaut 0 par défaut ;
  la formule `stock - reservedStock` deviendra exacte sans changement de code.
