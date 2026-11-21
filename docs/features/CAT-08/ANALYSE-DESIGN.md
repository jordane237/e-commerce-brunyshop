# CAT-08 — Analyse design et existant (page boutique avec filtres)

**Branche** : `feature/CAT-08-catalog-page`
**Date** : 12 novembre 2026
**Périmètre** : page catalogue/boutique, filtres synchronisés à l'URL, tri, pagination, états.
**Statut** : analyse présentée, implémentation en attente de validation.

## 1. Sources consultées

| Source                | Emplacement                                                                                                | Ce qu'elle contient réellement                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Planche de maquettes  | `design1/bruny shopping/bruny shopping.png` (4 302 × 5 532)                                                | Une seule planche PNG, 11 écrans mobiles + 1 planche DS                                |
| Analyse des maquettes | `docs/design-1/ANALYSE-MAQUETTES.md`                                                                       | Structure de P02, microtextes, écarts, états manquants                                 |
| Traçabilité DSG-03    | `docs/design/DSG-03/README.md`                                                                             | **Aucune spec d'écran** : P02 est « analyse seulement », mobile partiel                |
| Glossaire             | `docs/design/DSG-07/GLOSSAIRE-MICROTEXTES.md`                                                              | Formes canoniques FR (actions, titres, états vides, erreurs)                           |
| Audit a11y            | `docs/design/DSG-07/AUDIT-ACCESSIBILITE.md`                                                                | P02 : focus, contrastes, cibles et états non démontrés                                 |
| Tickets post-gel      | `docs/design/DSG-07/TICKETS-POST-GEL.md`                                                                   | Filtres « top bar desktop + drawer mobile », pagination desktop + « Voir plus » mobile |
| Tokens                | `docs/design-system/TOKENS.md`, `frontend/libs/design-tokens/src/_tokens.scss`                             | 120 variables `--bs-*`, breakpoints 480/768/1024/1280                                  |
| API réelle            | `backend/src/modules/catalog/dto/list-products.dto.ts`, `frontend/libs/data-access/src/lib/catalog-api.ts` | Filtres, tri, facettes et limites effectivement exposés                                |

**Constat bloquant de documentation** : il n'existe ni spec P02 360/768/1280, ni export par écran, ni état de chargement/vide/erreur dessiné. La maquette P02 est un viewport mobile unique d'environ 390 px. Les compositions tablette et desktop doivent être **décidées** ici, pas extraites d'une source.

## 2. Maquette P02 — ce qui est réellement dessiné

Zone F de la planche : `x=1276, y=800, 392 × 1568` (recadrage inspecté le 12/11/2026).

Structure observée de haut en bas :

1. **En-tête global** : hamburger, logo « BRUNY SHOPPING », loupe, panier avec pastille « 2 ». Pas de barre inférieure sur P02.
2. **Fil d'Ariane** : « Accueil › Chaussures Homme › Mocassins & Richelieu ».
3. **Titre de rayon** : « Mocassins & Richelieu ».
4. **Compteur** : pastille verte + « 48 modèles disponibles en direct atelier & Douala ».
5. **Barre d'outils dans une carte** : bouton navy « Filtres 2 » à gauche, select « Popularité » à droite.
6. **Ligne « ACTIFS: »** : puces supprimables « Pointure 42 × », « Cuir Véritable × », « En Stock… » (débordement horizontal).
7. **Grille 2 colonnes** de cartes : favori, badges (NOUVEAU, CUIR ITALIEN, ÉLITE OR, -20 %, DERNIÈRES PIÈCES, CUIR GRAINÉ), note « 4.9 (24 avis) », nom tronqué, accroche tronquée, prix, « POINTURES EN STOCK : », pointures avec 42 sélectionnée en navy, CTA navy « Commander ».
8. **Bouton pleine largeur** « Afficher plus de modèles (24 restants) » avec chevron.
9. **Compteur** « Affichage de 4 sur 48 articles ».
10. **Bloc réassurance** à trois lignes : essai à la livraison, paiement cash/mobile, échange 7 jours.

Absents du dessin : colonne de filtres, tiroir mobile, état vide, squelettes, erreur, pagination numérotée, vues ≥ 768 px.

### Structure cible par breakpoint (décision CAT-08)

