# Inventaire exhaustif du design — DSG-07

**Date** : 11 novembre 2026
**Branche** : `feature/DSG-07-final-a11y-coherence-review`
**Objet** : état factuel des sources de design avant l’audit WCAG 2.1 AA et l’audit de cohérence.
**Statut de ce document** : inventaire terminé, audit non commencé.

---

## 1. Synthèse exécutive

| Constat | Résultat |
| --- | --- |
| Dossiers `/design` et `/design-1` à la racine | **Inexistants** |
| Emplacements réels | `design1/` (planche PNG), `docs/design/` (specs DSG-04 à DSG-06), `docs/design-1/` (analyse DSG-03), `docs/design-system/` |
| Maquettes visuelles | **1 PNG unique**, planche de présentation 4302 × 5532 px |
| Exports par écran | **Aucun** (pas de PNG/SVG/PDF séparé) |
| Sources éditables | **Aucune** (pas de Figma, Sketch, Penpot, SVG, PDF) |
| Vues desktop/tablette dessinées | **Aucune** |
| Specs d’écran existantes | **51** : 8 dans DSG-04, 22 dans DSG-05, 21 dans DSG-06 |
| Specs P01–P07 | **Absentes** ; seul `docs/design-1/ANALYSE-MAQUETTES.md` existe |
| Dossier DSG-03 | **Absent** de `docs/design/` |
| Design System documenté | 3 fichiers seulement : audit, hypothèses, référence tokens |
| `ux-flows.md` | **Inexistant** |
| Composants Angular existants | **16** dans `frontend/libs/ui` |
| Traçabilité des validations | DSG-04, DSG-05 et DSG-06 : checklists **non signées** |

### Conséquence pour DSG-07

L’audit ne peut pas prétendre vérifier « toutes les maquettes » au sens pixel : 51 vues n’ont que des specs textuelles, et 7 vues P01–P07 n’ont aucune spec dédiée. La source visuelle ne couvre complètement que quatre écrans mobile (P01, P02, P04, P06) et partiellement quatre groupes (checkout, confirmation/suivi, compte, back-office).

La revue appliquera donc cette hiérarchie, sans inventer de preuve visuelle :

1. **Maquette** quand une zone existe dans la planche.
2. **Spec textuelle** quand elle est la seule source, en auditant ce qui est prescrit (structure, états, a11y, microtextes).
3. **Absence explicitement signalée** quand ni maquette ni spec n’existent.

---

## 2. Méthode et sources

### 2.1 Exploration réalisée

- Listing récursif de `design1/`, `docs/design/`, `docs/design-1/`, `docs/design-system/`.
- Inspection visuelle de la planche PNG (aperçu réduit, zones recadrées par coordonnées).
- Lecture des analyses existantes : `docs/design-1/ANALYSE-MAQUETTES.md`, `docs/design-system/DESIGN-AUDIT.md`, `docs/design-system/ASSUMPTIONS.md`, `docs/design-system/tokens-reference.md`.
- Lecture des README, VALIDATION, CARTOGRAPHIE et COMPOSANTS-REQUIS de DSG-04, DSG-05 et DSG-06.
- Relevé des 51 specs d’écran et de leurs sections d’accessibilité.
- Inventaire du code Design System : tokens SCSS/CSS et 16 composants `@bruny/ui`.
- Recherche globale de `ux-flows` : aucun fichier trouvé.

### 2.2 Hiérarchie des preuves pour l’audit

| Niveau | Source | Usage |
| --- | --- | --- |
| 1 | Planche `design1/bruny shopping/bruny shopping.png` | Intention visuelle, couleurs, composants, positions, tailles relatives |
| 2 | Specs `docs/design/DSG-04` à `DSG-06` | Structure, états, comportements, microtextes, accessibilité prescrite |
| 3 | `docs/design-system/` + `frontend/libs/design-tokens` | Tokens, contrastes, focus, cibles, règles de composants |
| 4 | `frontend/libs/ui` | Composants réellement disponibles et limites d’implémentation |
| 5 | `docs/design-1/ANALYSE-MAQUETTES.md` | Analyse antérieure de P01–P07, à reconfirmer |

### 2.3 Limites de méthode

- Les captures sont aplaties : aucune valeur de style n’est exportable, les tailles sont mesurées approximativement.
- La planche est mobile (392–396 px par écran) ; les vues 768/1280 n’existent que sous forme de wireframes textuels.
- Les contrastes des maquettes seront calculés à partir des tokens DSG-02 et des couleurs observées, pas d’un export de styles.
- Les specs ne prouvent pas l’implémentation : elles prouvent l’intention de design.
- Un écart visuel non visible dans le PNG ne peut pas être audité comme un défaut de maquette ; il sera traité comme une lacune de documentation.

---

## 3. Arborescence complète

### 3.1 Racine `design1/`

```text
design1/
└── bruny shopping/
    └── bruny shopping.png
```

### 3.2 `docs/design-1/`

```text
docs/design-1/
└── ANALYSE-MAQUETTES.md
```

