# CAT-03 — Vérification de la fiche produit API

Branche : `feature/CAT-03-product-detail-api` (créée avant tout code, depuis `ac9121b`).
Date des vérifications : 9 novembre 2026.

## Résultats

| # | Vérification | Commande | Résultat |
|---|---|---|---|
| 1 | Branche active | `git branch --show-current` | ✅ `feature/CAT-03-product-detail-api` |
| 2 | Build backend | `pnpm -C backend build` | ✅ `prisma generate` + `tsc` sans erreur |
| 3 | Tests unitaires | `pnpm -C backend test` | ✅ 12 fichiers, **101 tests** (dont 17 fiche produit + 8 cache) |
| 4 | Tests e2e CAT-03 | `npx vitest run --config vitest.e2e.config.ts test/product-detail.e2e-spec.ts` | ✅ **15 tests** |
| 5 | e2e sans régression | `npx vitest run --config vitest.e2e.config.ts test/api.e2e-spec.ts test/cart-validation.e2e-spec.ts test/product-detail.e2e-spec.ts` | ✅ 3 fichiers, 41 tests |
| 6 | ESLint (code livré) | `npx eslint src test/product-detail.e2e-spec.ts test/api.e2e-spec.ts test/cart-validation.e2e-spec.ts --max-warnings=0` | ✅ 0 erreur |
| 7 | Docker Compose | `docker compose ps` | ✅ `bruny-postgres` (15432) et `bruny-redis` (16379) healthy |
| 8 | Prisma generate | `pnpm -C backend prisma generate` | ✅ client 7.10.0 généré |
| 9 | Démarrage + readiness | `PORT=4020 node dist/main.js` puis `GET /api/v1/health/ready` | ✅ `200` (`database: up`, `redis: up`) |
| 10 | Détail produit | `curl /api/v1/products/sneakers-urbanstep-air` | ✅ `200`, DTO complet |
| 11 | 404 uniforme | `curl /api/v1/products/produit-inexistant` | ✅ `404 PRODUCT_NOT_FOUND` |
| 12 | Slug invalide | `curl /api/v1/products/INVALID_SLUG` | ✅ `400 VALIDATION_ERROR` |
| 13 | Non-régression liste | `curl /api/v1/products?page=1&limit=2` | ✅ `200`, `{ items, pagination }`, `total: 20` |
| 14 | Absence de stock brut | sérialisation JSON de la fiche | ✅ `"stock":` absent, `reservedStock` absent, `availableStock` présent |

Le serveur de vérification a été lancé sur le port **4020** : un ancien processus de
développement occupait déjà `4000` (dist antérieur, sans CAT-03). Le `.env` du dépôt pointe
bien sur `PORT=4000` pour l'usage normal.

## Preuves

### Fiche produit (extrait réel)

```json
{
  "slug": "sneakers-urbanstep-air",
  "basePrice": 24500,
  "effectivePrice": 24500,
  "promoPrice": null,
  "isPromoActive": false,
  "images": 2,
  "colors": 1,
  "sizes": 11,
  "variants": 11,
  "similarProducts": 3,
  "variants[0]": {
    "sku": "BARRAGEF-SNEAKERSUR-36-BLANC",
    "size": "36",
    "color": "BLANC",
    "effectivePrice": 24500,
    "availableStock": 14,
    "isAvailable": true
  },
  "sizes[0]": { "size": "36", "availableStock": 14, "isAvailable": true, "isLowStock": false }
}
```

### 404 uniforme (extrait réel)

```json
{
  "statusCode": 404,
  "code": "PRODUCT_NOT_FOUND",
  "message": "Produit introuvable.",
  "errors": [],
  "requestId": "f8eee555-…",
  "timestamp": "2026-11-09T14:14:47.668Z"
}
```

Le test e2e compare ce corps (hors `requestId`/`timestamp`) pour un slug inconnu, un `DRAFT`,
un `ARCHIVED` et un produit `deletedAt != null` : identique dans les quatre cas.

### Stock disponible

Le test e2e crée une variante `stock = 10`, `reservedStock = 4` → `availableStock = 6`, et
vérifie que le JSON ne contient ni `"stock":` ni `reservedStock`. Le test unitaire couvre en
plus `stock = 2`, `reservedStock = 5` → `0` (plancher).

## Limites rencontrées (hors périmètre CAT-03)

1. **`pnpm -C backend lint` échoue** à cause de `backend/test/notifications.e2e-spec.ts`,
   fichier **non suivi** hérité de NTF-01 (variables inutilisées, `any` explicite). Le code
   CAT-03 et les e2e suivis passent ESLint sans erreur.
2. **`pnpm -C backend test:e2e` complet** échoue pour la même raison : ce fichier non suivi
   ne se charge pas. Les 3 suites suivies passent (41 tests).
3. **Frontend** : le lint des fichiers modifiés passe. Le typecheck global est déjà cassé
   avant CAT-03 (`frontend/libs/util/src/index.ts` exporte `./lib/cookie.factory`, absent ;
   `product-card.component.ts` importe `@bruny/util/lib/money`, non résolu par
   `tsconfig.app.json`) — aucune erreur dans les fichiers CAT-03. `nx build storefront`
   refuse de démarrer : Angular CLI exige Node ≥ 24.15.0, l'environnement fournit 24.11.0.
4. **Liste CAT-01** : `GET /products` expose encore le stock brut. L'alignement appartient à
   CAT-02, absent du dépôt (voir `docs/backend/catalog.md`, limites connues).
