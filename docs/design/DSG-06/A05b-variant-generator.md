# A05b — Générateur de variantes couleurs × pointures

## 1. Objectif et contexte

Permettre de créer et maintenir en quelques gestes l’ensemble des déclinaisons d’un produit : couleurs et pointures génèrent une grille de variantes, chaque cellule porte un stock, un prix optionnel et un seuil d’alerte. C’est la fonctionnalité critique du CA #4.

- Route cible : `/admin/produits/:id/variantes` (ou panneau plein écran depuis A05).
- Accès : `SUPER_ADMIN`, `ADMIN`, `STOCK_MANAGER`.
- Contraintes backend : **30 couleurs**, **30 pointures**, **300 variantes** maximum.
- Les SKU sont générés par le serveur ; l’aperçu est indicatif.
- Aucun code applicatif n’est livré par DSG-06 : le comportement est spécifié et prototypé en HTML statique.

## 2. Rôles autorisés

| Rôle | Voir la grille | Générer | Modifier prix/stock | Supprimer | Actions groupées |
| --- | --- | --- | --- | --- | --- |
| `SUPER_ADMIN` | Oui | Oui | Oui | Oui | Oui |
| `ADMIN` | Oui | Oui | Oui | Oui | Oui |
| `STOCK_MANAGER` | Oui | Oui | Oui | Oui | Oui |
| `ORDER_MANAGER` | Lecture | Non | Non | Non | Non |
| `LIVREUR` | Non | Non | Non | Non | Non |

## 3. Wireframes

### 360 px — version simplifiée

```text
┌──────────────────────────────┐
│ ← Produit      Enregistrer   │
│ Variantes · 12               │
│                              │
│ 1. Couleurs                  │
│ [Noir ×] [Cognac ×] [+ Ajouter]│
│ 2. Pointures                 │
│ [39 ×] [40 ×] [41 ×] [42 ×]  │
│ [43 ×] [+ Ajouter]           │
│                              │
│ 2 couleurs × 5 pointures     │
│ = 10 variantes               │
│ [Générer la grille]          │
│                              │
│ Noir (5)             [⋯]     │
│ ┌──────────────────────────┐ │
│ │ 39 · 0 · 42 500 FCFA     │ │
│ │ 40 · 2 · 42 500 FCFA     │ │
│ │ 41 · 1 · 42 500 FCFA     │ │
│ └──────────────────────────┘ │
│ Cognac (5)           [⋯]     │
│ [Appliquer un prix ou stock] │
└──────────────────────────────┘
```

### 768 px — grille matricielle

```text
┌──────────────────────────────────────────────────────┐
│ Variantes · 12                    [Tout sélectionner] │
│ Couleurs : [Noir] [Cognac] [+ Ajouter]               │
│ Pointures : [39] [40] [41] [42] [43] [+ Ajouter]     │
│ 2 × 5 = 10 variantes  [Générer]                      │
├──────────────────────────────────────────────────────┤
│ Couleur  │ 39      │ 40      │ 41      │ 42      │ … │
│ Noir     │ 0       │ 2       │ 1       │ 4       │   │
│          │ 42 500  │ 42 500  │ 42 500  │ 42 500  │   │
│ Cognac   │ 1       │ 0       │ 3       │ 2       │   │
├──────────────────────────────────────────────────────┤
│ 3 sélectionnées · [Prix] [Stock] [Seuil] [Supprimer] │
└──────────────────────────────────────────────────────┘
```

### 1280 px — grille + détail

```text
┌──────────┬──────────────────────────────────────────────────────────────┐
│ SIDEBAR  │ ← Produits / Mocassin / Variantes   [Annuler] [Enregistrer] │
│          │ Couleurs  [Noir ×][Cognac ×][+ Ajouter]                      │
│          │ Pointures [39 ×][40 ×][41 ×][42 ×][43 ×][+ Ajouter]          │
│          │ 2 couleurs × 5 pointures = 10 variantes  [Générer la grille] │
│          ├──────────────────────────────────────────────────────────────┤
│          │ ☐ Couleur  Pointure  SKU                 Prix    Stock Seuil │
│          │ ☐ Noir     39        BARRAGEF-MOCASSIN-39-NOIR  0    5     │
│          │ ☐ Noir     40        …-40-NOIR          42 500  2    5     │
│          │ ☐ Cognac   41        …-41-COGNAC        42 500  3    5     │
│          ├──────────────────────────────────────────────────────────────┤
│          │ 3 sélectionnées · [Prix] [Stock] [Seuil] [Supprimer]         │
│          │ Total 12 variantes · 12 unités · 2 réservées                 │
│          │ À droite : panneau « Détail de la variante »                 │
└──────────┴──────────────────────────────────────────────────────────────┘
```

