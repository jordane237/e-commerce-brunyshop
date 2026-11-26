# CAT-09 — Analyse design P03 (Recherche de produits)

## 1. Source et statut

- Maquette P03 **absente** : `docs/design/DSG-03/README.md` indique « P03 Recherche — Aucune maquette — Absent ».
- Source visuelle réelle : `design1/bruny shopping/bruny shopping.png` (aucune zone ne correspond à la recherche).
- Spec DSG-03 dédiée `P03-recherche.md` : inexistante.
- Décision : implémentation fondée sur les patterns CAT-08/P02, les composants `@bruny/ui` et les tokens DSG-02, sans inventer de maquette desktop/tablette.

## 2. Structure retenue par breakpoint

### Mobile (360 px)

- Titre `Rechercher un produit`.
- Champ de recherche prominent, pleine largeur, hauteur ≥ 44 px, icône loupe et bouton d’effacement.
- Résultats en grille 2 colonnes via `ProductGridComponent`.
- État vide centré avec `EmptyStateComponent`, puis suggestions en grille 2 colonnes.

### Tablette (768 px)

- Même structure, grille de suggestions 3 colonnes.
- Padding augmenté.

### Desktop (1280 px)

- Contenu centré dans un conteneur max 1280 px.
- Grille de suggestions 4 colonnes.
- Champ de recherche reste pleine largeur du conteneur.

## 3. Microtextes validés

- Label / aria-label : `Rechercher un produit, une marque ou une catégorie`
- Placeholder : `Nom, marque, catégorie`
- Titre de page : `Rechercher un produit`
- Compteur : `X produit(s) trouvé(s) pour « q »`
- État vide : `Aucun résultat pour « q »`
- Description état vide : `Essayez un autre mot-clé ou parcourez le catalogue.`
- CTA état vide : `Voir le catalogue`
- Bouton d’effacement : `Effacer la recherche`
- Suggestions : `Nouveautés` (backend ne fournit pas de tri `popular`)

## 4. Tokens DSG-02 utilisés

- Espacements : `--bs-space-*`
- Couleurs : `--bs-color-text`, `--bs-color-text-muted`, `--bs-color-surface`, `--bs-color-border`, `--bs-color-primary`
- Rayons : `--bs-radius-lg`, `--bs-radius-md`
- Cible tactile : `--bs-touch-target`
- Focus : `--bs-shadow-focus`

## 5. Composants réutilisés

- `ProductGridComponent` (CAT-08) pour la grille et les squelettes
- `ProductCardComponent` (`@bruny/ui`) pour les suggestions
- `EmptyStateComponent` (`@bruny/ui`) pour l’état vide
- `ButtonComponent` (`@bruny/ui`) pour réessayer
- `CatalogStore` (CAT-08) pour les données et la protection contre les réponses obsolètes
- `SeoService` (TEC-13) pour `noIndex`

## 6. Décisions

- Option A retenue : réutilisation de `CatalogStore`, pas de store dédié.
- La recherche catalogue (`CatalogHeaderComponent`) reste un filtre de `/boutique`; `/recherche` est la page dédiée P03.
- Les suggestions utilisent `sort=newest` car le backend CAT-02 n’expose pas `popular`.
- `CatalogStore` conserve son garde `requestId` et ajoute `switchMap` pour l’annulation réseau réelle.