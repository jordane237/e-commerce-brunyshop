# Audit design — maquettes BRUNY SHOPPING

> Étape 1 de la mission Design System. Source unique : `design1/bruny shopping/bruny shopping.png`.
> Date de l’audit : 23 octobre 2026.

## 1. Source analysée

| Élément         | Constat                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| Fichier         | `design1/bruny shopping/bruny shopping.png`                                                             |
| Format          | PNG RVBA, 4302 × 5532 px, 3,4 Mo                                                                        |
| Nature          | Une seule planche de présentation contenant ~13 écrans mobiles + une section « Design System Mobile »   |
| Exports séparés | Aucun (pas de PNG par écran, pas de fichier Figma, pas de JSON de tokens)                               |
| Vues desktop    | Aucune vue desktop complète ; la planche est mobile-first, avec quelques écrans back-office plus larges |
| Assets          | Logo, photos produits et icônes sont aplatis dans l’image ; aucun asset source exploitable              |
| Documentation   | Aucune spec écrite ; seules les étiquettes de la section Design System donnent des valeurs exactes      |

**Conséquence :** les valeurs explicitement étiquetées sont fiables (six couleurs, une famille typographique). Tout le reste (échelle typographique, espacements, rayons, ombres, états) doit être reconstitué par mesure et documenté dans `ASSUMPTIONS.md`.

La maquette de référence du brief est annoncée dans `/design`, mais le dossier réel du dépôt est `design1/`. Les chemins d’implémentation du brief (`src/styles/tokens/`, `src/app/shared/ui/`) ne correspondent pas au monorepo Nx existant ; la correspondance est proposée en section 8.

## 2. Inventaire des écrans

| #   | Écran                                                  | Contenu observé                                                                                                                   |
| --- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Navigation mobile (tiroir)                             | Deux états du menu : liens catalogue, « Assistance WhatsApp 237 », conseiller et horaires                                         |
| 2   | Tunnel de commande invité                              | Barre de progression 1-2-3, coordonnées, adresse de livraison, paiement, récapitulatif, CTA fixe                                  |
| 3   | Design System Mobile 2025                              | Introduction, tokens, typographie, boutons, formulaires, pointures, badges, réassurance, carte produit                            |
| 4   | Accueil / catalogue                                    | Bandeau annonce, header, hero « Collection Prestige », rayons, nouveautés, meilleures ventes, avis, garanties, footer, bottom nav |
| 5   | Fiche produit                                          | Galerie, badges, prix barré, couleurs, pointures, CTA panier + WhatsApp, description, produits similaires                         |
| 6   | Panier                                                 | Deux lignes, code promo, sous-total, livraison offerte, total, CTA, réassurance                                                   |
| 7   | Commande confirmée                                     | Numéro de commande, récapitulatif, prochaines étapes, suivi et WhatsApp                                                           |
| 8   | Suivi de commande                                      | Référence, statut, coursier, timeline, adresse et repère, total à régler, échange                                                 |
| 9   | Espace client                                          | Profil, commande active, historique, adresses, engagements, footer                                                                |
| 10  | Back-office « Atelier & Dispatch »                     | KPI, alerte stock critique, flotte de coursiers, commandes à valider                                                              |
| 11  | Back-office « Pilotage & Stocks »                      | Tableau de bord, indicateurs, stocks, commandes                                                                                   |
| 12  | Back-office « Administration — Gestion des commandes » | Liste de commandes, statuts, actions                                                                                              |
| 13  | Livreur « Mes livraisons du jour »                     | Liste mobile, montants à encaisser, appels et WhatsApp, changement de statut                                                      |

Aucun écran n’est fourni en 1280 px : les compositions desktop devront être déduites de la version mobile (grille, largeur maximale, sidebar admin).

## 3. Palette extraite

Les six couleurs ci-dessous sont **étiquetées explicitement** dans la maquette. Les ratios sont calculés selon WCAG 2.1 (sRGB).