### 3.3 `docs/design-system/`

```text
docs/design-system/
├── ASSUMPTIONS.md
├── DESIGN-AUDIT.md
└── tokens-reference.md
```

**Fichiers attendus par DSG-07 et absents** : `README.md`, `ACCESSIBILITY.md`, `GLOSSAIRE.md`, `COMPOSANTS.md`, `CHANGELOG.md`.

### 3.4 `docs/design/DSG-04/` — 15 fichiers

```text
docs/design/DSG-04/
├── ANALYSE-EXISTANT.md
├── COMPOSANTS-REQUIS.md
├── MICROTEXTES.md
├── P08-checkout-start.md
├── P09-coordonnees.md
├── P10-livraison.md
├── P11-paiement.md
├── P11b-attente-paiement.md
├── P11c-echec-paiement.md
├── P12-confirmation.md
├── P13-suivi-public.md
├── PARCOURS.md
├── PROTOTYPE.md
├── README.md
└── VALIDATION.md
```

### 3.5 `docs/design/DSG-05/` — 30 fichiers

```text
docs/design/DSG-05/
├── ANALYSE-EXISTANT.md
├── CARTOGRAPHIE.md
├── COMPOSANTS-REQUIS.md
├── CONTENUS.md
├── MICROTEXTES.md
├── P14-connexion.md
├── P15-inscription.md
├── P16-mot-de-passe-oublie.md
├── P16b-reinitialisation-mot-de-passe.md
├── P17-tableau-de-bord-compte.md
├── P18-commandes.md
├── P18b-detail-commande.md
├── P19-profil.md
├── P19b-suppression-compte.md
├── P20-adresses.md
├── P20b-edition-adresse.md
├── P21-favoris.md
├── P22-contact.md
├── P23-faq.md
├── P24-livraison.md
├── P25-retours.md
├── P26-a-propos.md
├── P27-pages-legales.md
├── P27b-erreur-404.md
├── P27c-erreur-500.md
├── P27d-hors-ligne.md
├── P27e-maintenance.md
├── PROTOTYPE.md
├── README.md
└── VALIDATION.md
```

### 3.6 `docs/design/DSG-06/` — 30 fichiers

```text
docs/design/DSG-06/
├── A01-connexion-admin.md
├── A02-2fa.md
├── A03-dashboard.md
├── A04-liste-produits.md
├── A05-creation-edition-produit.md
├── A05b-variant-generator.md
├── A06-gestion-stock.md
├── A07-liste-commandes.md
├── A08-detail-commande.md
├── A09-liste-livraisons.md
├── A09b-my-deliveries.md
├── A09c-detail-livraison.md
├── A10-liste-clients.md
├── A10b-detail-client.md
├── A11-utilisateurs-internes.md
├── A12-promotions.md
├── A12b-edition-coupon.md
├── A13-avis-clients.md
├── A14-parametres.md
├── A15-audit-log.md
├── A16-profil-admin.md
├── ANALYSE-EXISTANT.md
├── CARTOGRAPHIE.md
├── COMPOSANTS-REQUIS.md
├── MICROTEXTES.md
├── PROTOTYPE.md
├── README.md
├── RESPONSIVE-PATTERNS.md
├── VALIDATION.md
└── prototype/
    └── variant-generator.html
```

### 3.7 Composants et tokens

```text
frontend/libs/design-tokens/
├── project.json
└── src/
    ├── _tokens.scss
    ├── index.scss
    └── tokens.css

frontend/libs/ui/src/lib/
├── badge/
├── button/
├── checkbox/
├── icon/
├── input/
├── modal/
├── price-tag/
├── product-card/
├── radio/
├── select/
├── size-selector/
├── skeleton/
├── spinner/
├── table/
├── toast/
└── toggle/
```

**16 composants exportés** : Badge, Button, Checkbox, Icon, Input, Modal, PriceTag, ProductCard, Radio, Select, SizeSelector, Skeleton, Spinner, Table, Toast, Toggle.

**Démo vivante** : `frontend/apps/storefront/src/app/features/design-system/` (HTML, SCSS, TS), route `/design-system`.

---

## 4. Actif visuel unique

| Propriété | Valeur |
| --- | --- |
| Chemin | `design1/bruny shopping/bruny shopping.png` |
| Format | PNG RVBA, 4302 × 5532 px |
| Poids | 3,4 Mo |
| SHA-256 | `9c29d15669a9af0a4290b4f56b845a1409f8c1ab4c3bff7605b5252b3e77bcbe` |
| Nature | Planche de présentation : menus, checkout, Design System, 8 écrans storefront, 4 écrans support/admin |
| Sources | Aplaties, non réutilisables |
| Exports | Aucun |

### 4.1 Zones de la planche