| Zone          | 360–767 px (mobile)                          | 768–1023 px (tablette)             | ≥ 1024 px (desktop)                |
| ------------- | -------------------------------------------- | ---------------------------------- | ---------------------------------- |
| Filtres       | Bouton « Filtres (N) » + drawer bottom-sheet | Sidebar 240 px + grille 3 colonnes | Sidebar 260 px + grille 4 colonnes |
| Grille        | 2 colonnes, gap 12 px                        | 3 colonnes, gap 20 px              | 4 colonnes, gap 24 px              |
| Tri           | Bouton « Trier par » ouvrant un bottom sheet | Select inline                      | Select inline                      |
| Puces actives | Défilement horizontal                        | Retour à la ligne                  | Retour à la ligne                  |
| Pagination    | « Voir plus » + compteur                     | Pages numérotées                   | Pages numérotées                   |
| Réassurance   | 3 lignes empilées                            | 3 colonnes                         | 3 colonnes                         |

Cette répartition applique `DSG-07-FIX-30` (filtres top bar/sidebar desktop, drawer mobile) et `DSG-07-FIX-28` (pagination desktop, « Voir plus » mobile). La « top bar » de DSG-07 est interprétée comme la barre d'outils au-dessus de la grille, avec sidebar persistante sur desktop.

## 3. Microtextes : maquette vs glossaire

Le glossaire DSG-07 est la source de vérité. La maquette contient des variantes qui ne doivent pas être reprises telles quelles.

| Concept       | Maquette P02                               | Forme retenue                                                                                           | Décision                                                         |
| ------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Titre de page | « Mocassins & Richelieu »                  | Titre = nom de la catégorie active, sinon **Boutique**                                                  | Glossaire : « Catalogue » est un terme interne                   |
| Filtres       | « Filtres 2 »                              | **Filtres (N)**                                                                                         | Compteur entre parenthèses, lisible au lecteur d'écran           |
| Tri           | « Popularité »                             | **Trier par** + options                                                                                 | Le backend n'a pas de tri populaire (voir §6)                    |
| Puces actives | « ACTIFS: »                                | **Filtres actifs**                                                                                      | Micro-libellé en capitales autorisé, mais « ACTIFS: » est ambigu |
| Voir plus     | « Afficher plus de modèles (24 restants) » | **Voir plus** + compteur séparé                                                                         | Glossaire : « Voir plus » ; « Afficher plus » interdit           |
| Compteur      | « Affichage de 4 sur 48 articles »         | **4 produits sur 48**                                                                                   | Forme FR concise, même information                               |
| État vide     | Non dessiné                                | **Aucun résultat** / **Essayez un autre mot-clé ou retirez un filtre.** / **Réinitialiser les filtres** | Glossaire §9                                                     |
| Erreur        | Non dessinée                               | **Connexion impossible. Vérifiez votre réseau et réessayez.** + **Réessayer**                           | Glossaire §7                                                     |
| Drawer mobile | Non dessiné                                | **Voir les N résultats**                                                                                | Dérogation à valider : le CA impose un compteur dans le bouton   |

**Point à valider** : « Voir N résultats » n'existe pas dans le glossaire, qui prévoit « Appliquer les filtres ». Le CA #3 impose le compteur. Proposition : bouton **« Voir les N résultats »**, dérogation documentée, plutôt que « Appliquer les filtres » qui perd l'information de volume.