| Token proposé                           | Hex       | Nom dans la maquette               | Usage observé                             | Contraste                                        | Verdict                      |
| --------------------------------------- | --------- | ---------------------------------- | ----------------------------------------- | ------------------------------------------------ | ---------------------------- |
| `--bs-color-primary`                    | `#131B2E` | Bleu Nuit — Primaire Prestige      | Texte, boutons principaux, footer, header | 16,41:1 sur `#FAFAF7` ; 17,16:1 blanc dessus     | AAA                          |
| `--bs-color-accent`                     | `#C89B3C` | Or Chaud — Accent Exclusif         | Petits titres, bordures, badges « Élite » | 2,45:1 sur `#FAFAF7` ; 6,71:1 sur navy           | **Échec en texte sur clair** |
| `--bs-color-accent-text` _(ajouté)_     | `#8A6A1F` | —                                  | Variante texte du doré sur fond clair     | 4,83:1 sur `#FAFAF7`                             | AA                           |
| `--bs-color-canvas`                     | `#FAFAF7` | Blanc Cassé — Canvas Chaud         | Fond général des écrans                   | —                                                | —                            |
| `--bs-color-whatsapp`                   | `#25D366` | Vert WhatsApp — Action Directe 237 | Boutons WhatsApp, icônes                  | Blanc dessus : **1,98:1** ; navy dessus : 8,65:1 | **Échec en texte blanc**     |
| `--bs-color-whatsapp-strong` _(ajouté)_ | `#0F7A40` | —                                  | CTA WhatsApp avec texte blanc             | 5,41:1 avec blanc                                | AA                           |
| `--bs-color-danger`                     | `#D62839` | Rouge Promo — Alerte & Remise      | Badges promo, erreurs, alertes            | Blanc dessus : 4,97:1                            | AA                           |
| `--bs-color-success`                    | `#1E8E5A` | Vert Succès — Validation & Stock   | Stock, validation, timeline               | Blanc dessus : 4,14:1 ; sur ivoire : 3,96:1      | AA large/UI seulement        |
| `--bs-color-success-strong` _(ajouté)_  | `#0F7A40` | —                                  | Texte blanc sur succès                    | 5,41:1                                           | AA                           |

Neutres observés (estimés, à confirmer) : blanc `#FFFFFF`, canvas chaud `#F4F3EF`, bordure `#ECE9E2`, texte secondaire `#687087` (4,72:1 sur ivoire), placeholder `#8990A0` (3,20:1, insuffisant pour du texte), surfaces d’alerte rose `#FDE7E9`, ambre `#FFF3D6`, menthe `#D1E4DC`, lavande `#E8EDF9`.

### Corrections d’accessibilité imposées par la maquette

Trois combinaisons de la maquette ne passent pas WCAG AA :

1. **Or sur fond clair** (2,45:1) : les micro-titres dorés (« MOCASSINS & RICHELIEU », « Guide ») sont illisibles pour bon nombre d’utilisateurs. Utiliser `#8A6A1F` pour le texte, réserver `#C89B3C` aux fonds navy, icônes décoratives et bordures non porteuses d’information.
2. **Blanc sur vert WhatsApp** (1,98:1) : contrairement à l’usage courant de WhatsApp, le blanc sur `#25D366` échoue largement. Deux options conformes : texte/icônes navy sur le vert vif (8,65:1), ou fond `#0F7A40` avec texte blanc (5,41:1). La seconde conserve l’identité « bouton vert » tout en restant lisible ; c’est la recommandation.
3. **Blanc sur vert succès** (4,14:1) : acceptable uniquement en grand texte (≥ 18,66 px gras ou 24 px). Pour les libellés de badge, utiliser `#0F7A40`.

Le placeholder `#8990A0` est à remplacer par `#6B7280` (4,83:1 sur blanc).

## 4. Typographie

La maquette nomme explicitement **Plus Jakarta Sans** pour les titres display. Le reste de l’interface présente les mêmes formes géométriques ; l’hypothèse d’une famille unique est retenue.

| Rôle                | Taille proposée (mobile → desktop) | Graisse | Interligne | Interlettrage        |
| ------------------- | ---------------------------------- | ------- | ---------- | -------------------- |
| Display / hero      | 38 → 48 px                         | 800     | 1,05       | −0,03 em             |
| H1                  | 30 → 38 px                         | 800     | 1,1        | −0,02 em             |
| H2 de section       | 24 → 30 px                         | 700     | 1,2        | −0,01 em             |
| H3 / titre de carte | 18 → 20 px                         | 700     | 1,3        | 0                    |
| Corps               | 15 → 16 px                         | 400/500 | 1,6        | 0                    |
| Petit texte         | 13 px                              | 400/500 | 1,5        | 0                    |
| Micro-libellé       | 11 → 12 px                         | 700     | 1,3        | +0,08 em, majuscules |
| Prix                | 22 → 24 px                         | 800     | 1,1        | −0,01 em             |