| Zone | Contenu | Coordonnées approximatives | Exploitation |
| --- | --- | --- | --- |
| A | Tiroir de navigation « Nouveautés » | 480, 0, 324 × 784 | Support global |
| B | Tiroir de navigation « Mocassins » | 868, 0, 324 × 784 | Support global |
| C | Tunnel de commande invité | 8, 800, 396 × 2096 | P08–P11 partiels |
| D | Planche « Design System Mobile 2025 » | 432, 800, 392 × 4308 | DSG-02 |
| E | Accueil | 852, 824, 396 × 2396 | P01 |
| F | Catalogue — Mocassins & Richelieu | 1276, 800, 392 × 1568 | P02 |
| G | Fiche produit | 1696, 800, 396 × 2272 | P04 |
| H | Panier | 2120, 800, 392 × 1276 | P06 |
| I | Commande confirmée | 2540, 800, 396 × 1912 | P12 |
| J | Suivi de commande | 2964, 800, 392 × 1904 | P13 |
| K | Espace client | 3416, 800, 396 × 1740 | P17–P21 partiels |
| L | Back-office « Atelier & Dispatch Coursiers » | 3888, 816, 392 × 2600 | A03/A06/A09/A09b partiels |

La zone D contient l’unique référence visuelle des couleurs, typographies, boutons, champs, pointures, badges et cartes produit du Design System.

---

## 5. Cartographie écran par écran

Légende :
- **MAQ** : maquette visuelle dédiée ou zone identifiable.
- **MAQ-P** : maquette partielle, groupée ou non isolable par écran.
- **SPEC** : spec textuelle complète, sans maquette.
- **ABS** : aucune maquette ni spec dédiée.
- **V2** : spec présente mais hors périmètre MVP.

### 5.1 P01–P07 — boutique (DSG-03)

| Écran | Nom | Source visuelle | Spec | Couverture |
| --- | --- | --- | --- | --- |
| P01 | Accueil | Zone E, mobile | Analyse seulement | **MAQ-P** ; 768/1280 absents |
| P02 | Catalogue | Zone F, mobile | Analyse seulement | **MAQ-P** ; filtres et 0 résultat non dessinés |
| P03 | Recherche | Aucune | **ABS** | **ABS** |
| P04 | Fiche produit | Zone G, mobile | Analyse seulement | **MAQ-P** ; états panier/stock absents |
| P05 | Guide des pointures | Aucune | **ABS** | **ABS** |
| P06 | Panier | Zone H, mobile | Analyse seulement | **MAQ-P** ; panier vide/erreurs absents |
| P07 | Mini-panier | Aucune | **ABS** | **ABS** |

**Constat DSG-03** : le dossier `docs/design/DSG-03/` n’existe pas. L’affirmation « P01–P07 validées » n’est pas traçable dans le dépôt ; seule une analyse déclare explicitement 4 écrans partiels et 3 absents.

### 5.2 P08–P13 — tunnel et suivi (DSG-04)

| Écran | Nom | Source visuelle | Spec | Statut spec |
| --- | --- | --- | --- | --- |
| P08 | Démarrage du checkout | Zone C, composite | `P08-checkout-start.md` | Rédigée, non signée |
| P09 | Coordonnées | Zone C, composite | `P09-coordonnees.md` | Rédigée, non signée |
| P10 | Livraison | Zone C, composite | `P10-livraison.md` | Rédigée, non signée |
| P11 | Paiement | Zone C, composite | `P11-paiement.md` | Rédigée, non signée |
| P11b | Attente paiement | Aucune | `P11b-attente-paiement.md` | **V2** |
| P11c | Échec paiement | Aucune | `P11c-echec-paiement.md` | **V2** |
| P12 | Commande confirmée | Zone I, mobile | `P12-confirmation.md` | Rédigée, non signée |
| P13 | Suivi public | Zone J, mobile | `P13-suivi-public.md` | Rédigée, non signée |

Les specs P08–P13 contiennent chacune les wireframes 360/768/1280 et les quatre états. La zone C ne permet pas d’isoler visuellement chaque étape.

### 5.3 P14–P27 — compte, information, erreurs (DSG-05)

| Écran | Nom | Source visuelle | Spec |
| --- | --- | --- | --- |
| P14 | Connexion | Aucune | `P14-connexion.md` |
| P15 | Inscription | Aucune | `P15-inscription.md` |
| P16 | Mot de passe oublié | Aucune | `P16-mot-de-passe-oublie.md` |
| P16b | Réinitialisation | Aucune | `P16b-reinitialisation-mot-de-passe.md` |
| P17 | Tableau de bord compte | Zone K, partielle | `P17-tableau-de-bord-compte.md` |
| P18 | Mes commandes | Zone K, partielle | `P18-commandes.md` |
| P18b | Détail commande | Aucune | `P18b-detail-commande.md` |
| P19 | Mon profil | Zone K, partielle | `P19-profil.md` |
| P19b | Suppression de compte | Aucune | `P19b-suppression-compte.md` |
| P20 | Mes adresses | Zone K, partielle | `P20-adresses.md` |
| P20b | Édition d’adresse | Aucune | `P20b-edition-adresse.md` |
| P21 | Mes favoris | Aucune | `P21-favoris.md` |
| P22 | Contact | Aucune | `P22-contact.md` |
| P23 | FAQ | Aucune | `P23-faq.md` |
| P24 | Livraison | Aucune | `P24-livraison.md` |
| P25 | Retours et échanges | Aucune | `P25-retours.md` |
| P26 | À propos | Aucune | `P26-a-propos.md` |
| P27 | Pages légales | Aucune | `P27-pages-legales.md` |
| P27b | Erreur 404 | Aucune | `P27b-erreur-404.md` |
| P27c | Erreur 500 | Aucune | `P27c-erreur-500.md` |
| P27d | Hors ligne | Aucune | `P27d-hors-ligne.md` |
| P27e | Maintenance | Aucune | `P27e-maintenance.md` |

