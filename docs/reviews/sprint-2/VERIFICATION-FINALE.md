# Vérification finale Sprint 2

Exécutée le 12 novembre 2026 sur `review/sprint-2-final-audit` (`4cb7818`).

| # | Check | Statut | Preuve |
|---|---|---|---|
| 1 | `pnpm install --frozen-lockfile` | ✅ | Lockfile à jour, installation terminée en 4,8 s |
| 2 | Prisma generate | ✅ | Inclus dans `pnpm -C backend build` |
| 3 | Migration status | ✅ | `13 migrations found`, `Database schema is up to date!` |
| 4 | Lint backend | ✅ | `pnpm -C backend lint` : 0 erreur |
| 5 | Lint frontend | ✅ | `pnpm -C frontend lint` : 0 erreur |
| 6 | Build backend | ✅ | `pnpm -C backend build` : succès |
| 7 | Build shop | ✅ | `pnpm -C frontend build:storefront` : succès, `browser/` + `server/` générés |
| 8 | Build admin | ✅ | `pnpm -C frontend build:admin` : succès, `browser/` généré |
| 9 | Tests unitaires backend | ✅ | `24` fichiers, `242` tests passés |
| 10 | Tests e2e backend | ✅ | `14` fichiers, `202` tests passés (Docker Postgres/Redis/MinIO/Mailpit) |
| 11 | Tests frontend shop | ⚠️ partiel | `5` suites UI en échec, `41` tests échoués / `89` passés |
| 12 | Tests frontend admin | ➖ non applicable | Aucun fichier de test dédié dans `frontend/apps/admin` |
| 13 | OpenAPI à jour | ✅ | `pnpm -C backend openapi:export` : aucun diff sur `backend/openapi.json` |
| 14 | Démarrage backend | ⚠️ non exécuté | Non lancé manuellement ; boot vérifié indirectement par les e2e |
| 15 | Démarrage shop | ⚠️ non exécuté | Non lancé manuellement |
| 16 | Démarrage admin | ⚠️ non exécuté | Non lancé manuellement |
| 17 | SSR check | ⚠️ non exécuté | Build SSR présent (`storefront/server/`), pas de curl manuel |
| 18 | Smoke test API | ⚠️ non exécuté | Couvert partiellement par les e2e backend |
| 19 | Storage vide (TEC-12) | ✅ | Aucun `localStorage`/`sessionStorage` pour l'auth ; session en mémoire (`session.service.ts`) |
| 20 | Refresh silencieux | ✅ | Testé dans `auth.service.spec.ts` / `session.service.spec.ts` |
| 21 | Refresh queue | ✅ | `refresh-queue.service.spec.ts` : 1 seul refresh pour requêtes concurrentes |

## Détail des échecs frontend
Suites en échec, toutes dans `libs/ui` :
- `input.component.spec.ts`
- `price-tag.component.spec.ts`
- `product-card.component.spec.ts`
- `size-selector.component.spec.ts`
- `skeleton.component.spec.ts`

Ces échecs sont préexistants et liés à un décalage entre l'API des composants et leurs tests (ex. `shape` vs `variant` sur le skeleton). Ils ne bloquent pas les builds.

## Synthèse
- Checks exécutés et verts : install, Prisma/migrations, lint backend/frontend, builds backend/shop/admin, tests unitaires backend, e2e backend, OpenAPI, cœur TEC-12.
- Checks non exécutés manuellement : démarrages HTTP, SSR curl, smoke test API.
- `pnpm -C frontend test` reste rouge à cause des 5 suites UI listées ci-dessus.
