# Tokens — Design System BrunyShop

**Version** : 1.0.0
**Source de vérité** : `frontend/libs/design-tokens/src/_tokens.scss` et `tokens.css`.
**Parité** : 120 variables dans chaque fichier (vérifiée le 11 novembre 2026).
**Détail exhaustif** : [`tokens-reference.md`](./tokens-reference.md).

## 1. Pipeline

```text
_tokens.scss ──► index.scss ──► styles.scss (storefront + admin)
tokens.css   ──► import global (consommateurs sans Sass)
```

- Les composants ne lisent que les custom properties `--bs-*`.
- Les alias hérités `--color-*`, `--space-*`, `--radius-*`, `--shadow-card` restent disponibles pour les pages non migrées.
- Toute modification se fait dans les deux fichiers miroir.
- Aucune valeur brute dans un composant.

## 2. Couleurs de marque

| Token | Valeur | Usage | Contraste à retenir |
|---|---|---|---|
| `--bs-color-primary` | `#131B2E` | Texte, actions primaires, footer | 16,41:1 sur canvas |
| `--bs-color-primary-hover` | `#232F47` | Survol primaire | 12,8:1 sur blanc |
| `--bs-color-primary-active` | `#0E1524` | État pressé | — |
| `--bs-color-primary-soft` | `#E6EAF1` | Fond neutre | navy 13,3:1 |
| `--bs-color-accent` | `#C89B3C` | Décor, fond navy, bordure non informative | **2,45:1 sur canvas : jamais en texte** |
| `--bs-color-accent-text` | `#8A6A1F` | Texte doré | 4,83:1 sur canvas |
| `--bs-color-accent-hover` | `#B0852E` | Survol décoratif | 3,9:1 |
| `--bs-color-accent-soft` | `#FBF7ED` | Mise en avant | — |
| `--bs-color-canvas` | `#FAFAF7` | Fond général | — |
| `--bs-color-surface` | `#FFFFFF` | Cartes, champs | — |
| `--bs-color-surface-muted` | `#F4F3EF` | Fond secondaire | — |
| `--bs-color-whatsapp` | `#25D366` | Surface WhatsApp | **1,98:1 avec blanc : interdit en texte** |
| `--bs-color-whatsapp-strong` | `#0F7A40` | CTA WhatsApp | 5,41:1 avec blanc |
| `--bs-color-whatsapp-soft` | `#E7FAEE` | Fond WhatsApp | — |
| `--bs-color-success` | `#1E8E5A` | Icônes, grandes surfaces | 4,14:1 avec blanc : grand texte seulement |
| `--bs-color-success-strong` | `#0F7A40` | Texte de succès | 5,41:1 avec blanc |
| `--bs-color-success-soft` | `#EAF6EF` | Fond succès | — |
| `--bs-color-danger` | `#D62839` | Erreur, promotion, danger | 4,97:1 avec blanc |
| `--bs-color-danger-strong` | `#A31727` | Texte d’erreur | 7,75:1 avec blanc |
| `--bs-color-danger-soft` | `#FDE7E9` | Fond d’erreur | — |
| `--bs-color-warning` | `#B98500` | Avertissement | **3,27:1 avec blanc : pas de texte blanc** |
| `--bs-color-warning-strong` | `#7A5B12` | Texte d’avertissement | 5,71:1 sur `#FFF3D6` |
| `--bs-color-warning-soft` | `#FFF3D6` | Fond d’avertissement | — |
| `--bs-color-info` | `#2F5D8A` | Information | 6,88:1 avec blanc |
| `--bs-color-info-strong` | `#244A6E` | Texte d’information | — |
| `--bs-color-info-soft` | `#E8EDF9` | Fond d’information | — |

## 3. Neutres et sémantique