Échelle modulaire retenue : `12 · 14 · 16 · 18 · 20 · 24 · 30 · 38 · 48`. Les micro-libellés ne doivent pas descendre sous 11 px, et jamais en dessous de 12 px pour du texte porteur d’information.

**Polices :** `@fontsource/plus-jakarta-sans` ou fichiers WOFF2 auto-hébergés. Un import Google Fonts serait bloqué par la CSP du gateway (`font-src 'self' data:`), il est donc exclu.

## 5. Espacements, rayons, ombres, mouvement

Valeurs estimées à partir des écrans (base 4 px) :

- **Espacements :** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px. Gouttière de grille mobile 16 px, desktop 24 px.
- **Rayons :** contrôles 8 px, cartes 12 px, feuilles/hero 20 px, pastilles 999 px. La maquette utilise aussi 10 px sur certains boutons ; l’uniformisation à 8 px est recommandée.
- **Ombres :** carte `0 8px 24px rgb(19 27 46 / 8%)`, flottant `0 16px 40px rgb(19 27 46 / 14%)`, aucune ombre sur les boutons.
- **Bordures :** 1 px `#ECE9E2` sur les cartes ; 1 px `#DCE0E7` sur les champs.
- **Anneau de focus :** la maquette n’en montre aucun.Proposition conforme : `0 0 0 2px #FAFAF7, 0 0 0 4px #131B2E` (ratio 16,4:1), ou doré foncé `#8A6A1F` en variante. Le doré clair est exclu (2,45:1 < 3:1).
- **Mouvement :** 120 ms (micro), 180 ms (contrôles), 240 ms (panneaux) ; `cubic-bezier(0.2, 0, 0, 1)` ; tout doit être neutralisé sous `prefers-reduced-motion: reduce`.
- **Z-index :** 0 contenu, 100 sticky header, 1000 dropdown, 1050 overlay, 1060 dialog, 1100 toast.

## 6. Composants observés dans la maquette

| Composant                 | Présence    | Détails observés                                                                                                                 |
| ------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Button                    | **Oui**     | Primaire navy, WhatsApp vert, secondaire or bordé, neutre bordé, lien, icône seule ; états normal, survol, chargement, désactivé |
| Input / Form field        | **Partiel** | Téléphone avec préfixe `+237`, recherche avec icône, textarea, libellé obligatoire, helper vert ; pas d’état erreur              |
| Select / Dropdown         | **Partiel** | Sélecteur de ville, tiroir de navigation ; pas de spec de menu                                                                   |
| Checkbox / Radio / Toggle | **Partiel** | Radio de mode de paiement ; pas de checkbox ni de toggle                                                                         |
| Product Card              | **Oui**     | Badges, favori, image, catégorie, stock, prix barré, pointures, CTA                                                              |
| Size Selector             | **Oui**     | Sélectionné, disponible, alerte stock (≤ 2), épuisé barré ; pastilles 44 px                                                      |
| Badge                     | **Oui**     | Promo rouge, nouveau navy, exclusif or, dernières pièces rose, cuir bleu clair, statut commande                                  |
| Modal / Dialog            | **Partiel** | Tiroir de menu plein écran ; pas de modale centrée ni de focus trap spécifié                                                     |
| Toast                     | **Absent**  | Aucun message transitoire représenté                                                                                             |
| Table admin               | **Partiel** | Back-office mobile en cartes ; table desktop non fournie                                                                         |
| Skeleton                  | **Absent**  | Aucun squelette de chargement                                                                                                    |
| Spinner                   | **Partiel** | Bouton « Traitement sécurisé… » avec spinner                                                                                     |

Autres motifs présents mais hors des 12 obligatoires : header, bottom navigation, stepper de commande, timeline de suivi, carte KPI, carte coursier, carte adresse, bandeau de réassurance, footer.

## 7. Écarts avec l’existant

| Point        | Existant                                                  | Maquette               | Impact                            |
| ------------ | --------------------------------------------------------- | ---------------------- | --------------------------------- |
| Navy         | `#1F2A44`                                                 | `#131B2E`              | Tous les textes et boutons        |
| Or           | `#C9A227`                                                 | `#C89B3C`              | Accents, badges                   |
| Famille      | Inter (non chargée, fallback système)                     | Plus Jakarta Sans      | Identité visuelle                 |
| Rayons       | 6 / 12 / 20                                               | 8 / 12 / 20            | Contrôles                         |
| Composants   | 8 composants dans un seul fichier `catalog-components.ts` | 12 composants attendus | Refonte de `libs/ui`              |
| Tokens       | 1 fichier `index.scss` de 18 variables                    | Catalogue complet      | Extension de `libs/design-tokens` |
| Thème sombre | Non                                                       | Non spécifié           | À préparer via custom properties  |
| États        | Peu d’états hover/focus/error                             | Partiellement montrés  | À définir et documenter           |

