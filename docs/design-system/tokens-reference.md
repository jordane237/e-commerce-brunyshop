# Référence des tokens

Source : `frontend/libs/design-tokens/src/_tokens.scss` et `tokens.css`.
Toute valeur non étiquetée dans la maquette est justifiée dans `ASSUMPTIONS.md`.

## Branchement

Deux fichiers miroir, mêmes noms de variables :

| Fichier        | Consommateur                            | Usage                                                                                                   |
| -------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `_tokens.scss` | Applications Angular et composants SCSS | `@use 'libs/design-tokens/src/index.scss';` (déjà fait dans les deux `styles.scss`), puis `var(--bs-…)` |
| `tokens.css`   | Tout consommateur sans Sass             | Import global ; aucune dépendance                                                                       |

- Les composants de `@bruny/ui` ne lisent **que** les custom properties `--bs-*` : ils restent agnostiques du build Sass.
- `index.scss` émet aussi les alias hérités `--color-ink`, `--color-accent`, `--space-*`, `--radius-*`, `--shadow-card` utilisés par les pages existantes.
- La police `Plus Jakarta Sans` est auto-hébergée avec `@fontsource-variable/plus-jakarta-sans` (importée dans les `styles.scss`) ; la CSP interdit Google Fonts.
- Mixins Sass disponibles : `bs-media-up($breakpoint)`, `bs-focus-ring`, `bs-reduced-motion`, `bs-sr-only`, `bs-text-truncate`.

Toute modification de valeur se fait dans `_tokens.scss`, puis se reporte dans `tokens.css` (le contrôle de parité se fait par comparaison des 120 variables).

## Couleurs de marque

| Token CSS                     | Valeur    | Usage                                        | Contraste                |
| ----------------------------- | --------- | -------------------------------------------- | ------------------------ |
| `--bs-color-primary`          | `#131B2E` | Texte principal, boutons primaires, footer   | 16,41:1 sur canvas       |
| `--bs-color-primary-hover`    | `#232F47` | Survol des actions primaires                 | 12,8:1 sur blanc         |
| `--bs-color-primary-active`   | `#0E1524` | État pressé                                  | —                        |
| `--bs-color-primary-soft`     | `#E6EAF1` | Fonds d’informations neutres                 | Texte navy 13,3:1        |
| `--bs-color-accent`           | `#C89B3C` | Décor, fonds navy, bordures non informatives | 6,71:1 sur navy          |
| `--bs-color-accent-text`      | `#8A6A1F` | Texte doré sur fond clair                    | 4,83:1 sur canvas        |
| `--bs-color-accent-hover`     | `#B0852E` | Survol doré                                  | 3,9:1 sur canvas (décor) |
| `--bs-color-accent-soft`      | `#FBF7ED` | Fond de mise en avant                        | —                        |
| `--bs-color-canvas`           | `#FAFAF7` | Fond général                                 | —                        |
| `--bs-color-surface`          | `#FFFFFF` | Cartes, champs, feuilles                     | —                        |
| `--bs-color-surface-muted`    | `#F4F3EF` | Fonds secondaires                            | —                        |
| `--bs-color-surface-skeleton` | `#F1F0ED` | Squelettes                                   | —                        |
| `--bs-color-whatsapp`         | `#25D366` | Surface WhatsApp uniquement                  | Texte navy 8,65:1        |
| `--bs-color-whatsapp-strong`  | `#0F7A40` | CTA WhatsApp avec texte blanc                | 5,41:1 avec blanc        |
| `--bs-color-whatsapp-soft`    | `#E7FAEE` | Fond de confirmation WhatsApp                | —                        |
| `--bs-color-success`          | `#1E8E5A` | Icônes, grandes surfaces de succès           | 3,96:1 sur canvas        |
| `--bs-color-success-strong`   | `#0F7A40` | Texte de succès                              | 5,41:1 avec blanc        |
| `--bs-color-success-soft`     | `#EAF6EF` | Fond de succès                               | —                        |
| `--bs-color-danger`           | `#D62839` | Erreurs, promotions                          | 4,97:1 avec blanc        |
| `--bs-color-danger-strong`    | `#A31727` | Texte d’erreur sur clair                     | 7,2:1 sur canvas         |
| `--bs-color-danger-soft`      | `#FDE7E9` | Fond d’erreur                                | —                        |
| `--bs-color-warning`          | `#B98500` | Avertissements                               | 4,6:1 sur canvas         |
| `--bs-color-warning-strong`   | `#7A5B12` | Texte d’avertissement                        | 6,03:1 sur canvas        |
| `--bs-color-warning-soft`     | `#FFF3D6` | Fond d’avertissement                         | —                        |
| `--bs-color-info`             | `#2F5D8A` | Informations                                 | 6,6:1 sur canvas         |
| `--bs-color-info-strong`      | `#244A6E` | Texte d’information                          | 9,0:1 sur canvas         |
| `--bs-color-info-soft`        | `#E8EDF9` | Fond d’information                           | —                        |

