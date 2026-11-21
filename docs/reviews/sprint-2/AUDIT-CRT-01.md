# Audit CRT-01 — Validation panier

## 1. Critères d'acceptation

| # | CA | Statut | Preuve | Notes |
|---|---|---|---|---|
| 1 | POST /cart/validate recalcule prix, promos, stock | ✅ | cart-validation.service.test.ts (15) + pricing (15) | Présent |
| 2 | Réponse liste les écarts (prix, stock, produit retiré) | ✅ | cart-validation.e2e-spec.ts | Présent |
| 3 | Aucun prix client utilisé | ✅ | forbidNonWhitelisted / tests | Présent |
| 4 | Quantité max par ligne limitée au stock | ✅ | service + tests | Présent |

## 2. Conformité CDC
- Validation panier conforme.

## 3. Qualité du code
- Services dédiés, DTO stricts.

## 4. Tests
- Unitaires : 30 (validation + pricing)
- E2E : cart-validation.e2e-spec.ts

## 5. Sécurité
- whitelist / forbidNonWhitelisted.

## 6. Documentation
- Swagger.

## 7. Points d'attention
- Vérifier le rejet de unitPrice côté DTO.

## 8. Statut global
- ✅ Conforme