La zone K montre un espace client unique, pas des vues dédiées pour les huit écrans de compte. Aucun écran d’authentification, d’information ou d’erreur n’est dessiné.

### 5.4 A01–A16 — back-office (DSG-06)

| Écran | Nom | Source visuelle | Spec |
| --- | --- | --- | --- |
| A01 | Connexion admin | Aucune | `A01-connexion-admin.md` |
| A02 | Vérification 2FA | Aucune | `A02-2fa.md` |
| A03 | Dashboard | Zone L, partielle | `A03-dashboard.md` |
| A04 | Liste des produits | Aucune | `A04-liste-produits.md` |
| A05 | Créer / modifier un produit | Aucune | `A05-creation-edition-produit.md` |
| A05b | Générateur de variantes | Aucune (prototype HTML) | `A05b-variant-generator.md` |
| A06 | Gestion du stock | Zone L, partielle | `A06-gestion-stock.md` |
| A07 | Liste des commandes | Aucune | `A07-liste-commandes.md` |
| A08 | Détail commande | Aucune | `A08-detail-commande.md` |
| A09 | Liste des livraisons | Zone L, partielle | `A09-liste-livraisons.md` |
| A09b | Mes livraisons du jour | Zone L, partielle | `A09b-my-deliveries.md` |
| A09c | Détail livraison | Aucune | `A09c-detail-livraison.md` |
| A10 | Liste des clients | Aucune | `A10-liste-clients.md` |
| A10b | Fiche client | Aucune | `A10b-detail-client.md` |
| A11 | Utilisateurs internes | Aucune | `A11-utilisateurs-internes.md` |
| A12 | Promotions et coupons | Aucune | `A12-promotions.md` |
| A12b | Créer / modifier un coupon | Aucune | `A12b-edition-coupon.md` |
| A13 | Avis clients | Aucune | `A13-avis-clients.md` |
| A14 | Paramètres | Aucune | `A14-parametres.md` |
| A15 | Journal d’audit | Aucune | `A15-audit-log.md` |
| A16 | Mon profil | Aucune | `A16-profil-admin.md` |

La zone L est une vue opérationnelle agrégée. Elle ne contient ni sidebar desktop, ni table, ni écran de connexion, ni la majorité des modules.

### 5.5 Design System DSG-02

| Élément | Source |
| --- | --- |
| Couleurs, typographie, boutons, champs, pointures, badges, réassurance, carte produit | Zone D de la planche PNG |
| Tokens exécutables | `frontend/libs/design-tokens/src/_tokens.scss`, `tokens.css` |
| Audit initial et contrastes | `docs/design-system/DESIGN-AUDIT.md` |
| Hypothèses non étiquetées | `docs/design-system/ASSUMPTIONS.md` |
| Référence des tokens | `docs/design-system/tokens-reference.md` |
| Démo vivante | `frontend/apps/storefront/src/app/features/design-system/` |

---

## 6. Synthèse de couverture

| Périmètre | Vues | Maquette dédiée | Maquette partielle | Spec seule | Aucune source |
| --- | ---: | ---: | ---: | ---: | ---: |
| P01–P07 | 7 | 4 | 0 | 0 | 3 |
| P08–P13 | 8 | 2 | 4 | 2 | 0 |
| P14–P27 | 22 | 0 | 4 | 18 | 0 |
| A01–A16 | 21 | 0 | 4 | 17 | 0 |
| **Total** | **58** | **6** | **12** | **37** | **3** |

**Lecture** : 6 vues ont une maquette mobile réellement identifiable, 12 s’appuient sur une maquette groupée, 37 n’ont que des specs, 3 n’ont rien. Aucune vue n’a de maquette desktop ou tablette dédiée.

Le brief parle de P01–P27 + A01–A16, soit 43 écrans numérotés. Le dépôt contient **58 vues** si l’on inclut les sous-vues P11b/P11c/P16b/P18b/P19b/P20b/P27b–e et A05b/A09b/A09c/A10b/A12b. L’audit couvrira les 58 vues et signalera les regroupements.

---

## 7. Design System existant

### 7.1 Documentation

