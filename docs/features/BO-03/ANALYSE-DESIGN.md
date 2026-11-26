# BO-03 — Analyse design : liste des produits admin

## Sources
- Specs validées : `docs/design/DSG-06/A04-liste-produits.md`, `RESPONSIVE-PATTERNS.md`, `MICROTEXTES.md`, `COMPOSANTS-REQUIS.md`.
- Gel microtextes : `docs/design/DSG-07/GLOSSAIRE-MICROTEXTES.md`.
- Planche unique : `design1/bruny shopping/bruny shopping.png`.
- Aucun dossier `/design` ni `/design-1` à la racine ; les sources d'images sont limitées à la planche ci-dessus.

## Composants créés dans `libs/ui/`
- `bruny-data-table` (sélection, tri, squelettes, slot vide)
- `bruny-card-list`
- `bruny-status-badge` (Brouillon / Publié / Archivé)
- `bruny-action-menu`
- `bruny-confirm-dialog`
- `bruny-bulk-actions-bar`
- `bruny-empty-state`
- icônes ajoutées : `more-vertical`, `archive`, `copy`, `chevrons-up-down`

`bruny-table` existant est conservé (page design-system du storefront) ; `data-table` apporte sélection + colonnes templatées + pagination externe.

## Écarts documentés
- URL `/produits` (convention repo) au lieu de `/admin/products`.
- Filtre marque reporté (aucun endpoint `brands`).
- Actions groupées = Publier / Masquer / Archiver (pas de suppression groupée ; `DELETE` archive).
- Microtextes DSG-07 prioritaires : « Voir plus », « Réinitialiser les filtres », « Nouveau produit ».
- `ORDER_MANAGER` en lecture seule non implémenté (guard = 3 rôles).
- Bulk côté frontend (`Promise.allSettled`), pas d'endpoint bulk.
