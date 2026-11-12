# Audit TEC-08 — Initialisation applications Angular

## 1. Critères d'acceptation

| # | CA | Statut | Preuve | Notes |
|---|---|---|---|---|
| 1 | Composants standalone, OnPush, Signals, nouvelle syntaxe @if/@for/@defer | ✅ | frontend/apps/*/src | Usage dans les pages |
| 2 | Boutique SSR + hydratation ; admin SPA | ✅ | frontend/angular.json (server, ssr entry, outputMode server) | Configuré |
| 3 | Lazy loading de toutes les fonctionnalités | ✅ | app.routes.ts | Routes lazy |
| 4 | Structure core/layout/features respectée | ⚠️ | storefront: core, features ; admin: features | Pas de dossier layout dédié visible |
| 5 | Build production réussi pour les deux apps | ✅ | nx build storefront/admin (vérifié TEC-12) | OK |

## 2. Conformité CDC
- Fondations Angular conformes globalement.

## 3. Qualité du code
- Standalone et lazy loading présents.
- Structure légèrement incomplète (layout).

## 4. Tests
- Frontend Vitest pour les libs ; apps sans tests dédiés notables.

## 5. Sécurité
- N/A.

## 6. Documentation
- README frontend présent.

## 7. Points d'attention
- Vérifier la présence d'un dossier `layout/` si le CA l'exige strictement.
- Certains tests UI préexistants échouent (input, price-tag, product-card, skeleton, size-selector) — hors scope TEC-08 mais à traiter.

## 8. Statut global
- ⚠️ Conforme avec réserves
