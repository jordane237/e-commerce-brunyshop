# CAT-11 — Analyse design (guide des tailles modale + partage)

## 1. Branches et sources

- Branche : `feature/CAT-11-size-guide-share`
- Maquette P04 : uniquement mobile (zone G de `design-1`)
- P05 : absent des maquettes et des specs DSG-03
- Sources réelles : `docs/features/CAT-10/ANALYSE-DESIGN.md`, `docs/design-1/ANALYSE-MAQUETTES.md`, page statique `/guide-des-tailles`, CAT-06, tokens DSG-02, glossaire DSG-07

## 2. Existant réutilisé

- `ModalComponent` (`@bruny/ui`) : focus trap, Échap, `role="dialog"`, `aria-modal`, restauration du focus
- `TabsComponent` (`@bruny/ui`) : onglets avec navigation clavier
- `SkeletonComponent`, `ButtonComponent`, `IconComponent`
- `ToastService` (`@bruny/core`) pour « Lien copié ! »
- `CatalogApi.sizeGuide(categoryId)` (CAT-06)
- `SeoService` (TEC-13) pour les meta Open Graph
- Page statique `/guide-des-tailles` (MKT-01) conservée pour le footer

## 3. Structure retenue

### Mobile (360 px)

- Bouton « Guide des tailles » au-dessus de la grille de pointures
- Modale `size="lg"` avec tableau, onglets, méthode 3 étapes, conseil
- Boutons de partage sous le CTA « Ajouter au panier »

### Tablette (768 px) et desktop (1280 px)

- Même modale centrée
- Tableau et onglets conservés
- Boutons de partage toujours visibles sous le CTA

## 4. Microtextes retenus

- Guide des tailles
- Tableau de conversion
- Comment mesurer votre pied
- Étape 1 : Posez une feuille de papier au sol, talon contre un mur.
- Étape 2 : Marquez la pointe de votre orteil le plus long.
- Étape 3 : Mesurez la distance en cm et reportez-la dans le tableau.
- Entre deux tailles ? Choisissez la plus grande pour plus de confort.
- Partager
- Partager sur Facebook
- Partager sur WhatsApp
- Copier le lien
- Lien copié !
- Fermer

## 5. Tokens DSG-02 utilisés

- `--bs-space-*`
- `--bs-color-text`, `--bs-color-text-muted`, `--bs-color-surface`, `--bs-color-border`, `--bs-color-primary`
- `--bs-radius-md`, `--bs-radius-xl`
- `--bs-shadow-focus`
- `--bs-touch-target`
- `--bs-z-modal`

## 6. Décisions

1. Modale depuis P04 distincte de la page statique `/guide-des-tailles` : coexistence.
2. `ProductDetailPage` ouvre la modale au lieu d’un `routerLink`.
3. `ShareService` construit directement l’URL WhatsApp (`wa.me/?text=...`) avec le message demandé.
4. Web Share API ajoutée en bonus sur mobile.
5. `SeoService` enrichi avec `product:price:amount` et `product:price:currency`.