## 4. Composants

| Composant | Usage |
| --- | --- |
| `VariantGridGenerator` | Nouveau : couleurs, pointures, matrice, bulk |
| `ChipInput` | Ajout/suppression de couleurs et pointures |
| `DataTable` | Grille desktop, sélection, édition en ligne |
| `CardList` | Groupes de variantes mobile |
| `BulkActionsBar` | Prix, stock, seuil, suppression |
| `Input` | Valeurs numériques, SKU en lecture |
| `ActionMenu` | Actions par variante |
| `ConfirmDialog` | Suppression et régénération destructive |
| `Alert` | Limites, conflits, variantes liées |
| `Toast` | Succès |
| `Badge` | « SKU existant », « nouvelle », « à supprimer » |

## 5. Les quatre états

| État | Rendu |
| --- | --- |
| Vide | Aucune couleur ou pointure : « Ajoutez au moins une couleur et une pointure pour générer les variantes. » Grille masquée |
| Chargement | Squelette de grille en édition ; boutons désactivés ; compteurs en attente |
| Erreur | Limite dépassée, doublon, échec d’enregistrement, variante liée à une commande |
| Succès | Grille à jour, toast « Variantes enregistrées. », compteurs recalculés |

Cas complémentaires :

- **Plus de 300 variantes** : bouton désactivé et message « 2 × 160 = 320 variantes. La limite est de 300. Retirez des couleurs ou des pointures. »
- **Doublon couleur/pointure** : ajout refusé, message « Cette couleur existe déjà. »
- **Régénération** : si des variantes existent, confirmation explicite ; les variantes absentes de la nouvelle grille sont supprimées.
- **Variante liée à une commande** : suppression refusée (`409`), badge « Liée à une commande » et action de suppression masquée.
- **Stock réservé** : affiché en lecture, jamais éditable ; `reservedStock` est interdit dans le payload.

## 6. Microtextes FR

| Emplacement | Texte |
| --- | --- |
| Titre | Variantes |
| Étape couleurs | Couleurs |
| Étape pointures | Pointures |
| Ajout couleur | Ajouter une couleur |
| Ajout pointure | Ajouter une pointure |
| Aide couleur | Nom affiché sur la fiche produit, par exemple « Noir ». |
| Aide pointure | Pointure ou taille, par exemple « 42 » ou « M ». |
| Compteur | {c} couleur(s) × {p} pointure(s) = {n} variante(s) |
| Bouton générer | Générer la grille |
| Bouton régénérer | Régénérer la grille |
| Confirmation régénération | Régénérer la grille ? Les variantes absentes seront supprimées. |
| Colonne couleur | Couleur |
| Colonne pointure | Pointure |
| Colonne SKU | SKU |
| Colonne prix | Prix |
| Colonne stock | Stock |
| Colonne seuil | Seuil d’alerte |
| SKU provisoire | Aperçu — le SKU final est généré à l’enregistrement. |
| Sélection | {n} variante(s) sélectionnée(s) |
| Bulk prix | Appliquer un prix |
| Bulk stock | Appliquer un stock |
| Bulk seuil | Appliquer un seuil |
| Bulk supprimer | Supprimer |
| Dialogue suppression | Supprimer ces variantes ? Les stocks associés seront perdus. |
| Limite | La limite est de 300 variantes. |
| Doublon | Cette couleur existe déjà. |
| Variante liée | Cette variante est liée à une commande et ne peut pas être supprimée. |
| Succès | Variantes enregistrées. |
| Erreur | Impossible d’enregistrer les variantes. |

## 7. Interactions

### Génération

1. Les couleurs et pointures sont ajoutées par saisie + `Entrée` ou par puces prédéfinies (`36` à `46`, `S`, `M`, `L`, `XL`).
2. Chaque puce est supprimable ; une puce utilisée par une variante existante demande confirmation avant suppression.
3. Le compteur se met à jour à chaque ajout et bloque au-delà de 300.
4. « Générer la grille » crée le produit cartésien **sans écraser** les valeurs existantes des couples déjà présents.
5. Les nouvelles cellules ont stock `0`, prix vide (hérité du prix de base), seuil `5`.

### Édition

