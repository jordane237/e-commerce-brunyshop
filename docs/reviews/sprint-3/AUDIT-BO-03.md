# Audit BO-03 — Liste des produits (recherche, filtres, actions groupées)

> Revue finale du Sprint 3 — audit en lecture seule.
> Branche auditée : `feature/MKT-06-whatsapp-floating-button` (`2a73701`), tête de la pile Sprint 3.
> Date : 19 novembre 2026. Sources : ticket CSV officiel, cahier des charges, code, tests, documentation du ticket.

## 1. Critères d'acceptation

| # | Critère d'acceptation | Statut | Preuve |
|---|---|---|---|
| 1 | Tableau desktop, cartes mobile | ✅ | `products-list.component` + `bruny-data-table` / `bruny-card-list` |
| 2 | Recherche, filtres catégorie/statut/stock, tri, pagination | ✅ | `admin-products.store.ts:90-150` ; requête `GET /admin/products` avec tous les paramètres |
| 3 | Actions groupées : publier, masquer, archiver | ✅ | `bulkPublish`, `bulkHide`, `bulkArchive` ; confirmation pour archiver (`products-list.component.ts:116-134`) |
| 4 | Badges de statut Brouillon / Publié / Archivé | ✅ | `bruny-status-badge` dans la liste |

## 2. Conformité au cahier des charges

Le CDC §7.2 (gestion des produits) est couvert fonctionnellement. Deux réserves : les actions groupées sont N appels individuels, et les catégories proposées proviennent de l'API publique (uniquement celles qui ont des produits publiés).

## 3. Qualité du code

- Store dédié, signaux, gestion partielle des échecs via `Promise.allSettled`.
- `runBulk` reçoit un statut inutilisé (`_status`) : signature à nettoyer.
- Aucun `any` justifié ; cast `as never` dans le parcours des catégories.
- Aucun TODO/FIXME.

## 4. Tests

- **Aucun test unitaire frontend** pour `features/products` : `find` ne retourne aucune spec.
- **Aucun e2e admin** pour la liste des produits.
- La couverture repose sur les e2e backend `admin-products-list.e2e-spec.ts`.
- Suite frontend 515/515 ne couvre donc pas BO-03.

## 5. Sécurité

- RBAC serveur sur les endpoints admin (e2e 401/403/200).
- Aucune donnée sensible dans le store.
- Les erreurs affichent un message générique.

## 6. Documentation

- `ANALYSE-DESIGN.md` et `VERIFICATION.md` présents, mais la section « Tests » du VERIFICATION ne cite aucun test frontend BO-03.

## 7. Points d'attention

- Absence de tests UI : c'est la principale faiblesse du ticket.
- Les actions groupées ne sont pas atomiques ; un échec partiel laisse un état mixte, signalé par un toast.
- Filtre catégorie limité aux catégories publiées.
- `ARCHIVED` est traité par `DELETE`, ce qui est cohérent avec le contrat mais doit être vérifié en e2e.

## 8. Statut global

**⚠️ Conforme avec réserves**

Recommandation : **corrections requises** (tests UI manquants) avant de considérer BO-03 clos. Le code peut être mergé, mais la DoD « tests » n'est pas démontrée.
