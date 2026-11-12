# Audit STK-01 — Décrément stock atomique

## 1. Critères d'acceptation

| # | CA | Statut | Preuve | Notes |
|---|---|---|---|---|
| 1 | Décrément dans même transaction que création commande | ✅ | orders.service.test.ts / orders.e2e | Présent |
| 2 | Mise à jour conditionnelle stock >= quantité | ✅ | inventory/orders service | Présent |
| 3 | Stock jamais négatif | ✅ | tests | Présent |
| 4 | Test concurrence deux requêtes sur dernière paire | ✅ | stock-concurrency.e2e-spec.ts | Présent |
| 5 | Chaque décrément crée un mouvement de stock traçable | ✅ | StockMovement | Présent |

## 2. Conformité CDC
- Protection contre la survente conforme.

## 3. Qualité du code
- Service d'inventaire dédié.

## 4. Tests
- Unitaires : orders.service.test.ts (9)
- E2E : stock-concurrency.e2e-spec.ts, orders.e2e-spec.ts

## 5. Sécurité
- Transaction atomique.

## 6. Documentation
- Swagger.

## 7. Points d'attention
- Vérifier l'exécution réelle du test de concurrence en e2e (Docker).

## 8. Statut global
- ✅ Conforme