| Fichier | Contenu | État pour DSG-07 |
| --- | --- | --- |
| `DESIGN-AUDIT.md` | Audit initial de la planche : palette, contrastes, typographie, espacements, composants, écarts, contraintes | À réutiliser, à ne pas dupliquer |
| `ASSUMPTIONS.md` | Valeurs non étiquetées et hypothèses de reconstitution | À référencer |
| `tokens-reference.md` | Référence des tokens SCSS/CSS et contrastes | À compléter avec table complète |
| `README.md` | Absent | **À créer** |
| `ACCESSIBILITY.md` | Absent | **À créer** |
| `GLOSSAIRE.md` | Absent | **À créer** |
| `COMPOSANTS.md` | Absent | **À créer** |
| `CHANGELOG.md` | Absent | **À créer** |

### 7.2 Tokens disponibles

| Famille | Valeurs principales |
| --- | --- |
| Primaire | `#131B2E` ; hover `#232F47` ; active `#0E1524` ; soft `#E6EAF1` |
| Accent | `#C89B3C` ; texte accessible `#8A6A1F` ; hover `#B0852E` ; soft `#FBF7ED` |
| Fonds | canvas `#FAFAF7`, surface `#FFFFFF`, muted `#F4F3EF`, skeleton `#F1F0ED` |
| WhatsApp | `#25D366`, strong `#0F7A40`, soft `#E7FAEE` |
| Succès | `#1E8E5A`, strong `#0F7A40`, soft `#EAF6EF` |
| Danger | `#D62839`, strong `#A31727`, soft `#FDE7E9` |
| Warning | `#B98500`, strong `#7A5B12`, soft `#FFF3D6` |
| Info | `#2F5D8A`, strong `#244A6E`, soft `#E8EDF9` |
| Texte | `#131B2E`, muted `#687087`, subtle `#6B7280`, inverse `#FFFFFF` |
| Typographie | Plus Jakarta Sans, 11 → 48 px, graisses 400–800 |
| Espacements | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px |
| Rayons | 4, 6, 8, 12, 20 px, full 999 px |
| Ombres | sm, md, lg ; focus double anneau navy |
| Cibles | 44 px ; 48 px pour la vue livreur |
| Breakpoints | 480, 768, 1024, 1280 px ; conteneur 1200 px |

**Contrastes déjà signalés comme problématiques** : or `#C89B3C` sur canvas (≈2,45:1), blanc sur WhatsApp `#25D366` (≈1,98:1), blanc sur succès `#1E8E5A` (≈4,14:1). Ces valeurs seront recalculées et documentées dans l’audit.

### 7.3 Composants existants

| Composant | Variantes / état | Limites à auditer |
| --- | --- | --- |
| Button | primary, secondary, ghost, danger, whatsapp ; sm/md/lg ; loading, disabled, iconOnly, block | Focus, contraste WhatsApp, taille icon-only |
| Input | label, aide, erreur, required | Association erreur, `aria-invalid`, placeholder |
| Select | natif | États d’erreur, libellé |
| Checkbox | — | État indéterminé |
| Radio | — | Groupe, navigation clavier |
| Toggle | — | Nom accessible, état |
| Badge | 9 variantes | Mapping métier, contraste |
| ProductCard | loading, favorite, sizes, add | Alt, CTA, troncature, cible |
| PriceTag | promo, compare-at | Format FCFA, lecture |
| SizeSelector | selected, low stock, out of stock | Couleur seule, cible 44 px |
| Modal | — | Focus trap, Échap, restitution |
| Toast | — | `aria-live`, position, empilement |
| Skeleton | — | Annonce de chargement |
| Spinner | — | Texte alternatif |
| Table | desktop | Responsive, `th scope`, tri |
| Icon | SVG | `aria-hidden`, label |

---

## 8. Patterns extraits

### 8.1 Navigation et shells

| Contexte | Pattern observé / prescrit |
| --- | --- |
| Storefront mobile | Header hamburger + logo centré + loupe + panier avec pastille |
| Fiche produit | Header retour + titre + partage + panier |
| Panier / suivi | Header retour + titre + aide |
| Barre inférieure | Présente sur P04/P06/P13, absente de P01/P02 ; périmètre non tranché |
| Checkout | Shell dédié sans bottom-nav, stepper 3 étapes, CTA sticky |
| Compte | Sidebar ≥ 1024 px, onglets 768 px, liste verticale 360 px |
| Admin | Sidebar desktop, drawer mobile, breadcrumb, header avec profil |
| Livreur | Shell mobile, KPI sticky, cartes, cibles 48 px |

### 8.2 Formulaires

- Libellé au-dessus, obligatoire signalé, aide sous le champ.
- Préfixe téléphone `+237` non éditable, 9 chiffres.
- Erreur sous le champ, bordure danger, texte explicatif.
- Validation au blur puis mise à jour à la saisie.
- Actions primaire/secondaire, barre sticky mobile pour les tunnels.
- Aucune maquette ne montre l’état focus.

### 8.3 Boutons et actions

- Primaire navy, secondaire bordé, ghost, danger, WhatsApp.
- Actions destructives avec confirmation et conséquences.
- Actions de ligne en icône avec libellé accessible obligatoire.
- Actions non autorisées masquées, pas seulement grisées (admin).
- Un seul CTA primaire par écran (DSG-04).

