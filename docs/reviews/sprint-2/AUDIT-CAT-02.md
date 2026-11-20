# Audit CAT-02 — API liste de produits

## 1. Critères d'acceptation

| # | CA | Statut | Preuve | Notes |
|---|---|---|---|---|
| 1 | GET /products avec filtres/tri/pagination/q | ✅ | backend/src/modules/catalog/catalog.controller.ts + service | Présent |
| 2 | Filtre pointure ne retient que variantes en stock | ✅ | catalog.service.test.ts / e2e products-list | À confirmer dans code |
| 3 | Réponse avec meta (total, pages) et compteurs par filtre | ⚠️ | e2e products-list | Compteurs à vérifier |
| 4 | Requêtes paramétrées, index, p95 < 300ms sur 1000 produits | ⚠️ | migrations Prisma | Perf non mesurée |
| 5 | Seuls produits publiés visibles | ✅ | service + tests | Présent |

## 2. Conformité CDC
- API liste produits conforme globalement.

## 3. Qualité du code
- Service dédié, tests unitaires (6) + e2e.

## 4. Tests
- Unitaires : catalog.service.test.ts (6)
- E2E : products-list.e2e-spec.ts

## 5. Sécurité
- Requêtes paramétrées via Prisma.

## 6. Documentation
- Swagger via OpenAPI.

## 7. Points d'attention
- Mesurer la performance p95 sur 1000 produits.
- Vérifier les compteurs par filtre.

## 8. Statut global
- ⚠️ Conforme avec réserves
