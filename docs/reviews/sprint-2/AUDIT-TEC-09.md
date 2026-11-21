# Audit TEC-09 — Client API Angular depuis OpenAPI

## 1. Critères d'acceptation

| # | CA | Statut | Preuve | Notes |
|---|---|---|---|---|
| 1 | `pnpm api:generate` produit le client dans libs/data-access | ✅ | frontend/libs/data-access/src/generated/api-types.ts | Présent |
| 2 | Types générés utilisés par stores/services | ⚠️ | grep dans projects/libs | À confirmer plus finement |
| 3 | CI échoue si client non à jour | ✅ | pnpm api:check / workflow | Script présent |
| 4 | Documentation procédure | ✅ | docs/frontend/API-CLIENT.md | Présent |

## 2. Conformité CDC
- Chaîne OpenAPI documentée.

## 3. Qualité du code
- Types générés versionnés.

## 4. Tests
- N/A direct.

## 5. Sécurité
- N/A.

## 6. Documentation
- API-CLIENT.md complet.

## 7. Points d'attention
- Vérifier l'usage effectif des types générés dans les services Angular (matrice Étape 3).

## 8. Statut global
- ✅ Conforme
