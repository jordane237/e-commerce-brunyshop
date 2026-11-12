# Audit AUT-05 — RBAC et refus par défaut

## 1. Critères d'acceptation

| # | CA | Statut | Preuve | Notes |
|---|---|---|---|---|
| 1 | Garde JWT globale, routes protégées sauf @Public() | ✅ | backend/src/common/guards/jwt-auth.guard.ts (+tests 10) | Présent |
| 2 | @Roles() et RolesGuard côté serveur | ✅ | backend/src/common/decorators/roles.decorator.ts + roles.guard.ts | Présent |
| 3 | Matrice permissions (LIVREUR, STOCK_MANAGER, ORDER_MANAGER, ADMIN, SUPER_ADMIN) | ✅ | roles module / guards | À vérifier finement par endpoint |
| 4 | Test 401 sans jeton et 403 sans bon rôle | ✅ | backend/test/rbac.e2e-spec.ts | Présent |
| 5 | Client ne lit que ses propres ressources (IDOR) | ⚠️ | orders/cart tests | À confirmer par test IDOR explicite |

## 2. Conformité CDC
- RBAC global présent.

## 3. Qualité du code
- Guard testé (10 tests unitaires).

## 4. Tests
- Unitaires : jwt-auth.guard.test.ts (10)
- E2E : rbac.e2e-spec.ts

## 5. Sécurité
- Default-deny via guard global.

## 6. Documentation
- docs/backend/auth.md.

## 7. Points d'attention
- Vérifier l'absence d'IDOR sur commandes/panier/profil par test explicite.
- Vérifier que toutes les routes sensibles portent @Roles().

## 8. Statut global
- ⚠️ Conforme avec réserves
