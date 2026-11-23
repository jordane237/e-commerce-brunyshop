# STK-05 — Analyse design (écran admin de gestion du stock)

## Contexte et existant vérifié

| Élément | État constaté |
|---|---|
| `frontend/apps/admin/src/app/features/stock/` | `stock.routes.ts` + `stock-alerts.component.ts` (placeholder STK-03) |
| Routes admin | `/stock` lazy-loaded via `STOCK_ROUTES`, `roleGuard(navRoles('stock'))` |
| Sidebar BO-01 | item `stock` → `/stock`, rôles `SUPER_ADMIN`, `ADMIN`, `STOCK_MANAGER` |
| Client API généré TEC-09 | **absent** pour STK-02 (`adminStockControllerAdjustStock` non généré dans `api-types.ts`) |
| Wrapper manuel `AdminStockApi` | existait pour les alertes STK-03 (`/admin/stock/alerts`) |
| `AdminProductsStore` (BO-03) | patterns signals réutilisables (filtres, pagination, toast, erreurs) |
| Composants UI | `DataTable`, `CardList`, `StatusBadge`, `ActionMenu` (`items`), `Modal` (`open`/`openChange`), `Skeleton`, `EmptyState` |
| Boutons/inputs UI | `ButtonComponent`, `InputComponent`, `SelectComponent` existent mais non utilisés par l’écran (inputs natifs stylés localement, cohérent avec `stock-alerts`) |
| Endpoint de liste des variantes | **inexistant** : STK-02 ne fournit que l’ajustement et les mouvements |

## Décision endpoint (CA #1)

`GET /api/v1/admin/stock/variants` a été ajouté (delta backend STK-05) :

- filtres `categoryId`, `stockStatus` (`all|out|low|in_stock`), `search` (SKU / nom produit, insensible à la casse) ;
- pagination `page` / `limit` (max 100) ;
- tri `product.name asc`, `size asc` ;
- `availableStock = stock - reservedStock` et `stockStatus` calculés serveur (OUT si stock 0, LOW si stock ≤ seuil et > 0, sinon IN_STOCK) ;
- `@Roles('STOCK_MANAGER', 'ADMIN', 'SUPER_ADMIN')`.

Justification : CAT-04 ne retourne pas les variantes avec `reservedStock`/seuil de façon filtrable ; dupliquer la logique client aurait produit un filtrage en mémoire non paginé.

## Structure A06 retenue

### Desktop (≥ 768 px)
`DataTable` : SKU, Produit, Pointure, Couleur, Stock dispo., Réservé, Seuil, Statut, actions kebab (`Ajuster le stock`, `Voir l’historique`).

### Mobile (< 768 px)
`CardList` : produit + pointure/couleur, SKU, stock disponible et réservé, `StatusBadge`, menu d’actions condensé. Bascule via `matchMedia('(max-width: 767px)')` protégée par `isPlatformBrowser` (admin = SPA).

### Barre d’outils
Recherche (debounce 300 ms), filtre catégorie, filtre statut de stock, bouton « Exporter en CSV ».

### Modale d’ajustement (CA #2)
`ModalComponent` : stock actuel, nouveau stock (min 0), motif obligatoire (`RECEPTION`, `INVENTAIRE`, `CASSE`, `RETOUR`, `AUTRE`), notes optionnelles, aperçu avant/après/delta, Annuler / Enregistrer.

### Modale historique (CA #3)
`ModalComponent` (lg) : date, utilisateur, motif, avant, après, delta, notes, alimentée par `GET /admin/stock-movements`.

## Microtextes (DSG-06 / DSG-07)

« Gestion du stock », « Rechercher un produit, un SKU... », « Catégorie », « Toutes les catégories », « Statut du stock », « Tous », « Rupture de stock », « Stock faible », « En stock », « Exporter en CSV », « Ajuster le stock », « Voir l’historique », « Stock actuel », « Nouveau stock », « Motif », « Réception », « Inventaire », « Casse », « Retour », « Autre », « Notes (optionnel) », « Annuler », « Enregistrer », « Le motif est requis. », « Le stock doit être supérieur ou égal à 0. », « Historique des mouvements », « Aucune variante trouvée ».

Statuts : OUT → `danger`, LOW → `warning`, IN_STOCK → `success`.

## Export CSV (CA #4)

Généré côté client depuis la page courante : BOM UTF-8 (`\uFEFF`) pour Excel FR, séparateur `;`, échappement des guillemets par doublement, nom `stock-YYYY-MM-DD.csv`. Colonnes : SKU, Produit, Catégorie, Couleur, Pointure, Stock, Réservé, Disponible, Seuil, Statut.

## Accessibilité

`aria-label` sur recherche et filtres, `role="alert"` sur messages de validation, `aria-invalid` implicite via erreurs de formulaire, focus visible natif, zones d’action ≥ 44 px, table avec `<th>`.

## Écarts assumés vs maquette

- Pas de `FilterDrawer` mobile : les deux filtres sont rendus en selects compacts sous la recherche (peu nombreux, coût d’interaction faible).
- Pagination numérique simple (Précédent / Suivant + compteur) plutôt que « Voir plus » : cohérent avec `AdminProductsStore`.
- `ButtonComponent`/`InputComponent` non utilisés : les composants existants n’exposent pas les variantes de style nécessaires (boutons inline de la barre d’outils) ; styles locaux alignés sur `stock-alerts.component.ts`.