Les pages existantes codent les couleurs en dur (`#1f2a44`, `#c9a227`, etc.). Changer les tokens ne les repeindra pas : leur migration devra être une étape distincte, sinon la maquette et la vitrine divergeront.

## 8. Correspondance avec le dépôt réel

Le brief cite `src/styles/tokens/` et `src/app/shared/ui/`. Dans ce monorepo Nx, la correspondance recommandée est :

| Brief                            | Dépôt                                                      | Raison                                                               |
| -------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------- |
| `src/styles/tokens/_tokens.scss` | `frontend/libs/design-tokens/src/_tokens.scss`             | Bibliothèque déjà importée par les deux apps et taguée `type:styles` |
| `src/styles/tokens/tokens.css`   | `frontend/libs/design-tokens/src/tokens.css`               | Même bibliothèque, importée via `index.scss`                         |
| `src/app/shared/ui/<component>/` | `frontend/libs/ui/src/lib/<component>/`                    | Partagé storefront + admin, frontières Nx respectées                 |
| Route `/design-system`           | `frontend/apps/storefront/src/app/features/design-system/` | Démo publique, lazy-loaded, sans dépendance Storybook                |
| `docs/design-system/`            | `docs/design-system/`                                      | Conforme au brief                                                    |

Storybook n’est pas installé et n’apporterait pas de valeur immédiate face à une route de démo ; il reste possible plus tard.

## 9. Contraintes techniques constatées

- **Version Angular cible : 22.2.2**, pas Angular 17. Le dépôt utilise `@angular/core` 22.2.2, `@angular/cli` 22.2.2, `@angular/build` 22.2.2, Nx 23.3.0 et TypeScript 6.0.3. Les composants seront standalone, en signals (`input()`, `output()`, `model()`), avec la syntaxe de contrôle `@if`/`@for`, et `ChangeDetectionStrategy.OnPush`. Le « Angular 17+ » du brief est un minimum : la cible réelle est la version installée.
- **Tests composants :** Vitest 4 + `jsdom`, gabarits compilés par `@analogjs/vite-plugin-angular`, TestBed zoneless (comme les apps). `pnpm -C frontend test` exécute les specs des libs. Le builder officiel `@angular/build:unit-test` reste une alternative si le plugin AnalogJS devient un frein.
- **CDK :** `@angular/cdk` n’est pas installé. Le focus trap et l’overlay peuvent être écrits à la main pour éviter une dépendance ; le brief autorise le CDK si nécessaire.
- **CSP :** le gateway autorise `style-src 'self' 'unsafe-inline'`, `img-src 'self' data: https:` et `font-src 'self' data:`. Les polices et images de démo doivent être locales.
- **Icônes :** aucune bibliothèque d’icônes ; prévoir des SVG inline dans un module `bs-icon` ou des SVG par composant.

## 10. Risques et décisions à valider

1. **Fidélité vs accessibilité :** la maquette échoue sur trois contrastes. La recommandation est de corriger (or foncé, vert WhatsApp foncé, succès foncé) et de documenter les écarts dans `ACCESSIBILITY.md`.
2. **Périmètre :** la planche ne spécifie ni Toast, ni Skeleton, ni Modal, ni Select, ni Checkbox/Radio/Toggle, ni Table desktop. Ces composants seront conçus à partir du langage visuel existant, avec hypothèses explicites.
3. **Desktop :** aucune maquette desktop. Les grilles et la table admin seront proposées en mobile-first avec largeur maximale 1200 px.
4. **Polices :** auto-hébergement nécessaire ; impact sur le poids de page et la CSP.
5. **Migration des pages existantes :** hors périmètre du Design System, à planifier séparément.

## 11. Conclusion

La maquette fournit une identité forte et cohérente — navy prestige, or, ivoire chaud, vert WhatsApp — et un socle de composants e-commerce crédible. Elle est suffisante pour construire les tokens et les composants, mais **pas pour une implémentation pixel-perfect sans hypothèses** : les états interactifs, le desktop et sept des douze composants ne sont pas spécifiés.

La prochaine étape propose donc des tokens conformes AA, puis les composants dans l’ordre du brief, avec une page `/design-system` comme référence vivante.
