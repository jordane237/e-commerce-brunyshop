# STK-05 — Vérification

Branche : `feature/STK-05-admin-stock-screen` (base `working`, STK-02 mergé en #204).

## Checks exécutés dans cette session

| # | Check | Commande | Résultat |
|---|---|---|---|
| 1 | E2E backend variantes stock | `npx vitest run --config vitest.e2e.config.ts admin-stock-variants` | ✅ 5 tests (401, 403, calculs, filtres statut, catégorie/recherche, pagination) |
| 2 | Tests unitaires backend (suite complète) | `pnpm -C backend test` | ✅ 30 fichiers / 275 tests |
| 3 | Tests unitaires écran stock | `npx vitest run apps/admin/src/app/features/stock` | ✅ 2 fichiers / 22 tests (`AdminStockStore` 13, `StockListComponent` 9) |
| 4 | Lint backend | `pnpm -C backend lint` | ✅ 0 erreur |
| 5 | Lint frontend | `pnpm -C frontend lint` | ✅ 0 erreur |
| 6 | Typecheck (backend + storefront + admin) | `pnpm typecheck` | ✅ (correction de typage `CategoryNode` dans `stock-list.component.ts`) |
| 7 | Build admin production | `pnpm -C frontend build:admin` | ✅ |
| 8 | Export OpenAPI | `pnpm -C backend openapi:export` | ✅ 34 paths |
| 9 | Régénération des types API | `pnpm api:generate` | ✅ |
| 10 | Idempotence export + génération | deux passes, `sha256sum` comparés | ✅ `openapi.json` et `api-types.ts` stables |
| 11 | `pnpm api:check` / `pnpm openapi:check` | — | ⚠️ échouent **avant commit** car ces scripts font `git diff --exit-code` ; à rejouer sur arbre propre (voir §Commit) |
| 12 | Audit dépendances prod | `pnpm audit --prod --audit-level=high` | ✅ 0 high/critical (3 low, 6 moderate préexistantes) |
| 13 | Gitleaks local | `gitleaks detect` | ⚠️ non vérifié : binaire absent de la machine ; contrôle assuré par la CI |

### Suite frontend complète

`pnpm -C frontend test` : 93 fichiers / 529 tests verts, 6 fichiers / 8 tests en échec **par timeout** (`Test timed out in 5000ms`, `Hook timed out in 10000ms`) sous charge parallèle — tous côté **storefront** (`catalog-page`, `consent-banner`, `faq`, `size-guide`, `legal-notice`, `cart-summary`), aucun fichier touché par STK-05.

Rejeu isolé de ces 6 fichiers : **27/27 verts**. Conclusion : flakiness de timeout liée à la charge machine, pas une régression STK-05.

## Conformité aux critères d’acceptation

| CA | Vérification | État |
|---|---|---|
| #1 Vue par variante + filtres (rupture, stock bas, catégorie) + recherche | `GET /admin/stock/variants` (filtres serveur, recherche insensible à la casse), UI barre d’outils | ✅ |
| #2 Ajustement rapide, motif obligatoire | Modale d’ajustement + `adjustStock` (API STK-02), validation motif | ✅ |
| #3 Historique des mouvements | Modale historique branchée sur `GET /admin/stock-movements` | ✅ |
| #4 Export CSV | Génération client : BOM UTF-8, séparateur `;`, échappement des guillemets | ✅ |
| #5 Cartes sur mobile | `CardList` sous `matchMedia('(max-width: 767px)')` | ✅ |
| RBAC | `@Roles('STOCK_MANAGER','ADMIN','SUPER_ADMIN')` + `roleGuard(navRoles('stock'))` | ✅ couvert par l’e2e (401/403) |
| Montants XAF entiers | Stock/seuils en `number` entiers, aucun flottant monétaire introduit | ✅ |
| Microtextes FR | Libellés FR centralisés dans les templates | ✅ |

## Limites connues

- L’historique affiche les mouvements de la variante sans filtres période/motif dans l’UI, alors que l’API les accepte (`from`, `to`, `motif`).
- L’export CSV porte sur la page courante, pas sur l’intégralité du stock filtré.
- Aucun test e2e Playwright admin n’a été ajouté pour ce parcours : couverture assurée par l’e2e backend et les tests unitaires.
- Aucune vérification visuelle en navigateur (captures) n’a été réalisée.