| Token | Valeur | Usage |
|---|---|---|
| `--bs-color-white` | `#FFFFFF` | Surface élevée |
| `--bs-color-neutral-50` | `#FAFAF7` | Canvas |
| `--bs-color-neutral-100` | `#F4F3EF` | Surface secondaire |
| `--bs-color-neutral-150` | `#F1F0ED` | Squelette |
| `--bs-color-neutral-200` | `#ECE9E2` | Bordure de carte |
| `--bs-color-neutral-300` | `#DCE0E7` | Bordure de champ actuelle |
| `--bs-color-neutral-400` | `#C3C7D0` | Séparateur désactivé |
| `--bs-color-neutral-500` | `#8990A0` | Ancien placeholder, **non conforme en texte** |
| `--bs-color-neutral-600` | `#6B7280` | Placeholder conforme, texte discret |
| `--bs-color-neutral-700` | `#687087` | Texte secondaire |
| `--bs-color-neutral-800` | `#3B4353` | Texte fort secondaire |
| `--bs-color-neutral-900` | `#1C2333` | Texte presque noir |
| `--bs-color-neutral-950` | `#0E1524` | Noir profond |
| `--bs-color-text` | `#131B2E` | Texte principal |
| `--bs-color-text-muted` | `#687087` | Texte secondaire |
| `--bs-color-text-subtle` | `#6B7280` | Aide, placeholder |
| `--bs-color-text-inverse` | `#FFFFFF` | Texte sur navy |
| `--bs-color-border` | `#ECE9E2` | Bordure standard, décorative |
| `--bs-color-border-strong` | `#DCE0E7` | Bordure de champ actuelle |
| `--bs-color-border-focus` | `#131B2E` | Anneau de focus |
| `--bs-color-overlay` | `rgb(19 27 46 / 60%)` | Voile de modale |

> **Dette connue** : `--bs-color-border-strong` (`#DCE0E7`) n’atteint que 1,32:1 sur blanc. Le ticket DSG-07-FIX-C03 demande `#6B7280` pour les bordures de contrôle. En attendant, ne pas présenter ce token comme conforme pour délimiter un champ.

## 4. Typographie

| Token | Valeur | Usage |
|---|---|---|
| `--bs-font-family-base` | Plus Jakarta Sans, system-ui… | Corps et titres |
| `--bs-font-size-2xs` | 11 px | Micro-libellé décoratif uniquement |
| `--bs-font-size-xs` | 12 px | Légende, badge |
| `--bs-font-size-sm` | 14 px | Aide, texte compact |
| `--bs-font-size-md` | 16 px | Corps |
| `--bs-font-size-lg` | 18 px | Sous-titre |
| `--bs-font-size-xl` | 20 px | Titre de carte |
| `--bs-font-size-2xl` | 24 px | Titre de section mobile |
| `--bs-font-size-3xl` | 30 px | Titre de section desktop |
| `--bs-font-size-4xl` | 38 px | H1 mobile |
| `--bs-font-size-5xl` | 48 px | Display desktop |
| `--bs-font-weight-regular` | 400 | Corps |
| `--bs-font-weight-medium` | 500 | Emphase |
| `--bs-font-weight-semibold` | 600 | Label |
| `--bs-font-weight-bold` | 700 | Titre |
| `--bs-font-weight-extrabold` | 800 | Display, prix |
| `--bs-line-height-tight` | 1,1 | Display |
| `--bs-line-height-snug` | 1,25 | Titre |
| `--bs-line-height-normal` | 1,5 | Corps |
| `--bs-line-height-relaxed` | 1,65 | Paragraphe |
| `--bs-letter-spacing-tight` | −0,03 em | Display |
| `--bs-letter-spacing-heading` | −0,02 em | Titre |
| `--bs-letter-spacing-wide` | +0,08 em | Micro-libellé |

**Règles** : jamais moins de 12 px pour une information ; 11 px réservé aux micro-libellés décoratifs. Pas de texte justifié.

## 5. Espacements