6. Desktop : édition en ligne du prix, du stock et du seuil ; `Entrée` valide, `Échap` annule.
7. Le SKU n’est jamais éditable en création ; en édition, il est en lecture seule.
8. Mobile : la grille matricielle est remplacée par des cartes groupées par couleur ; chaque ligne ouvre une feuille d’édition (stock, prix, seuil).
9. La sélection fonctionne par case, par ligne et « Tout sélectionner » sur la page.
10. Les actions groupées demandent une valeur unique et affichent « S’applique à {n} variantes ».
11. Prix vide signifie « utiliser le prix de base du produit » ; l’UI l’explique.

### Enregistrement

12. « Enregistrer » envoie l’ensemble des variantes via `PUT /:id/variants` (upsert différentiel).
13. Les variantes sans `id` sont créées ; les variantes existantes absentes du payload sont supprimées.
14. Un échec partiel n’est pas possible : l’opération est atomique côté backend. En cas d’erreur, aucune valeur locale n’est perdue.
15. En création de produit, le bouton enregistre d’abord le produit puis les variantes.

## 8. Accessibilité WCAG 2.1 AA

- Grille réelle `table` avec en-têtes `th scope="col"` et `th scope="row"` pour la couleur.
- Chaque cellule d’édition a un label accessible incluant couleur et pointure (« Stock Noir 42 »).
- Sélection : case avec libellé complet, état indéterminé sur l’en-tête.
- Les puces sont une liste avec boutons de suppression nommés (« Retirer la couleur Noir »).
- La limite et les erreurs sont annoncées en `role="alert"`.
- Navigation clavier complète : flèches entre cellules, `Entrée` édite, `Échap` annule.
- Mobile : cibles ≥ 48 px, feuilles avec focus trap, retour du focus à la ligne.
- Ne jamais utiliser la couleur seule pour distinguer une variante : le nom est toujours écrit.
- Titre de page : « Variantes de {produit} — Bruny Shopping ».

## 9. Données API

### Création (existant)

`POST /api/v1/admin/products` accepte :

```json
{
  "name": "Mocassin Glacé",
  "colors": ["Noir", "Cognac"],
  "sizes": ["39", "40", "41", "42", "43"],
  "variants": [
    { "color": "Noir", "size": "42", "stock": 4, "price": 42500, "lowStockThreshold": 5 }
  ]
}
```

Règles : `colors`/`sizes` génèrent le produit cartésien ; `variants[]` explicite peut compléter les valeurs ; les doublons sont refusés ; SKU serveur.

### Mise à jour (existant)

`PUT /api/v1/admin/products/:id/variants`

```json
{
  "variants": [
    { "id": "…", "color": "Noir", "size": "42", "stock": 4, "price": 42500, "lowStockThreshold": 5 },
    { "color": "Cognac", "size": "43", "stock": 0 }
  ]
}
```

- `reservedStock` interdit (`RESERVED_STOCK_FORBIDDEN`).
- Suppression d’une variante liée à une commande : `409 VARIANT_HAS_ORDERS`.
- SKU d’une variante existante conservé ; SKU d’une nouvelle variante généré.

### SKU

Format serveur : `{MARQUE8}-{PRODUIT10}-{TAILLE8}-{COULEUR12}`, normalisé en majuscules sans accents, collision suffixée `-2`, `-3`… L’aperçu client applique les mêmes règles mais ne garantit pas l’unicité.

### Manquant

`GET /admin/products/:id` doit renvoyer les variantes existantes (`id`, `sku`, `color`, `size`, `stock`, `reservedStock`, `price`, `lowStockThreshold`) pour éditer la grille.

## 10. Écarts et dépendances

- Aucun endpoint de détail admin : la grille d’édition est bloquée tant qu’il n’existe pas.
- Aucun endpoint de prévisualisation de SKU : l’aperçu est calculé côté client, avec avertissement explicite.
- Le backend ne permet pas de modifier `reservedStock`.
- La suppression est un remplacement complet : les variantes omises disparaissent. L’UI doit le rendre visible avant enregistrement (badge « sera supprimée »).
- Le prix de base est obligatoire ; un prix de variante nul n’est pas autorisé.
- Aucune image par variante dans cette grille : l’association couleur/image se fait dans A05.
- Le prototype HTML statique reprend les interactions principales, sans backend.

## 11. Référence

- CA #4 du brief DSG-06.
- `backend/src/modules/catalog/admin/sku/sku-generator.service.ts`.
- `backend/src/modules/catalog/admin/dto/` et `admin-products.controller.ts`.
- A05, A06, `PROTOTYPE.md`, `prototype/variant-generator.html`.
