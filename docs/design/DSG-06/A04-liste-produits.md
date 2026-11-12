# A04 — Liste des produits

## 1. Objectif et contexte

Offrir une vue d’ensemble du catalogue administrable : rechercher, filtrer, trier, sélectionner plusieurs produits et lancer des actions de masse sans quitter la page. C’est l’écran le plus utilisé par l’équipe stock.

- Route cible : `/admin/produits`
- Accès : `SUPER_ADMIN`, `ADMIN`, `STOCK_MANAGER`.
- Différence majeure avec l’existant : la page actuelle appelle l’API **publique** et ne voit que les produits publiés, sans filtre ni action.
- Chaque ligne desktop possède une carte équivalente en mobile (CA #2).

## 2. Rôles autorisés

| Rôle | Voir | Créer | Modifier | Publier / archiver | Supprimer | Actions de masse |
| --- | --- | --- | --- | --- | --- | --- |
| `SUPER_ADMIN` | Oui | Oui | Oui | Oui | Oui | Oui |
| `ADMIN` | Oui | Oui | Oui | Oui | Oui | Oui |
| `STOCK_MANAGER` | Oui | Oui | Oui | Oui | Oui | Oui |
| `ORDER_MANAGER` | Lecture | Non | Non | Non | Non | Non |
| `LIVREUR` | Non | Non | Non | Non | Non | Non |

Les boutons non autorisés sont absents. La lecture seule retire la colonne de sélection et la barre d’actions.

## 3. Wireframes

### 360 px

```text
┌──────────────────────────────┐
│ ☰ BRUNY        🔔   [AB]    │
│ Produits                     │
│ 128 produits · 6 brouillons  │
│ [ + Nouveau produit       ]  │
│ ┌──────────────────────────┐ │
│ │ 🔍 Rechercher un produit │ │
│ └──────────────────────────┘ │
│ [Filtres 2]      [Trier ▾]   │
│                              │
│ ┌──────────────────────────┐ │
│ │ [img] Mocassin Glacé     │ │
│ │       Cuir · 42 500 FCFA │ │
│ │       Stock 12  ● Publié │ │
│ │                    [⋯]   │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ [img] Sandale Nomade     │ │
│ │       Toile · 18 000     │ │
│ │       Stock 3   ● Brouillon│
│ │                    [⋯]   │ │
│ └──────────────────────────┘ │
│        Charger plus          │
└──────────────────────────────┘
```

### 768 px

```text
┌────────────────────────────────────────────────────┐
│ Produits                         [ + Nouveau ]     │
│ [Rechercher…] [Statut ▾] [Catégorie ▾] [Filtres]  │
├────────────────────────────────────────────────────┤
│ ☐ Produit            Prix      Stock   Statut      │
│ ☐ Mocassin Glacé     42 500    12      Publié      │
│ ☐ Sandale Nomade     18 000     3      Brouillon   │
│ ☐ Bottine Akwa       55 000     0      Archivé     │
├────────────────────────────────────────────────────┤
│ 1–20 sur 128               ‹ 1 2 3 … 7 ›          │
└────────────────────────────────────────────────────┘
```

### 1280 px

```text
┌──────────┬──────────────────────────────────────────────────────────────┐
│ SIDEBAR  │ Produits                    [Exporter] [ + Nouveau produit ] │
│          │ [Rechercher…] [Statut] [Catégorie] [Marque] [Stock] [Reset]  │
│          ├──────────────────────────────────────────────────────────────┤
│          │ ☐  Produit              Prix      Stock  Statut   Modifié    │
│          │ ☐  [img] Mocassin      42 500    12     Publié   hier       ⋯
│          │ ☐  [img] Sandale       18 000     3     Brouillon 11/11     ⋯
│          │ ☐  [img] Bottine       55 000     0     Archivé   09/11     ⋯
│          ├──────────────────────────────────────────────────────────────┤
│          │ 3 sélectionnés · [Publier] [Archiver] [Supprimer]             │
│          │ 1–20 sur 128                              ‹ 1 2 3 … 7 ›      │
└──────────┴──────────────────────────────────────────────────────────────┘
```

## 4. Composants

| Composant | Usage |
| --- | --- |
| `DataTable` | Desktop : tri, sélection, actions de ligne |
| `CardList` | Mobile : une carte par produit |
| `SearchField` | Recherche debounced 300 ms |
| `FilterBar` | Filtres desktop |
| `FilterDrawer` | Filtres mobile |
| `Select` | Statut, catégorie, marque, stock |
| `Checkbox` | Sélection de lignes |
| `BulkActionsBar` | Actions groupées |
| `ActionMenu` | Modifier, dupliquer, publier, archiver, supprimer |
| `StatusBadge` | `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| `ConfirmDialog` | Suppression et archivage |
| `EmptyState` | Aucun produit, aucun résultat |
| `Skeleton` | Chargement de table |
| `Button` | Créer, charger plus, réessayer |

## 5. Les quatre états

| État | Rendu |
| --- | --- |
| Vide | Catalogue vide : illustration, « Votre catalogue est vide. », CTA « Créer un produit ». Recherche sans résultat : « Aucun produit ne correspond à vos filtres. » + « Réinitialiser » |
| Chargement | Squelettes de lignes ; filtres actifs visibles ; pagination désactivée |
| Erreur | `Alert` « Impossible de charger les produits. » + « Réessayer » ; conservation des filtres |
| Succès | Table ou cartes, compteur total, sélection persistante entre pages de la session |

Cas complémentaires :

- **Suppression** : dialogue « Supprimer ce produit ? Il ne sera plus visible. L’historique des commandes est conservé. »
- **Archivage groupé** : confirmation avec le nombre exact.
- **Échec partiel d’une action groupée** : bandeau récapitulatif « 2 produits sur 3 mis à jour » et détail des échecs.

## 6. Microtextes FR

| Emplacement | Texte |
| --- | --- |
| Titre | Produits |
| Compteur | {n} produits · {n} brouillons |
| Bouton créer | Nouveau produit |
| Recherche | Rechercher un produit |
| Filtre statut | Statut |
| Filtre catégorie | Catégorie |
| Filtre marque | Marque |
| Filtre stock | Stock |
| Option stock | En stock, Stock faible, Rupture |
| Bouton filtres | Filtres |
| Bouton réinitialiser | Réinitialiser |
| Tri | Trier par |
| Tri options | Plus récents, Nom A–Z, Prix croissant, Stock croissant |
| Colonne produit | Produit |
| Colonne prix | Prix |
| Colonne stock | Stock |
| Colonne statut | Statut |
| Colonne modifié | Modifié |
| Actions | Actions du produit |
| Menu | Modifier, Dupliquer, Publier, Archiver, Supprimer |
| Sélection | {n} sélectionné(s) |
| Bulk publier | Publier |
| Bulk archiver | Archiver |
| Bulk supprimer | Supprimer |
| Charger plus | Charger plus |
| Vide | Votre catalogue est vide. |
| Aucun résultat | Aucun produit ne correspond à vos filtres. |
| Erreur | Impossible de charger les produits. |
| Réessayer | Réessayer |

## 7. Interactions

1. La recherche est lancée après 300 ms ; `Entrée` force la requête.
2. Les filtres sont cumulatifs et reflétés dans l’URL (`?statut=DRAFT&categorie=…`) pour être partageables.
3. Le tri par défaut est « Plus récents » (`updatedAt` décroissant).
4. La sélection est limitée à la page courante ; « Tout sélectionner » ne sélectionne que les lignes visibles. Un lien propose « Sélectionner les 128 résultats » si l’API l’autorise.
5. Chaque action de masse ouvre une confirmation, sauf « Publier » si tous les produits ont du stock.
6. Après suppression, la ligne disparaît avec un toast « Produit supprimé. » et un lien « Annuler » de 5 secondes.
7. Sur mobile, « Charger plus » ajoute 20 cartes ; le scroll infini n’est pas utilisé.
8. Le clic sur une carte ouvre A05 ; le menu `⋯` ne déclenche pas l’ouverture.
9. L’état des filtres est conservé au retour depuis A05.

## 8. Accessibilité WCAG 2.1 AA

- Tableau natif avec `caption` (masquée visuellement), `th scope="col"`, `aria-sort` sur les colonnes triables.
- Case d’en-tête avec état indéterminé ; libellé « Sélectionner les produits de cette page ».
- Barre d’actions groupées annoncée en `role="status"` quand la sélection change.
- Menu d’actions : `aria-haspopup="menu"`, navigation flèches, Échap.
- Le dessin des cartes mobiles ne doit pas casser l’ordre de lecture : nom, prix, stock, statut, actions.
- Filtres actifs affichés en puces avec bouton de retrait accessible.
- Cibles ≥ 44 px ; focus visible ; contrastes AA.
- Le nombre de résultats est annoncé après filtrage via `aria-live="polite"`.

## 9. Données API

**Endpoint cible absent :** `GET /api/v1/admin/products`.

Paramètres : `page`, `limit` (20/50), `search`, `status`, `categoryId`, `brandId`, `stock` (`in`, `low`, `out`), `sort` (`updatedAt`, `name`, `price`, `stock`), `order`.

Réponse :

```json
{
  "items": [
    {
      "id": "…",
      "name": "Mocassin Glacé",
      "slug": "mocassin-glace",
      "status": "PUBLISHED",
      "basePrice": 42500,
      "image": "https://…/thumb.webp",
      "category": { "id": "…", "name": "Mocassins" },
      "brand": { "id": "…", "name": "Bruny" },
      "totalStock": 12,
      "updatedAt": "2026-11-10T09:12:00Z"
    }
  ],
  "total": 128,
  "page": 1,
  "limit": 20
}
```

Endpoints existants pour les actions : `DELETE /api/v1/admin/products/:id`, `POST /api/v1/admin/products/:id/duplicate`. Publication et archivage passent par `PATCH /api/v1/admin/products/:id` avec `status`.

**Manquants :** `GET /admin/products`, `GET /admin/brands`, actions de masse, compteur de brouillons.

## 10. Écarts et dépendances

- La page actuelle utilise `GET /products` (public) : elle ne doit pas servir de base à A04.
- Aucun endpoint de liste admin ni de marques.
- Les actions de masse peuvent être séquentielles côté client (N requêtes) en V1 ; un endpoint bulk est préférable.
- La suppression est logique (`deletedAt`) : le produit reste dans l’historique.
- Le stock affiché est la somme des variantes ; `reservedStock` n’est pas compté comme disponible.
- L’export annoncé dans le wireframe desktop est retiré de la V1 : aucun endpoint d’export.

## 11. Référence

- Zone L, cartes et badges.
- `frontend/apps/admin/src/app/features/products/products-page.ts`.
- `backend/src/modules/catalog/admin/admin-products.controller.ts`.
- CA #2 : toute ligne de tableau devient une carte mobile.