### 8.4 Cartes, tableaux, statuts

- Cartes blanches, bordure 1 px, radius 12 px, ombre légère, padding 16–20 px.
- Tables desktop, `CardList` mobile, aucune table à 360 px.
- Badges de statut avec texte + couleur, jamais couleur seule.
- Timeline de suivi, stepper de checkout, KPI cards admin.
- Montants proéminents, devise FCFA.

### 8.5 Ton et microtextes

- Français, vouvoiement, verbes d’action.
- Storefront chaleureux ; admin direct et opérationnel.
- Messages d’erreur expliquant la correction.
- Pas de promesse non tenue : pas de GPS temps réel, facture PDF, 2FA client ou Cercle Prestige avec avantages.
- Formats à arbitrer : `FCFA`, dates abrégées, `pointure` vs `taille`, « Ydé ».

---

## 9. Specs DSG-03 à DSG-06 relues

### 9.1 DSG-03 — P01–P07

- Aucun dossier de specs.
- `ANALYSE-MAQUETTES.md` décrit 4 écrans mobile partiels, 3 absents, aucune vue 768/1280.
- Elle relève déjà : trois libellés d’ajout au panier, « pointure/taille », « Ydé », trois formulations du paiement, contrastes or/WhatsApp, absence de focus, cibles à vérifier, textes tronqués, états manquants.
- **Décision de revue** : P01/P02/P04/P06 seront audités sur la maquette + l’analyse ; P03/P05/P07 seront marqués non auditables visuellement et couverts par des exigences de spec.

### 9.2 DSG-04 — P08–P13

Décisions structurantes :
- Tunnel linéaire P08 → P09 → P10 → P11 → P12 → P13, P08 hors décompte.
- Paiement MVP : COD uniquement ; Mobile Money désactivé ; P11b/P11c en V2.
- Référence `BRN-YYMM-XXXX`.
- Suivi public protégé par référence + téléphone ou lien signé, données masquées.
- Quatre états par écran, vues 360/768/1280 spécifiées.
- `OrderSummaryCard` unique, un CTA primaire, validation inline, cibles 44 px.
- 15 incohérences déjà listées, dont Orange Money actif sur commande COD, devise FCFA, absence de CGV, shell inconsistent.
- **Validation non signée** ; implémentation non autorisée.

### 9.3 DSG-05 — P14–P27e

Décisions structurantes :
- Auth alignée sur l’API réelle : `identifier`, e-mail seul pour l’oubli, code 6 chiffres.
- Shell compte adaptatif, header storefront avec entrée compte, footer formalisé.
- Suppression de compte à double confirmation, saisie `SUPPRIMER`, focus initial sur « Annuler ».
- Endpoints manquants listés, jamais inventés.
- Aucune promesse de facture PDF, 2FA, Cercle Prestige ou suivi GPS.
- 25 incohérences déjà listées, dont compteur de commandes faux, statuts marketing absents du backend, `isDefault` manquant.
- **Conflit résolu** : DSG-04 a été aligné sur le seed/DSG-05 à 3 000 FCFA (correction A01).
- **Validation non signée**.

### 9.4 DSG-06 — A01–A16

Décisions structurantes :
- 21 vues, pas 20 : 16 écrans + 5 sous-vues.
- Mobile 360 d’abord, desktop 1280, tables → CardList, cibles 44 px (48 px livreur).
- Actions non autorisées masquées, statuts traduits, quatre états.
- Générateur de variantes limité à 30 couleurs × 30 pointures × 300 variantes.
- A09b optimisée pour usage à moto, hors ligne, avec file d’attente idempotente.
- 29 composants spécifiés, 16 existants réutilisables, `Tabs` inexistant.
- Zone L seule référence visuelle ; aucun écran desktop, aucune table, aucun login.
- **Validation non signée** ; APIs backend largement manquantes.

---

## 10. Incohérences déjà documentées à reconfirmer

Ces points proviennent des analyses antérieures ; ils ne constituent pas encore le résultat de l’audit DSG-07.