Libellés de tri proposés (aucun n'est dans le glossaire, à ajouter) : **Nouveautés**, **Prix croissant**, **Prix décroissant**, **Nom (A–Z)**.

## 4. Tokens et composants réutilisables

### Tokens DSG-02 à utiliser

- Couleurs : `--bs-color-primary`, `--bs-color-canvas`, `--bs-color-surface`, `--bs-color-surface-muted`, `--bs-color-border`, `--bs-color-text`, `--bs-color-text-muted`, `--bs-color-accent-text` (jamais `--bs-color-accent` en texte), `--bs-color-danger-strong`.
- Typo : `--bs-font-size-xs` à `--bs-font-size-3xl`, `--bs-font-weight-semibold|bold|extrabold`, `--bs-line-height-snug`.
- Layout : `--bs-space-1` à `--bs-space-12`, `--bs-radius-md|lg|full`, `--bs-shadow-sm|md`, `--bs-touch-target` (44 px), `--bs-container-max`.
- Focus : `--bs-shadow-focus` ou mixin `bs-focus-ring`.
- Breakpoints Sass : `sm 480`, `md 768`, `lg 1024`, `xl 1280` via `bs-media-up()`.
- Mouvement : `--bs-duration-base`, neutralisé par `bs-reduced-motion`.

### Composants `@bruny/ui` existants

| Composant              | Usage CAT-08                                         | Limite constatée                                                                  |
| ---------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `ProductCardComponent` | Cartes de la grille                                  | Pas de `density`, pas de `role=listitem`, CTA interne « Ajouter » non utilisé ici |
| `SkeletonComponent`    | Squelettes de cartes                                 | Un seul rectangle ; le squelette de carte sera composé dans la grille             |
| `ButtonComponent`      | Filtres, voir plus, réinitialiser                    | Pas de contenu projeté ? Vérifié : contenu projeté supporté                       |
| `BadgeComponent`       | Compteur de filtres, promotions                      | Variantes suffisantes                                                             |
| `PriceTagComponent`    | Prix dans les cartes                                 | Déjà utilisé par ProductCard                                                      |
| `CheckboxComponent`    | Catégories, marques, disponibilité, promo            | `aria-describedby` pointe vers un id absent (DSG-07-FIX-04)                       |
| `ToggleComponent`      | En stock / en promotion                              | Même dette ARIA que Checkbox                                                      |
| `SelectComponent`      | Tri desktop                                          | Suffisant, mais un select natif stylé est plus simple                             |
| `InputComponent`       | Prix min/max                                         | Type `number` disponible                                                          |
| `ModalComponent`       | Base du drawer                                       | Centré, pas de variante bottom-sheet ; focus trap et Échap déjà implémentés       |
| `IconComponent`        | `filter`, `sort`, `close`, `chevron-down`, `refresh` | Toutes les icônes nécessaires existent                                            |

### Composants absents de `@bruny/ui`

`Tabs`, `Accordion`, `EmptyState`, `FilterDrawer`, `ActiveFiltersChips`, `SortDropdown`, `Pagination`, `Breadcrumb`, `Chip`. Le prompt les supposait livrés par TEC-10/DSG-06 : ce n'est pas le cas.

## 5. Existant applicatif

- **Route** : `/boutique`, chargée en lazy via `loadComponent` dans `app.routes.ts`. La route `/catalogue` n'existe pas et le glossaire impose « Boutique ». Les liens de la home pointent vers `/boutique?category=<slug>`.
- **Composant** : `features/catalog/catalog-page.ts`, un seul fichier inline (template + styles) d'environ 250 lignes. Il contient déjà un hero éditorial, un select catégorie, un select pointure, une recherche, une grille 4/2 colonnes, une pagination précédent/suivant et des états loading/error/empty sommaires.
- **URL** : lecture seule de `queryParamMap` (`category`, `page`) ; catégorie et pointure ne sont pas écrites dans l'URL ; le tri n'existe pas ; `page` est écrit sans `replaceUrl` explicite.
- **API** : `CatalogApi.list()` renvoie `ProductPage` avec `items`, `pagination` et `facets`. `CatalogApi.categories()` renvoie l'arbre. **Aucune méthode `brands()`** et **aucun endpoint `/brands`** dans le contrat généré : les marques proviennent de `facets.brands`.
- **Facettes** : `categories`, `brands`, `sizes`, `colors`, `availability`, `promotion`, `price`. Elles sont calculées **globalement**, sans tenir compte des filtres actifs (`getFacets(now)` sans `where`), et les couleurs sont en majuscules (`NOIR`, `BLEU`).
- **Contrat de filtres réel** : `page`, `limit` (1–48, défaut 12), `category`, `brand`, `size`, `color`, `minPrice`, `maxPrice`, `sort`, `q`, `inStock`, `promo`. `sort` accepte **`newest | price_asc | price_desc | name`** uniquement. `name_asc` et `popular` renvoient 400.
- **Données de seed** : 20 produits publiés, 4 catégories sans enfant, 4 marques, pointures 36–46, 9 couleurs, aucune promotion active, tout en stock, prix de 8 000 à 33 500 FCFA.
- **Shell** : `app.html` fournit un header minimal (logo, Boutique, Panier, contact) et un footer. Pas de bottom-nav, pas de recherche dans le header.
- **SSR** : `RenderMode.Server` sur `**`, `provideClientHydration(withEventReplay())`, `withFetch()`, `API_INTERNAL_URL` et `HTTP_TRANSFER_CACHE_ORIGIN_MAP` déjà configurés côté serveur. Le cache de transfert HTTP est activé par défaut avec l'hydratation : aucune option supplémentaire n'est nécessaire.
- **Tests** : Vitest + jsdom, TestBed zoneless, `@analogjs/vite-plugin-angular`. Playwright est configuré (`frontend/playwright.config.ts`, un seul spec `e2e/catalog.spec.ts`). Aucun target `test`/`lint` dans `angular.json` : les scripts passent par `vitest`/`eslint` à la racine `frontend`.
- **Lighthouse** : `.lighthouserc.json` existe (mobile, devtools, seuils perf 0.9 / a11y 0.95), mais **aucun job Lighthouse dans la CI**. La mesure reste locale.

## 6. Écarts entre le ticket et le dépôt

| Ticket                                                                       | Réalité                                      | Décision CAT-08                                                                     |
| ---------------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------- |
| `projects/shop`, `@brunyshop/*`                                              | `apps/storefront`, `@bruny/*`                | Suivre le dépôt                                                                     |
| Route `/catalogue`                                                           | `/boutique`                                  | Conserver `/boutique` (glossaire + liens existants)                                 |
| Tri `name_asc`, `popular`                                                    | `name`, pas de `popular`                     | 4 options seulement ; documenter l'absence de tri populaire                         |
| `GET /brands`                                                                | Inexistant                                   | Alimenter les marques via `facets.brands`                                           |
| `limit` max 50                                                               | Max 48                                       | Page de 12 produits (multiple de 2, 3 et 4, démontre la pagination sur 20 produits) |
| Filtres « catégorie, marque, pointure, couleur, prix, disponibilité, promo » | Tous disponibles côté API                    | Les 7 filtres sont implémentables                                                   |
| « Voir N résultats »                                                         | Glossaire : « Appliquer les filtres »        | Dérogation « Voir les N résultats » à valider                                       |
| Pagination « selon maquette »                                                | Maquette : voir plus mobile ; pas de desktop | Mobile « Voir plus », desktop pages numérotées                                      |
| Composants TEC-10 `Tabs`, `Accordion`, `EmptyState`                          | Absents                                      | Créer ce qui est nécessaire, sans élargir au-delà                                   |
| Job Lighthouse CI                                                            | Absent                                       | Mesure locale documentée ; pas de job CI inventé                                    |

## 7. Décisions d'architecture proposées

1. **L'URL est l'unique source de vérité.** Le store ne navigue jamais. Le composant écoute `queryParamMap`, mappe vers `CatalogFilters`, puis charge. Les actions utilisateur écrivent l'URL (`queryParamsHandling: 'merge'`, `replaceUrl: false`). Pas de boucle possible, pas de flag anti-boucle fragile.
2. **`CatalogStore` à signaux** : `filters`, `products`, `meta`, `facets`, `loading`, `loadingMore`, `error`, `hasResults`, `isEmpty`, `activeFilterCount`. `load(filters)` remplace la liste ; `load(filters, true)` ajoute la page suivante. `retry()` rejoue le dernier mode (remplacement ou ajout).
3. **URL propre** : aucune valeur par défaut sérialisée (`sort=newest`, `page=1`, `limit=12` absents). Booléens en `true`/`false`. Prix en entiers XAF.
4. **Debounce 300 ms** sur la recherche `q` uniquement. Les prix sont validés sur `change` (Entrée ou sortie de champ) pour éviter une requête par frappe ; catégorie, marque, pointure, couleur, toggles et tri sont immédiats.
5. **Catégories et marques** : `facets.categories` et `facets.brands` (une seule requête produits, compteurs cohérents). **Pointures** : `facets.sizes`. **Couleurs** : `facets.colors`, libellé capitalisé (`NOIR` → `Noir`), sans pastille de couleur inventée.
6. **Drawer mobile** : composant de feature, `role="dialog"`, `aria-modal="true"`, focus trap, Échap, overlay, verrou de scroll, animation neutralisée sous `prefers-reduced-motion`. Les filtres s'appliquent en direct ; le bouton « Voir les N résultats » ferme le tiroir et rend le focus au bouton d'ouverture.
7. **Pagination** : mobile « Voir plus » (ajout, `loadingMore`), desktop pages numérotées (`aria-current="page"`). Au retour arrière, l'URL redevient autoritaire et recharge la page cible en remplacement.
8. **État vide** : `role="status"`, `aria-live="polite"`, titre « Aucun résultat », texte du glossaire, CTA « Réinitialiser les filtres », liens vers les 3 premières catégories des facettes et vers les nouveautés.
9. **SSR** : conserver `RenderMode.Server` et la configuration de transfert existante. Le store n'utilise ni `window`, ni `document`, ni `localStorage`. Le drawer ne s'ouvre que sur action utilisateur.
10. **SEO** : `SeoService.set()` avec titre de catégorie ou « Boutique », description et canonique **sans query params** pour éviter le contenu dupliqué.

## 8. Fichiers prévus

À créer :

```text
frontend/apps/storefront/src/app/features/catalog/
  catalog-page.ts|html|scss|spec.ts        (remplace le fichier inline)
  catalog.routes.ts
  catalog.store.ts + catalog.store.spec.ts
  catalog-query.ts + catalog-query.spec.ts  (mapping URL ↔ filtres, pur et testable)
  components/
    catalog-header/        4 fichiers
    filter-sidebar/        4 fichiers
    filter-drawer/         4 fichiers
    active-filters-chips/  4 fichiers
    sort-select/           4 fichiers
    product-grid/          4 fichiers
    empty-state/           4 fichiers
    pagination/            4 fichiers
```

À modifier :

- `frontend/apps/storefront/src/app/app.routes.ts` : route `boutique` vers `catalog.routes`.
- `frontend/libs/data-access/src/lib/catalog-api.ts` : type `ProductSort` déjà exporté ; aucune méthode supplémentaire nécessaire.
- `frontend/e2e/catalog.spec.ts` : remplacer le spec unique par la suite CAT-08.
- `docs/features/CAT-08/VERIFICATION.md` : à produire après implémentation.

À ne pas modifier sans nécessité : `app.config.ts` (cache de transfert déjà actif), `libs/ui` (sauf ajout d'un composant réellement générique), `angular.json`.

## 9. Risques et points d'attention

1. **Pas de spec desktop** : les compositions 768/1280 sont des décisions CAT-08, pas une extraction de maquette.
2. **Facettes non filtrées** : les compteurs restent globaux ; ne pas les présenter comme « résultats après filtre ».
3. **Couleurs en majuscules** et sans code hexadécimal : pas de pastille couleur, seulement du texte.
4. **Seed pauvre** : 20 produits, aucune promo, tout en stock. Les scénarios « promo », « rupture » et « page 2 » doivent être testés avec des mocks ou des filtres produisant zéro résultat (`size=99`, `promo=true`).
5. **Tri populaire absent** : le ticket et la maquette l'affichent ; l'API ne le fournit pas. Ne pas simuler un tri qui n'existe pas.
6. **`ProductCard`** : CTA « Ajouter » non fonctionnel sans variante sélectionnée ; ne pas l'activer sur la grille.
7. **Recherche** : le champ `q` existe dans l'API mais P03 n'est pas conçue. Décision : conserver un champ de recherche dans la barre d'outils, sans créer la page P03.
8. **Performance** : 12 cartes avec images distantes ; `NgOptimizedImage` est déjà utilisé. Mesurer avant d'annoncer un budget.
9. **Historique** : chaque changement de filtre crée une entrée ; un utilisateur qui coche 5 filtres devra faire 5 retours. Acceptable et conforme au CA, à documenter.
10. **Accessibilité** : `CheckboxComponent`/`ToggleComponent` ont une dette ARIA (`aria-describedby` vers un id absent). La corriger dans la lib est hors périmètre CAT-08 ; ne pas l'aggraver.

## 10. Validation attendue

- Pagination : mobile « Voir plus » + desktop pages numérotées (recommandé) ou « Voir plus » partout.
- Libellé du bouton du drawer : « Voir les N résultats » (dérogation glossaire) ou « Appliquer les filtres ».
- Tri : 4 options réelles, sans « Populaires ».
- Route : conserver `/boutique`.
- Périmètre des composants : créer les composants dans `features/catalog/components/`, sans élargir `libs/ui` pour cette itération.
