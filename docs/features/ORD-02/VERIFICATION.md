# ORD-02 — Vérification

> Branche : `feature/ORD-02-order-state-machine` (base `working`, merge #205).
> Environnement : Node.js (`.nvmrc`), NestJS, Prisma 7.10, PostgreSQL `127.0.0.1:15432`,
> Redis `127.0.0.1:16379` (conteneurs Docker `healthy`).
> Tous les résultats ci-dessous proviennent de commandes exécutées dans le dépôt.

---

## 1. Base de données et migration

| Commande | Résultat | Détail |
| --- | --- | --- |
| `npx prisma format` | ✅ | Schéma formaté |
| `npx prisma generate` | ✅ | Client régénéré avec `OrderStatusHistory` |
| `npx prisma migrate deploy` | ✅ | `20261123150000_ord02_order_status_history` appliquée |
| Migration | ✅ | Additive : nouvelle table, 2 index, 2 clés étrangères ; aucune donnée réécrite |

> État local préalable : la migration `20261123100000_stk02_stock_movement_motif`
> était en échec partiel (`finished_at` NULL) alors que ses effets (enum + colonnes)
> existaient déjà. Réparation locale non destructive :
> `npx prisma migrate resolve --applied 20261123100000_stk02_stock_movement_motif`.
> Aucun fichier de migration existant n'a été modifié.

---

## 2. Compilation, lint, types et contrat

| Commande | Résultat | Détail |
| --- | --- | --- |
| `pnpm -C backend build` | ✅ | `prisma generate && tsc -p tsconfig.build.json` |
| `pnpm -C backend lint` | ✅ | 0 erreur |
| `pnpm -C frontend lint` | ✅ | 0 erreur (aucun fichier frontend modifié à la main) |
| `pnpm typecheck` | ✅ | backend + storefront + admin |
| `pnpm -C backend openapi:export` | ✅ | **35 chemins** (34 + `PATCH /admin/orders/{id}/status`) |
| `pnpm api:generate` | ✅ | `api-types.ts` régénéré |

---

## 3. Tests backend

| Commande | Résultat | Détail |
| --- | --- | --- |
| `pnpm -C backend test` | ✅ | **32 fichiers, 297 tests** (275 avant ORD-02 + 22 nouveaux) |
| `pnpm -C backend test:e2e` | ✅ | **21 fichiers, 251 tests**, 0 échec (226 avant + 9 ORD-02 + ajustements) |

### Nouveaux tests

| Fichier | Cas |
| --- | --- |
| `src/modules/orders/order-status.test.ts` | 14 cas : matrice exacte des 13 statuts, 169 paires interdites, auto-transitions, sauts non métier, statuts terminaux, séparation retour/remboursement, restrictions `ADMIN`/`SUPER_ADMIN`/`ORDER_MANAGER`/`LIVREUR`/`STOCK_MANAGER`/`CUSTOMER` |
| `src/modules/orders/order-workflow.service.test.ts` | 8 cas : transition autorisée + historique + audit, 409 interdit sans écriture, 404 commande absente, 403 rôle, livreur autorisé sur livraison, 409 concurrence, restitution de stock `CANCELLATION`, absence d'effet stock hors annulation |
| `test/order-status.e2e-spec.ts` | 9 cas : 401, 403 `CUSTOMER`, 400 statut inconnu / `id` non UUID, 404, 409 transition interdite (sans historique), 200 + historique + audit, restrictions livreur, remboursement réservé admin, restitution de stock, concurrence (1×200 + 1×409, 1 seule entrée) |

### Régressions rejouées

`orders-create` (13), `orders-captcha` (4), `rbac`, `stock-adjustments` : **72 tests
verts** dans le lot ciblé, puis **suite e2e complète 21 fichiers / 251 tests verte**.

---

## 4. Démarrage

| Vérification | Résultat |
| --- | --- |
| `node dist/main.js` (port 3999, services Docker réels) | ✅ processus stable |
| `GET /api/v1/health/live` | ✅ `200` |
| `GET /api/v1/health/ready` | ✅ `200` (PostgreSQL + Redis joignables) |
| `PATCH /api/v1/admin/orders/<uuid>/status` sans jeton | ✅ `401` (route enregistrée, RBAC global actif) |
| Frontend | Non concerné : ticket strictement backend, aucun écran modifié |

---

## 5. CI/CD

Workflows réels inspectés : `.github/workflows/ci.yml` (`quality`, `build`, `e2e`,
`security`, `openapi-check`, `api-client`, `ci-success`) et
`.github/workflows/docker-scan.yml` (`build-and-scan`).

| Job | Résultat local | Détail |
| --- | --- | --- |
| `quality` (lint + typecheck + unit) | PASS | Lint backend/frontend ✅, typecheck ✅, 297 tests unitaires ✅ |
| `build` | PASS (partiel) | `pnpm -C backend build` ✅ ; builds frontend non relancés (aucun code frontend modifié, typecheck ✅) |
| `e2e` | PASS | 251 tests e2e backend ✅ sur PostgreSQL + Redis réels |
| `security` (gitleaks + audit) | PARTIEL | `pnpm audit --prod --audit-level=high` exécuté plus tard dans la session ; gitleaks non installé localement (binaire absent) |
| `openapi-check` | À vérifier après commit | Le script fait `git diff --exit-code` : il ne peut passer que sur arbre propre |
| `api-client` | À vérifier après commit | Idem (`pnpm api:check` commence par `git diff --exit-code`) |
| `ci-success` | NOT RUN | Agrégateur distant |
| `docker-scan` | NOT RUN | Non déclenché par cette branche localement |

Les jobs `openapi-check` / `api-client` et les workflows distants sont vérifiés
après le commit et le push (voir la section « Suivi » ajoutée ci-dessous).

---

## 6. Limites connues

- Aucune notification n'est émise lors d'un changement de statut (hors périmètre
  du ticket ; templates `order.shipped` / `order.delivered` disponibles).
- Le retour physique ne restitue pas le stock : seule l'annulation le fait.
  Un remboursement après annulation se traite sur `Payment.paymentStatus`.
- `EXCHANGED` reste sans transition (aucune règle métier fournie).
- Pas de test de charge ; seule la concurrence fonctionnelle (2 requêtes) est testée.