| Source | Point | Écrans concernés |
| --- | --- | --- |
| DSG-03 | « Ajouter » / « Commander » / « Ajouter Panier » | P01, P02, P04 |
| DSG-03 | « pointure » / « taille » | P04, P05, DSG-04/05 |
| DSG-03 | « Ydé » au lieu de « Yaoundé » | P04, P06 |
| DSG-03 | Trois formulations du paiement | P01, P04, P06 |
| DSG-03 | Or sur clair insuffisant | Micro-titres, badges |
| DSG-03 | Blanc sur WhatsApp insuffisant | CTA WhatsApp |
| DSG-03 | Absence d’état focus | Tous |
| DSG-03 | Noms de produits tronqués | P01, P02, P06 |
| DSG-04 | Référence `#BS-2025-8492` vs `BRN-YYMM-XXXX` | P12, P13, zone K/L |
| DSG-04 | « Orange Money actif » sur commande COD | P12 |
| DSG-04 | Shell différents entre checkout et confirmation | P08–P13 |
| DSG-04 | Devise `FCFA` à conserver | Tous |
| DSG-05 | Compteur « 2 commandes » incohérent | Zone K / P17 |
| DSG-05 | Statuts « Livré & Essayé », « En acheminement prioritaire » absents du backend | P18b, P13 |
| DSG-05 | Facture PDF / Cercle Prestige / suivi GPS non disponibles | P17, P18b, P19 |
| DSG-05 | Yaoundé 2 000 vs 3 000 FCFA | P10, P24 |
| DSG-06 | 20 écrans annoncés vs 21 vues | Tous |
| DSG-06 | `Tabs` annoncé mais inexistant | Compte / admin |
| DSG-06 | Zone L comporte des données non modélisées (hubs, flotte, casiers) | A03, A09b |

---

## 11. Points de comparaison pour l’audit de cohérence

### 11.1 Composants

| Élément à comparer | Écrans / groupes | Question d’audit |
| --- | --- | --- |
| Bouton primaire | Tous | Même token, même hauteur, même focus, même formulation ? |
| Bouton WhatsApp | P01, P04, P06, P13, A09b | Blanc sur vert ? Variante `whatsapp-strong` ? |
| Input / Select | P09, P10, P14–P16b, P19–P20b, A01–A16 | Label, aide, erreur, focus, taille identiques ? |
| Badge de statut | P02, P06, P18b, A03–A13 | Mapping métier unique et contraste AA ? |
| ProductCard | P01, P02, P07, P21 | Même densité, mêmes CTA, mêmes infos ? |
| PriceTag | Tous | FCFA, espace insécable, promo lisible ? |
| SizeSelector | P01, P02, P04, P05 | Nom de couleur, sélection non chromatique, cible 44 px ? |
| Modal / ConfirmDialog | P07, P19b, A11, A12b | Focus trap, Échap, focus initial, restitution ? |
| Toast / Alert | P04, P06, P12, A05, A09b | Position, `aria-live`, role alert/status ? |
| DataTable / CardList | A03–A15 | Même contrat de données, mêmes actions ? |
| Timeline / Stepper | P12, P13, P08–P11 | `aria-current`, ordre, statuts traduits ? |
| Navigation | Storefront, compte, admin, livreur | Même hiérarchie, même état actif, même mobile ? |

### 11.2 Mots

| Concept | Variantes à rechercher | Forme de référence à valider |
| --- | --- | --- |
| Ajouter au panier | Ajouter / Commander / Ajouter Panier | « Ajouter au panier » |
| Continuer | Continuer / Suivant / Passer à l’étape | « Continuer » |
| Paiement | réception / livraison / Livraison | « Paiement à la livraison » |
| Devise | XAF / FCFA / sans espace | « 25 000 FCFA » |
| Date | 15/01/2025 / 15 janvier / 15 janv. | « 15 janv. 2025 » |
| Email invalide | Email / adresse email / adresse e-mail | À fixer dans le glossaire |
| Téléphone | numéro invalide / format +237 | « +237 suivi de 9 chiffres » |
| Suppression | Êtes-vous sûr / Confirmer / Voulez-vous | « Confirmer la suppression ? » |
| Pointure / taille | les deux | « pointure » pour les chaussures |
| Titre | Casse de phrase ou Title Case | Majuscule initiale |
| Stock faible | Plus que 2 ! / stock limité | « Plus que 2 en stock » |

### 11.3 Positions

| Élément | Positions à comparer | Règle à valider |
| --- | --- | --- |
| CTA principal mobile | Sticky bottom / inline / top | Sticky bottom dans les tunnels |
| Breadcrumb | Sous header / dans header / au-dessus du titre | Sous header |
| Message d’erreur | Sous champ / au-dessus / à droite | Sous champ + icône |
| Pagination | Bas centré / bas droite / top | Bas centré desktop, « Voir plus » mobile |
| Actions destructives | Rouge / texte rouge / icône | Bouton rouge + confirmation |
| Filtres | Sidebar / top bar / drawer | Top bar desktop, drawer mobile |
| Barre inférieure | Présente / absente selon écran | Périmètre à figer |
| Total / récapitulatif | Latéral desktop / empilé mobile | Latéral ≥ 1024, sticky mobile |
| Aide / guide pointure | Sous sélecteur / lien / footer | Près du sélecteur |
| Navigation compte | Sidebar / tabs / liste | Sidebar ≥ 1024, tabs 768, liste 360 |

---

## 12. Points de comparaison pour l’audit WCAG 2.1 AA

Les 51 specs DSG-04 à DSG-06 contiennent une section « Accessibilité WCAG 2.1 AA ». Les 7 vues P01–P07 n’ont pas de spec dédiée. L’audit appliquera 19 critères par vue :

