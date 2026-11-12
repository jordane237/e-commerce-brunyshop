# CAT-04 — Vérification (API admin produits/variantes)

Branche : `feature/CAT-04-admin-products-variants-api` (vérifiée via `git branch --show-current`).
Date de vérification : 2026-11-10 (exécution locale agent).

## Résumé des contrôles

| # | Contrôle | Résultat | Preuve |
|---|---|---|---|
| 1 | Build backend | ✅ | `pnpm -C backend build` → génération Prisma + `tsc` succès. |
| 2 | Tests unitaires slug | ✅ | `slug-generator.service.test.ts` → **9/9**. |
| 3 | Tests unitaires SKU | ✅ | `sku-generator.service.test.ts` → **7/7**. |
| 4 | Tests unitaires service admin | ✅ | `admin-products.service.test.ts` → **28/28**. Suite unitaire complète : `pnpm -C backend test` → **153/153** (15 fichiers). |
| 5 | Tests e2e CAT-04 | ✅ | `test/admin-products.e2e-spec.ts` → **41/41**. Suite e2e complète : `pnpm -C backend test:e2e` → **96/96** (6 fichiers). |
| 6 | ESLint | ✅ | `pnpm -C backend exec eslint src test --max-warnings=0` → 0 erreur / 0 warning. |
| 7 | Prisma generate / migration | ✅ | Migration `20261109120000_cat04_admin_products_variants` appliquée ; `@@unique([productId,color,size])` et `AuditLog.userAgent` présents. |
| 8 | Démarrage backend / health | ✅ | `GET /api/v1/health/ready` → **200** `{database: up, redis: up}` sur l’instance locale (port 4000 occupé, vérification sur port 4100 avec le build courant). |
| 9 | Test manuel création + SKU | ✅ | `POST /admin/products` (JWT STOCK_MANAGER) → **201**, slug généré, 2 SKU uniques (`BARRAGEF-PRODUITMAN-42-BLANC`, `...-NOIR`), `GET /products/:slug` → **200**. |
| 10 | Test manuel audit prix/stock | ✅ | `PATCH` prix → `AuditLog.action = PRODUCT_PRICE_UPDATED` (1 ligne) ; `PUT` variante existante stock 4→9 → `PRODUCT_STOCK_UPDATED` (1 ligne) + `StockMovement` `ADJUSTMENT` delta 5. |
| 11 | Test manuel cache + RBAC | ✅ | Liste publique `q=<token>` : **0 avant** création, **1 après** (cache invalidé immédiatement). `POST` sans JWT → **401** ; avec JWT CUSTOMER → **403**. |
| 12 | Documentation / OpenAPI | ✅ | `docs/backend/admin-products.md`, ce rapport, `openapi.json` régénéré (`pnpm -C backend openapi:export`, 21 paths). |

## Vérifications manuelles complémentaires

- `DELETE /admin/products/:id` → **204**, statut en base **ARCHIVED**, puis `GET /products/:slug` → **404** (pas de suppression physique).
- `POST /admin/products/:id/duplicate` → **201**, copie **DRAFT**, slug suffixé `-copie`, nouveaux SKU générés.
- `PUT /admin/products/:id/variants` avec variante liée à une commande → **409 `VARIANT_HAS_ORDERS`** (couvert e2e).
- `reservedStock` envoyé dans `PUT /variants` → **400** (couvert e2e + rejet service).
- Rate limit admin (60/min/IP) → **429** au 61e appel (couvert e2e).

## Correctifs appliqués pendant cette vérification

- **Validation DTO réellement active** : `UpdateProductDto`, `UpdateVariantsDto` et `DuplicateProductDto` étaient importés en `import type` dans le contrôleur. TypeScript effaçait alors la métadonnée de paramètre et Nest validait `Object` (aucune validation). Passage en imports de valeur.
- **Swagger** : ajout des réponses succès (`201/200/204`), `400`, et des exemples `@ApiBody` (variantes explicites + cartésien).
- **Tests unitaires admin** : harnais corrigé (transaction mock partagé, audit `record(tx, event)`, cache mock, `findUniqueOrThrow`, snapshots produit complets, structures `variants.create`). Aucun changement de logique métier.
- **Test unitaire catalogue** : constructeur `CatalogService(prisma, cache)` réaligné (un paramètre audit obsolète était encore injecté par le test).

## Points d’alignement implémentation vs prompt

- **Structure** : `backend/src/modules/catalog/admin/*` (convention du projet) ; contrôleur admin séparé du contrôleur public.
- **Tests** : `*.test.ts` et e2e `backend/test/*.e2e-spec.ts` (conventions projet).
- **Audit** : `CATALOG_AUDIT_ACTIONS` (texte libre `AuditLog.action`) inclut `PRODUCT_PRICE_UPDATED` et `PRODUCT_STOCK_UPDATED` ; pas d’enum Prisma `SensitiveAction` nécessaire.
- **Actor audit** : le contrôleur transmet `userId`, `ip`, `user-agent` ; l’audit est écrit dans la même transaction que la mutation.
- **Archivage** : `DELETE` → `status = ARCHIVED` (204), jamais de suppression physique.
- **Duplication** : toujours `DRAFT` ; `status` différent de `DRAFT` refusé (`DUPLICATE_STATUS_FORBIDDEN`).
- **Suppression de variante** : refusée (`409 VARIANT_HAS_ORDERS`) si une `OrderItem` la référence.
- **`reservedStock`** : non modifiable via l’API admin.

## Commandes de reproduction

```bash
git branch --show-current
pnpm -C backend build
pnpm -C backend test
pnpm -C backend exec eslint src test --max-warnings=0
VITE_CONFIG_NATIVE_IGNORE_WARNING=true pnpm -C backend test:e2e
pnpm -C backend openapi:export
```

## Limites connues

- Les tests e2e et les vérifications manuelles nécessitent PostgreSQL + Redis locaux et les rôles seedés.
- L’instance locale du port 4000 était déjà occupée ; la vérification runtime a été faite sur le port 4100 avec le build courant (même base/Redis, mêmes variables).