| Token | Valeur | Token | Valeur |
|---|---|---|---|
| `--bs-space-0` | 0 | `--bs-space-8` | 32 px |
| `--bs-space-1` / `xs` | 4 px | `--bs-space-10` | 40 px |
| `--bs-space-2` / `sm` | 8 px | `--bs-space-12` / `2xl` | 48 px |
| `--bs-space-3` | 12 px | `--bs-space-16` | 64 px |
| `--bs-space-4` / `md` | 16 px | `--bs-space-lg` | 24 px |
| `--bs-space-5` | 20 px | `--bs-space-xl` | 32 px |
| `--bs-space-6` | 24 px | | |

Gouttière mobile 16 px, desktop 24 px. Conteneur maximal 1200 px.

## 6. Rayons, ombres, layout

| Token | Valeur | Usage |
|---|---|---|
| `--bs-radius-xs` | 4 px | Badge compact |
| `--bs-radius-sm` | 6 px | Petit contrôle |
| `--bs-radius-md` | 8 px | Bouton, champ |
| `--bs-radius-lg` | 12 px | Carte |
| `--bs-radius-xl` | 20 px | Feuille, hero |
| `--bs-radius-full` | 999 px | Pastille |
| `--bs-shadow-sm` | `0 1px 2px rgb(19 27 46 / 6%)` | Séparation |
| `--bs-shadow-md` | `0 8px 24px rgb(19 27 46 / 8%)` | Carte |
| `--bs-shadow-lg` | `0 16px 40px rgb(19 27 46 / 14%)` | Modale, panneau |
| `--bs-shadow-focus` | double anneau navy | Focus |
| `--bs-container-max` | 1200 px | Contenu |
| `--bs-touch-target` | 44 px | Cible minimale |
| `--bs-control-height-sm` | 36 px | Bouton compact |
| `--bs-control-height-md` | 44 px | Contrôle standard |
| `--bs-control-height-lg` | 52 px | CTA principal |

## 7. Focus, z-index, mouvement

| Token | Valeur |
|---|---|
| `--bs-color-border-focus` | `#131B2E` |
| `--bs-z-sticky` | 100 |
| `--bs-z-dropdown` | 1000 |
| `--bs-z-overlay` | 1040 |
| `--bs-z-modal` | 1050 |
| `--bs-z-toast` | 1100 |
| `--bs-duration-fast` | 120 ms |
| `--bs-duration-base` | 180 ms |
| `--bs-duration-slow` | 240 ms |
| `--bs-easing-standard` | `cubic-bezier(0.2, 0, 0, 1)` |
| `--bs-easing-in` | `cubic-bezier(0.4, 0, 1, 1)` |
| `--bs-easing-out` | `cubic-bezier(0, 0, 0.2, 1)` |

Anneau de focus : `0 0 0 2px #FAFAF7, 0 0 0 4px #131B2E`.

## 8. Règles d’usage

1. `--bs-color-accent` n’est **jamais** un texte sur fond clair.
2. `--bs-color-whatsapp` n’est **jamais** un fond de texte blanc.
3. `--bs-color-success` n’est **jamais** un fond de texte blanc en taille normale.
4. `--bs-color-warning` n’est **jamais** un fond de texte blanc.
5. Une bordure de contrôle atteint 3:1 ; sinon, le contrôle a un fond ou un contour suffisant.
6. `--bs-color-neutral-500` est interdit pour un placeholder.
7. Toute cible interactive respecte `--bs-touch-target`.
8. Tout focus utilise `--bs-shadow-focus` ou `bs-focus-ring`.
9. Toute animation est neutralisée sous `prefers-reduced-motion`.
10. Aucun token n’est dupliqué en dur dans un composant.

## 9. Vérification de parité

```bash
grep -o -- '--bs-[a-z0-9-]*:' frontend/libs/design-tokens/src/tokens.css | sort -u | wc -l
grep -o -- '--bs-[a-z0-9-]*:' frontend/libs/design-tokens/src/_tokens.scss | sort -u | wc -l
```

Attendu : **120** et **120**. Toute divergence est un défaut bloquant.