## Neutres

| Token                    | Valeur    | Usage                                           |
| ------------------------ | --------- | ----------------------------------------------- |
| `--bs-color-white`       | `#FFFFFF` | Surfaces élevées                                |
| `--bs-color-neutral-50`  | `#FAFAF7` | Canvas                                          |
| `--bs-color-neutral-100` | `#F4F3EF` | Surface secondaire                              |
| `--bs-color-neutral-150` | `#F1F0ED` | Squelette                                       |
| `--bs-color-neutral-200` | `#ECE9E2` | Bordure de carte                                |
| `--bs-color-neutral-300` | `#DCE0E7` | Bordure de champ                                |
| `--bs-color-neutral-400` | `#C3C7D0` | Séparateurs désactivés                          |
| `--bs-color-neutral-500` | `#8990A0` | Placeholder (non conforme texte : utiliser 600) |
| `--bs-color-neutral-600` | `#6B7280` | Placeholder conforme, texte discret             |
| `--bs-color-neutral-700` | `#687087` | Texte secondaire (4,72:1)                       |
| `--bs-color-neutral-800` | `#3B4353` | Texte fort secondaire                           |
| `--bs-color-neutral-900` | `#1C2333` | Texte presque noir                              |
| `--bs-color-neutral-950` | `#0E1524` | Noir profond                                    |

## Sémantique

| Token                      | Valeur                | Usage               |
| -------------------------- | --------------------- | ------------------- |
| `--bs-color-text`          | `#131B2E`             | Texte principal     |
| `--bs-color-text-muted`    | `#687087`             | Texte secondaire    |
| `--bs-color-text-subtle`   | `#6B7280`             | Aides, placeholders |
| `--bs-color-text-inverse`  | `#FFFFFF`             | Texte sur navy      |
| `--bs-color-border`        | `#ECE9E2`             | Bordure standard    |
| `--bs-color-border-strong` | `#DCE0E7`             | Bordure de champ    |
| `--bs-color-border-focus`  | `#131B2E`             | Anneau de focus     |
| `--bs-color-overlay`       | `rgb(19 27 46 / 60%)` | Voile de modale     |

## Typographie

| Token                         | Valeur                        | Usage                     |
| ----------------------------- | ----------------------------- | ------------------------- |
| `--bs-font-family-base`       | Plus Jakarta Sans, system-ui… | Corps et titres           |
| `--bs-font-size-2xs`          | 11 px                         | Micro-libellés uniquement |
| `--bs-font-size-xs`           | 12 px                         | Légendes, badges          |
| `--bs-font-size-sm`           | 14 px                         | Aides, texte compact      |
| `--bs-font-size-md`           | 16 px                         | Corps standard            |
| `--bs-font-size-lg`           | 18 px                         | Sous-titres               |
| `--bs-font-size-xl`           | 20 px                         | Titre de carte            |
| `--bs-font-size-2xl`          | 24 px                         | Titre de section mobile   |
| `--bs-font-size-3xl`          | 30 px                         | Titre de section desktop  |
| `--bs-font-size-4xl`          | 38 px                         | H1 / display mobile       |
| `--bs-font-size-5xl`          | 48 px                         | Display desktop           |
| `--bs-font-weight-regular`    | 400                           | Corps                     |
| `--bs-font-weight-medium`     | 500                           | Emphase légère            |
| `--bs-font-weight-semibold`   | 600                           | Labels                    |
| `--bs-font-weight-bold`       | 700                           | Titres                    |
| `--bs-font-weight-extrabold`  | 800                           | Display, prix             |
| `--bs-line-height-tight`      | 1,1                           | Display                   |
| `--bs-line-height-snug`       | 1,25                          | Titres                    |
| `--bs-line-height-normal`     | 1,5                           | Corps                     |
| `--bs-line-height-relaxed`    | 1,65                          | Paragraphes longs         |
| `--bs-letter-spacing-tight`   | −0,03 em                      | Display                   |
| `--bs-letter-spacing-heading` | −0,02 em                      | Titres                    |
| `--bs-letter-spacing-wide`    | +0,08 em                      | Micro-libellés majuscules |

