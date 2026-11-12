# STK-01 — Vérification de livraison

Décrément de stock atomique et protection contre la survente.

Branche : `feature/STK-01-atomic-stock-decrement`
Date de vérification : 2026-11-11

---

## 1. Les 12 checks

| # | Check | Résultat | Preuve |
|---|---|---|---|
| 1 | Branche active | ✅ | `git branch --show-current` → `feature/STK-01-atomic-stock-decrement` |
| 2 | Migration `StockMovement.userId` nullable | ✅ | migration `20261111120000_stk01_stock_movement_user_optional` appliquée par `prisma migrate deploy` |
| 3 | Build backend | ✅ | `pnpm -C backend build` → `tsc -p tsconfig.build.json` sans erreur |
| 4 | Tests unitaires | ✅ | `pnpm -C backend test` → **228 tests / 22 fichiers**, dont **15 tests STK-01** (inventory 6, orders 9) |
| 5 | Tests e2e | ✅ | `pnpm -C backend test:e2e` → **189 tests / 11 fichiers**, dont **18 tests STK-01** |
| 6 | ESLint | ✅ | `pnpm -C backend lint` → 0 erreur, 0 warning |
| 7 | PostgreSQL + Redis | ✅ | `docker compose ps` → `bruny-postgres` healthy, `bruny-redis` healthy |
| 8 | Prisma generate | ✅ | `pnpm -C backend prisma generate` → `Generated Prisma Client (7.10.0)` |
| 9 | Démarrage + health ready | ✅ | `PORT=4011 node dist/main.js`, puis `GET /api/v1/health/ready` → **200** `{status:"ok", database:"up", redis:"up"}` |
| 10 | Swagger / OpenAPI | ✅ | `pnpm -C backend openapi:export` → **28 paths**, `POST /api/v1/orders` présent |
| 11 | Concurrence dernière paire | ✅ | e2e : 2 requêtes simultanées → **201 + 409**, stock `0`, 1 commande, 1 mouvement |
| 12 | Pas de stock négatif + rollback | ✅ | e2e 10 acheteurs → 1 succès / 9 conflits ; décrément partiel annulé ; `stock < 0` → **0 ligne** |

---

## 2. Preuve du scénario central

Test : `stock-concurrency.e2e-spec.ts` — « deux commandes simultanées pour la
dernière paire ».

```text
stock initial : 1
requêtes      : 2 × POST /api/v1/orders, Promise.all
résultats     : 201 Created + 409 INSUFFICIENT_STOCK
stock final   : 0
Order         : 1
StockMovement : 1 (delta -1, before 1, after 0)
```

Le conflit expose :

```json
{
  "code": "INSUFFICIENT_STOCK",
  "errors": [
    {
      "field": "items",
      "variantId": "<variant>",
      "requestedQuantity": 1,
      "availableQuantity": 0
    }
  ]
}
```

Test complémentaire : 10 requêtes simultanées sur un stock de 1 → exactement
1 succès, 9 conflits, 1 commande, 1 mouvement, stock final 0.

Test de rollback : deux articles, le premier a du stock, le second est en
rupture après le pré-check. La transaction échoue et le premier décrément est
annulé : stock du premier article inchangé, aucun mouvement, aucune commande.

---

## 3. Détails des tests STK-01

### Unitaires

`backend/src/modules/inventory/inventory.service.test.ts` (6) :

- décrément + mouvement `PURCHASE` cohérent ;
- quantité nulle/négative refusée sans SQL ;
- `409 INSUFFICIENT_STOCK` avec quantités ;
- stock tombé à zéro → `INSUFFICIENT_STOCK` ;
- variante supprimée → `404` ;
- stock disponible jamais négatif.

`backend/src/modules/orders/orders.service.test.ts` (9) :

- guest incomplet ;
- paiement non COD ;
- mapping stock du pré-check ;
- idempotence ;
- conflit de propriété d’idempotence ;
- transaction complète commande/paiement/expédition/mouvement ;
- rollback sur échec stock ;
- zone absente ;
- prix client ignoré.

Filtre global : test supplémentaire de conservation des détails structurés
`errors` (`variantId`, quantités).

### E2E

`backend/test/orders.e2e-spec.ts` (11) :

- commande guest + mouvement `userId: null` ;
- commande connectée + mouvement nominatif ;
- prix client refusé ;
- stock insuffisant ;
- guest incomplet ;
- paiement non disponible ;
- idempotence séquentielle ;
- conflit d’idempotence ;
- produit archivé ;
- zone inconnue ;
- variante inexistante.

`backend/test/stock-concurrency.e2e-spec.ts` (7) :

- dernière paire, 2 acheteurs ;
- dernière paire, 10 acheteurs ;
- stock 2, 2 × 1 unité ;
- stock 2, 1 × 2 unités ;
- même clé d’idempotence en parallèle ;
- rollback multi-articles ;
- aucun stock négatif.

---

## 4. Fichiers livrés

```text
backend/prisma/schema.prisma
backend/prisma/migrations/20261111120000_stk01_stock_movement_user_optional/migration.sql
backend/src/modules/inventory/README.md
backend/src/modules/inventory/inventory.module.ts
backend/src/modules/inventory/inventory.service.ts
backend/src/modules/inventory/inventory.service.test.ts
backend/src/modules/inventory/inventory.errors.ts
backend/src/modules/orders/README.md
backend/src/modules/orders/orders.module.ts
backend/src/modules/orders/orders.controller.ts
backend/src/modules/orders/orders.service.ts
backend/src/modules/orders/orders.service.test.ts
backend/src/modules/orders/orders.errors.ts
backend/src/modules/orders/dto/address-snapshot.dto.ts
backend/src/modules/orders/dto/create-order.dto.ts
backend/src/modules/orders/dto/create-order-item.dto.ts
backend/src/modules/orders/dto/order-response.dto.ts
backend/src/common/filters/all-exceptions.filter.ts
backend/src/common/filters/all-exceptions.filter.test.ts
backend/eslint.config.mjs
backend/test/orders.e2e-spec.ts
backend/test/stock-concurrency.e2e-spec.ts
backend/openapi.json
docs/backend/stock.md
docs/backend/STK-01-VERIFICATION.md
```

Aucun secret, `.env` ou `dist/` n’est ajouté au suivi Git.

---

## 5. Limites assumées

- pas de réservation/expiration de `reservedStock` ;
- paiement et expédition créés en `PENDING`, sans webhook ;
- pas de libération de stock à l’annulation ;
- pas de hash du body pour l’idempotence ;
- livraison offerte dès deux paires non implémentée dans STK-01.

Voir [`stock.md`](./stock.md) pour le contrat complet et ces limites.
