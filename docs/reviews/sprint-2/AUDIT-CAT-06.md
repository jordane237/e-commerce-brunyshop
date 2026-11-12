# Audit CAT-06 — Guides des tailles

## 1. Critères d'acceptation

| # | CA | Statut | Preuve | Notes |
|---|---|---|---|---|
| 1 | Table conversion EU/US/UK/cm H/F/enfant | ⚠️ | seed / size-guides service | Données à vérifier avec propriétaire |
| 2 | GET /size-guides/:categoryId | ✅ | size-guides.controller.ts | Présent |
| 3 | Contenu modifiable par administration | ✅ | admin-size-guides.controller.ts (PUT) | Présent |
| 4 | Données initiales fournies et vérifiées | ⚠️ | seed | TODO validation propriétaire |

## 2. Conformité CDC
- API présente ; données initiales à valider.

## 3. Qualité du code
- Service testé (13 tests).

## 4. Tests
- Unitaires : size-guides.service.test.ts (13)
- E2E : size-guides.e2e-spec.ts

## 5. Sécurité
- Route publique lecture, admin écriture protégée.

## 6. Documentation
- Seed.

## 7. Points d'attention
- Valider les données de conversion avec le propriétaire.

## 8. Statut global
- ⚠️ Conforme avec réserves
