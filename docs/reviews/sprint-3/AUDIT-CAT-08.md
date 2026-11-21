# Audit CAT-08 — Page catalogue avec filtres synchronisés dans l'URL

> Revue finale du Sprint 3 — audit en lecture seule.
> Branche auditée : `feature/MKT-06-whatsapp-floating-button` (`2a73701`), tête de la pile Sprint 3.
> Date : 19 novembre 2026. Sources : ticket CSV officiel, cahier des charges, code, tests, documentation du ticket.

## 1. Critères d'acceptation

| # | Critère d'acceptation | Statut | Preuve |
|---|---|---|---|
| 1 | Grille responsive 2 colonnes mobile, 3 à 4 desktop | ✅ | `product-grid.component.scss` et e2e desktop/mobile ; 12 cartes par page |
| 2 | Filtres et tri synchronisés avec l'URL, retour arrière fonctionnel | ✅ | `catalog-page.ts:96-118` (URL source de vérité), `catalog-query.ts` ; 19 tests de mapping + e2e retour arrière |
| 3 | Tiroir mobile avec bouton « Voir N résultats » | ✅ | `filter-drawer.component.html:39` ; e2e 390 px |
| 4 | Puces de filtres actifs supprimables et réinitialisation | ✅ | `active-filters-chips` ; 3 tests + e2e |
| 5 | État « Aucun résultat » avec suggestions et squelettes | ✅ | `empty-state` ; 2 tests + e2e `?size=99` ; squelettes dans la grille |
| 6 | Rendu serveur de la première page | ✅ | e2e `catalog.spec.ts:145` « la première page filtrée est rendue côté serveur » |

## 2. Conformité au cahier des charges

Le CDC §6.2 (catalogue et filtres) est intégralement couvert. Les écarts assumés (route `/boutique`, quatre tris, 12 produits/page) sont documentés et cohérents avec le backend CAT-02.

## 3. Qualité du code

- Store à signaux sans dépendance au Router ; l'URL reste l'unique source de vérité.
- Protection contre les réponses obsolètes (`requestId`) et gestion du mode `append`.
- Aucun `any` non justifié, aucun TODO.
- Composants standalone `OnPush`.

## 4. Tests

- **59 tests unitaires** (11 fichiers) confirmés par `VERIFICATION.md`.
- **13 tests e2e** dans `frontend/e2e/catalog.spec.ts`.
- SSR couvert par un test e2e.
- Suite frontend 515/515.

## 5. Sécurité

- Aucun secret.
- Paramètres d'URL typés et bornés (`catalog-query.ts`) ; pas d'injection dans les requêtes.
- Les appels passent par `CatalogApi` et les intercepteurs.

## 6. Documentation

- `ANALYSE-DESIGN.md` et `VERIFICATION.md` complets.
- Limites honnêtement listées (Lighthouse non exécuté, pas d'axe).
- Pas d'impact OpenAPI.

## 7. Points d'attention

- Lighthouse `/boutique` non exécuté.
- Les filtres `promo` et `inStock=false` ne sont pas démontrables avec le seed actuel.
- Aucun e2e d'erreur réseau (couvert unitairement).

## 8. Statut global

**✅ Conforme**

Recommandation : **merge OK**. Aucune correction bloquante.
