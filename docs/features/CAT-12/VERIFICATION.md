# CAT-12 — Vérification

Date : 2026-11-21. Branche : `feature/CAT-12-scheduled-promotions`.

## Critères d’acceptation

| CA | Vérification | Résultat |
| --- | --- | --- |
| #1 Prix promo avec dates début/fin par produit | `Product.promoPrice/promoStart/promoEnd` (schéma TEC-06, aucune migration) + validation `PROMO_DATES_REQUIRED` / `PROMO_WINDOW_INVALID` | ✅ |
| #2 Prix calculé côté serveur à l’instant de la requête | `PricingService.calculatePrice(product, at)`, `at = new Date()` (UTC), bornes inclusives, utilisé par catalogue, fiche et panier | ✅ |
| #3 Prix barré + pourcentage d’économie côté client | `PriceTag.compareAt` + badge `−17 %` alimenté par `discountPercent` serveur (P02/P04) | ✅ |
| #4 Prix promo supérieur au prix normal refusé | `PROMO_PRICE_INVALID` (400) + défensif dans `isPromoActive` | ✅ |

## Checks exécutés

| # | Check | Commande | Résultat |
| --- | --- | --- | --- |
| 1 | Build backend | `pnpm -C backend build` | ✅ |
| 2 | Build storefront production | `pnpm build:storefront` | ✅ |
| 3 | Build admin production | `pnpm build:admin` | ✅ |
| 4 | Tests unitaires backend | `pnpm -C backend test` | ✅ 282 tests (dont 11 PricingService, 1 validation dates requises) |
| 5 | Tests e2e backend complets | `pnpm -C backend test:e2e` | ✅ 241 tests / 19 fichiers |
| 6 | e2e promotions dédiées | `vitest run --config vitest.e2e.config.ts test/promotions.e2e-spec.ts` | ✅ 10 tests |
| 7 | ESLint backend | `pnpm -C backend exec eslint src test --max-warnings=0` | ✅ 0 erreur |
| 8 | Tests unitaires frontend | `cd frontend && pnpm test` | ✅ 529 tests |
| 9 | ESLint frontend | `cd frontend && npx eslint . --max-warnings=0` | ✅ 0 erreur |
| 10 | e2e fiche produit (dont badge −17 %) | `npx playwright test e2e/product-detail.spec.ts` | ✅ 14 tests |
| 11 | OpenAPI à jour | `pnpm -C backend openapi:export` | ✅ `discountPercent` présent |
| 12 | Client API idempotent | `pnpm api:generate` deux fois | ✅ hash identique (`ba5cfcf…`) |

## Preuves ciblées

### Bornes de dates (CA #1)

`backend/src/common/pricing/pricing.service.test.ts`, fenêtre du 15/01/2026 00:00:00 UTC au 20/01/2026 23:59:59 UTC :

- `at = promoStart − 1 s` → inactif, 30 000 FCFA
- `at = promoStart` → actif, 25 000 FCFA
- `at = promoStart + 1 s` → actif
- `at = promoEnd − 1 s` → actif
- `at = promoEnd` → actif
- `at = promoEnd + 1 s` → inactif, 30 000 FCFA

Cas complémentaires : `promoPrice = null`, `promoPrice >= basePrice`, `promoStart/promoEnd = null`, `discountPercent = 17`, calcul par défaut sur « maintenant ».

### Validation admin (CA #4)

`backend/test/promotions.e2e-spec.ts` :

- `promoPrice = 35 000` / `basePrice = 30 000` → 400 `PROMO_PRICE_INVALID`
- `promoStart > promoEnd` → 400 `PROMO_WINDOW_INVALID`
- `promoPrice` sans dates → 400 `PROMO_DATES_REQUIRED`
- promotion complète → 201

### Calcul serveur et affichage (CA #2, #3)

- Liste `GET /products` : promo active → `isPromoActive=true`, `effectivePrice=25000`, `discountPercent=17` ; expirée → `false/30000/null` ; future → `false/30000` ; sans promo → `false/30000`.
- Filtre `?promo=true` : seule la promotion active est retournée.
- Fiche `GET /products/:slug` : `discountPercent=17`, variantes à 25 000.
- e2e fiche produit : prix barré « 30 000 FCFA », prix « 25 000 FCFA », badge « −17 % ».

## Points non couverts localement

- Le formulaire admin de saisie promo (BO-04) n’existe pas encore : la programmation passe par l’API (documenté dans `README.md`).
- Aucun test de charge sur les filtres promo à grande échelle.
