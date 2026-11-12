# Audit TEC-12 — Noyau Angular

## 1. Critères d'acceptation

| # | CA | Statut | Preuve | Notes |
|---|---|---|---|---|
| 1 | Intercepteur auth : token en mémoire, refresh unique, replay | ✅ | libs/core/src/lib/auth/refresh-queue.service.ts + tests | CA #1 validé |
| 2 | Intercepteurs erreurs (toasts FR), chargement, X-Request-Id | ✅ | libs/core/src/lib/http/*.ts | Présents et ordonnés |
| 3 | Gardes fonctionnels authGuard, roleGuard, guestGuard | ✅ | libs/core/src/lib/guards/*.ts + guards.spec.ts | 8 tests |
| 4 | Restauration silencieuse au démarrage | ✅ | session-restore.service.ts | Browser only |
| 5 | Aucun token dans localStorage/sessionStorage | ✅ | session.service.ts | Signal mémoire uniquement |

## 2. Conformité CDC
- Conforme. Voir docs/frontend/TEC-12-VERIFICATION.md.

## 3. Qualité du code
- Lib core taguée type:core, lint OK.

## 4. Tests
- 10 fichiers, 44 tests passants (Vitest).

## 5. Sécurité
- Token jamais persistant ; refresh cookie HttpOnly (backend).

## 6. Documentation
- TEC-12-VERIFICATION.md présent.

## 7. Points d'attention
- TEC-12 était sur branche feature ; intégré dans la branche de revue pour audit.
- Routes storefront /connexion, /compte, /403 non encore câblées (guards exportés).

## 8. Statut global
- ✅ Conforme
