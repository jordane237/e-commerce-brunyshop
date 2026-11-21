# CAT-10 — Analyse design de la fiche produit

Ticket : `[CAT-10] Fiche produit : galerie, couleurs, pointures, achat`
Branche : `feature/CAT-10-product-detail-page`
Date : 18 novembre 2026

## 1. Sources consultées

| Source | Usage |
| --- | --- |
| `design1/bruny shopping/bruny shopping.png` | Maquette P04, zone G (fiche produit), recadrée pour analyse |
| `docs/design-1/ANALYSE-MAQUETTES.md` | Description de la zone P04 et des composants attendus |
| `docs/design/DSG-07/GLOSSAIRE-MICROTEXTES.md` | Vocabulaire validé : « Ajouter au panier », « Couleur », etc. |
| `docs/design/DSG-05/CONTENUS.md` | Livraison, retours/échanges, réassurance |
| `docs/content/CNT-03/CONTENUS-CONSOLIDES.md` | Textes consolidés livraison et retours |
| `docs/design/DSG-03/README.md` | Inventaire DSG-03 |

### Limite importante

La spec annoncée `docs/design/DSG-03/P04-fiche-produit.md` **n'existe pas** dans ce dépôt.
L'analyse s'appuie donc sur la maquette P04, `docs/design-1/ANALYSE-MAQUETTES.md` et les
documents de contenus. Les wireframes 768/1280 ne peuvent pas être cités comme source
normative ; la mise en page responsive a été reconstruite à partir de la maquette et des
tokens DSG-02.

## 2. Structure P04 extraite

### Mobile — 360 px

- Fil d'Ariane compact.
- Galerie carrousel : image principale, compteur `1/N`, miniatures horizontales
  défilables, indicateurs, swipe tactile, ouverture du zoom.
- Bloc information empilé : marque/catégorie, nom, prix + ancien prix barré + badge
  `−X %`, disponibilité.
- Pastilles couleur, grille de pointures, quantité, CTA pleine largeur.
- Bandeau de réassurance.
- Onglets Description / Livraison / Retours.
- Produits similaires en grille 2 colonnes.
- Barre d'achat fixe en bas : prix, CTA panier, bouton WhatsApp.

### Tablette — 768 px

- Grille à 2 colonnes : galerie à gauche, informations/achat à droite.
- Miniatures encore horizontales (la colonne verticale apparaît à partir de 1024 px).
- Similaires en 3 colonnes.
- Barre d'achat fixe masquée dès 768 px.

### Desktop — 1280 px

- Galerie à gauche : miniatures verticales, grande image, zoom.
- Informations à droite : prix, sélecteurs, quantité, CTA, réassurance.
- Onglets et similaires sur toute la largeur (4 colonnes).
- Pas de barre d'achat fixe.

## 3. Microtextes retenus

- « Ajouter au panier »
- « Sélectionnez une couleur et une pointure »
- « Sélectionnez une pointure »
- « Sélectionnez une couleur »
- « Rupture de stock »
- « Plus que X en stock »
- « Guide des tailles »
- « Description », « Livraison », « Retours »
- « Produits similaires »
- « Paiement à la livraison »
- « Échange de pointure sous 7 jours »
- « Couleur » / « Pointure »
- Prix au format `25 000 FCFA` via `FcfaPipe`
- Badge promotion `−X %`

Les textes de livraison et de retours reprennent les contenus DSG-05 / CNT-03. Aucun
argument produit supplémentaire n'est ajouté : la description affichée est celle de l'API.

## 4. Tokens DSG-02 utilisés

- Espacements : `--bs-space-*`
- Couleurs : `--bs-color-surface`, `--bs-color-text`, `--bs-color-text-muted`,
  `--bs-color-primary`, `--bs-color-accent-text`, `--bs-color-danger-strong`,
  `--bs-color-success-strong`, `--bs-color-border`
- Rayons : `--bs-radius-sm|md|lg`
- Ombres : `--bs-shadow-focus`
- Typographie : `--bs-font-size-*`, `--bs-font-weight-*`
- Cible tactile : `--bs-touch-target`
- Breakpoints : 360 / 768 / 1024 (extension du jalon desktop 1280)

## 5. Composants

### Réutilisés

- `ProductCardComponent` (CAT-08), étendu pour accepter aussi `CatalogProductSummary`.
- `SizeSelectorComponent` (TEC-10), étendu : `showLabel`, `term`, `lowStockThreshold`,
  `listLabel`, radiogroup, pointures barrées, hint low stock, clavier.
- `QuantitySelectorComponent`, `PriceTagComponent`, `BadgeComponent`,
  `SkeletonComponent`, `EmptyStateComponent`, `ModalComponent`, `ButtonComponent`.
- `FcfaPipe`, `SeoService`, `CartStore`, `MiniCartDrawerComponent`.

### Créés

- `libs/ui/tabs` : onglets ARIA avec navigation clavier.
- `libs/ui/reassurance-band` : bandeau générique de réassurance.
- `ProductDetailStore` : état et computed de la fiche.
- `ProductGalleryComponent` : galerie, miniatures, swipe, zoom.
- `ColorSelectorComponent` : pastilles, couleurs indisponibles, clavier.
- `StickyBuyBarComponent` : barre mobile panier + WhatsApp.
- `ProductDetailPage` : orchestration, SEO, onglets, similaires.

## 6. Décisions de cohérence

- **Prix par couleur** : `displayPrice` utilise la variante sélectionnée, sinon le prix
  minimum des variantes de la couleur, sinon le prix produit. La couleur met donc à jour
  le prix même avant le choix de la pointure (CA #2).
- **Couleur auto-sélectionnée** : la première couleur en stock est sélectionnée au
  chargement, conformément au plan validé. La pointure reste toujours à choisir (CA #4).
- **Galerie** : `CatalogColor.images` contient déjà les images spécifiques et communes ;
  le store les utilise directement et retombe sur les images communes.
- **Ajout panier** : `CartStore.addLine` déclenche déjà le toast et l'ouverture du
  mini-panier via `lastAddedAt` ; aucun doublon de notification.
- **WhatsApp** : URL construite depuis `APP_CONFIG.contactWhatsappUrl`, avec message
  pré-rempli. Le numéro par défaut reste un placeholder à remplacer par le propriétaire.
- **Guide des tailles** : route existante `/guide-des-tailles` (le ticket mentionne
  `/guide-tailles`, absent du routeur) ; le paramètre `?category=` est transmis mais la
  page ne filtre pas encore par catégorie.
- **Onglets** : le ticket impose des onglets, bien que la maquette montre des accordéons ;
  les onglets ont été retenus.
- **Similaires** : ajoutés même s'ils sont peu visibles sur la maquette, car exigés par le
  CA #6 ; la source API en fournit jusqu'à 6.

## 7. Écarts et points d'attention

| Écart | Impact |
| --- | --- |
| Spec P04 DSG-03 absente | Pas de référence normative 768/1280 ; mise en page reconstruite |
| Seed mono-couleur, 2 images, sans promo | Les cas multi-couleurs/promo/stock faible sont couverts par mocks unitaires et e2e |
| Numéro WhatsApp placeholder | À remplacer avant mise en production |
| `/guide-des-tailles` sans filtre catégorie | Lien fonctionnel, filtrage CAT-06 non branché |
| Lighthouse non exécuté | Outil absent/localement indisponible ; voir `VERIFICATION.md` |
| Pas d'audit lecteur d'écran VoiceOver/NVDA | Vérifications ARIA et clavier automatisées uniquement |