1. 1.1.1 Contenu non textuel
2. 1.3.1 Information et relations
3. 1.3.2 Ordre logique
4. 1.3.5 Finalité des champs
5. 1.4.1 Utilisation de la couleur
6. 1.4.3 Contraste minimum
7. 1.4.4 Redimensionnement 200 %
8. 1.4.11 Contraste non textuel
9. 2.1.1 Clavier
10. 2.1.2 Pas de piège clavier
11. 2.4.3 Ordre de tabulation
12. 2.4.7 Focus visible
13. 2.5.5 Taille des cibles
14. 3.2.1 Au focus
15. 3.3.1 Identification des erreurs
16. 3.3.2 Étiquettes et instructions
17. 3.3.3 Suggestion après erreur
18. 4.1.2 Nom, rôle, valeur
19. 4.1.3 Messages de statut

Contrôles complémentaires :
- contrastes texte/fond calculés selon la formule WCAG ;
- contrastes des composants non textuels (boutons, focus, badges, bordures) ;
- zones tactiles ≥ 44 × 44 px, 48 px pour A09b ;
- focus visible et non masqué par les barres sticky ;
- focus trap et Échap pour Modal, BottomSheet, FilterDrawer, ConfirmDialog ;
- navigation par flèches dans radios, tabs, menus, accordéons ;
- `aria-describedby` + `aria-invalid` sur les erreurs ;
- `role="alert"` / `aria-live` pour les messages de statut ;
- alternatives aux images, icônes décoratives masquées ;
- titres hiérarchisés, un seul `h1` ;
- tableaux avec `caption`, `th scope`, `aria-sort` ;
- `prefers-reduced-motion` ;
- zoom 200 % et réouverture à 320 px ;
- absence d’information portée par la couleur seule.

---

## 13. Risques et décisions à valider

| Risque | Impact | Traitement proposé |
| --- | --- | --- |
| Une seule maquette PNG | Impossible de prouver la conformité visuelle de 50+ vues | Auditer les specs, marquer les preuves visuelles absentes |
| Aucun desktop dessiné | Les compositions 1280 ne sont pas vérifiables | Auditer les wireframes textuels et signaler la limite |
| P01–P07 sans specs | Peu de preuves pour P03/P05/P07 | Auditer l’analyse et créer des exigences minimales |
| DSG-03 absent du dépôt | La validation annoncée n’est pas traçable | Constat 🔴 dans l’audit, ticket de régularisation |
| Sources non éditables | Corrections visuelles impossibles dans cette branche | Corriger les specs/glossaire, ticket les retouches de maquette |
| Design System incomplet | Pas de README, ACCESSIBILITY, GLOSSAIRE, TOKENS, COMPOSANTS, CHANGELOG | **Corrigé par DSG-07** : 6 documents créés, 9 au total en v1.0.0 |
| Validations DSG-04/05/06 non signées | Gel sans base contractuelle complète | Inclure la signature PO dans le gel et lister les réserves |
| `ux-flows.md` absent | CA #3 non couvert | **Corrigé par DSG-07** : 6 parcours Mermaid créés |
| Conflits de livraison | Tarifs incohérents P10/P24 | **Corrigé par DSG-07** : 3 000 FCFA appliqué dans DSG-04 et DSG-05 |

### Décision de méthode soumise à validation

Je propose d’auditer :

- **visuellement** les 18 vues avec maquette dédiée ou groupée ;
- **sur specs** les 37 vues qui n’ont que du texte ;
- **en constat d’absence** P03, P05 et P07 ;
- **sans inventer** de preuve desktop, d’état ou de composant non documenté ;
- en appliquant 19 critères WCAG aux 58 vues, avec statut explicite de la preuve ;
- en corrigeant les specs et le glossaire, et en ticketant les corrections visuelles non éditables.

---

## 14. Plan proposé après validation

1. **Audit accessibilité** : 58 fiches, 19 critères, tableaux de contrastes calculés, zones tactiles, clavier, états.
2. **Audit cohérence** : composants, mots, positions, avec statut et correction.
3. **Corrections** : microtextes et specs directement ; maquettes via tickets post-gel.
4. **Glossaire** : CTA, erreurs, succès, états vides, formats FCFA/date, ton.
5. **UX flows** : 6 parcours Mermaid avec frictions, moments de vérité, erreurs et sorties.
6. **Design System v1.0.0** : README, ACCESSIBILITY, GLOSSAIRE, TOKENS, COMPOSANTS, CHANGELOG.
7. **Gel** : DESIGN-FREEZE, portée, procédure, traçabilité, changelog.
8. **Mise à jour DSG-03 à DSG-06** : liens audit, statut, référence au gel, sans supprimer d’information.
9. **Vérification finale** : 15 contrôles de livraison, Prettier, `git status` limité aux `.md`, commit unique.

---

**État au 11 novembre 2026** : plan exécuté. Les 10 documents DSG-07 et les 6 nouveaux documents du Design System sont livrés ; les vérifications et le commit sont documentés dans [`README.md`](./README.md) et [`CHANGELOG.md`](./CHANGELOG.md).