## Espacements

| Token                 | Valeur | Token                   | Valeur |
| --------------------- | ------ | ----------------------- | ------ |
| `--bs-space-0`        | 0      | `--bs-space-8`          | 32 px  |
| `--bs-space-1` / `xs` | 4 px   | `--bs-space-10`         | 40 px  |
| `--bs-space-2` / `sm` | 8 px   | `--bs-space-12` / `2xl` | 48 px  |
| `--bs-space-3`        | 12 px  | `--bs-space-16`         | 64 px  |
| `--bs-space-4` / `md` | 16 px  | `--bs-space-lg`         | 24 px  |
| `--bs-space-5`        | 20 px  | `--bs-space-xl`         | 32 px  |
| `--bs-space-6`        | 24 px  |                         |        |

## Rayons, ombres, layout

| Token                    | Valeur                            | Usage                             |
| ------------------------ | --------------------------------- | --------------------------------- |
| `--bs-radius-xs`         | 4 px                              | Badges compacts                   |
| `--bs-radius-sm`         | 6 px                              | Petits contrôles                  |
| `--bs-radius-md`         | 8 px                              | Boutons, champs, cartes compactes |
| `--bs-radius-lg`         | 12 px                             | Cartes                            |
| `--bs-radius-xl`         | 20 px                             | Feuilles, hero                    |
| `--bs-radius-full`       | 999 px                            | Pastilles                         |
| `--bs-shadow-sm`         | `0 1px 2px rgb(19 27 46 / 6%)`    | Séparation légère                 |
| `--bs-shadow-md`         | `0 8px 24px rgb(19 27 46 / 8%)`   | Carte                             |
| `--bs-shadow-lg`         | `0 16px 40px rgb(19 27 46 / 14%)` | Modale, panneau                   |
| `--bs-shadow-focus`      | double anneau navy                | Focus visible                     |
| `--bs-container-max`     | 1200 px                           | Largeur de contenu                |
| `--bs-touch-target`      | 44 px                             | Cible tactile minimale            |
| `--bs-control-height-sm` | 36 px                             | Bouton compact                    |
| `--bs-control-height-md` | 44 px                             | Contrôle standard                 |
| `--bs-control-height-lg` | 52 px                             | CTA principal                     |

## Z-index

| Token             | Valeur | Usage         |
| ----------------- | ------ | ------------- |
| `--bs-z-sticky`   | 100    | Header sticky |
| `--bs-z-dropdown` | 1000   | Menus         |
| `--bs-z-overlay`  | 1040   | Voile         |
| `--bs-z-modal`    | 1050   | Modale        |
| `--bs-z-toast`    | 1100   | Notifications |

## Mouvement

| Token                  | Valeur                       |
| ---------------------- | ---------------------------- |
| `--bs-duration-fast`   | 120 ms                       |
| `--bs-duration-base`   | 180 ms                       |
| `--bs-duration-slow`   | 240 ms                       |
| `--bs-easing-standard` | `cubic-bezier(0.2, 0, 0, 1)` |
| `--bs-easing-in`       | `cubic-bezier(0.4, 0, 1, 1)` |
| `--bs-easing-out`      | `cubic-bezier(0, 0, 0.2, 1)` |

## Règles d’usage

- Ne jamais utiliser `--bs-color-accent` pour du texte sur fond clair : utiliser `--bs-color-accent-text`.
- Ne jamais poser de texte blanc sur `--bs-color-whatsapp` : utiliser `--bs-color-whatsapp-strong` en fond, ou du texte navy sur le vert vif.
- Le vert `--bs-color-success` est réservé aux grandes icônes et aux fonds ; le texte utilise `--bs-color-success-strong`.
- Toute zone interactive respecte `min-height: var(--bs-touch-target)`.
- Tout élément focusable utilise `--bs-shadow-focus` ou le mixin `bs-focus-ring`.
- Les animations respectent `prefers-reduced-motion`.
