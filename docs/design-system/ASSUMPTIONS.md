# Hypothèses de design — BRUNY SHOPPING

> Toute valeur absente de `design1/bruny shopping/bruny shopping.png` est consignée ici.
> Statut : étape 2 (tokens et composants livrés). Ces hypothèses restent à confirmer avec l’équipe design.

## Source et structure

| ID  | Hypothèse                                                                                                       | Justification                                    | Impact                                  |
| --- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------- |
| A01 | `design1/` est la source de vérité visuelle à la place de `/design`                                             | Le dossier `/design` n’existe pas dans le dépôt  | Chemins de documentation                |
| A02 | Le brief est adapté au monorepo : tokens dans `frontend/libs/design-tokens`, composants dans `frontend/libs/ui` | Structure Nx existante, partage storefront/admin | Arborescence des livrables              |
| A03 | La planche est une référence d’intention, pas une spec pixel-perfect                                            | Une seule image, aucun export par écran          | Tolérance de mesure                     |
| A04 | Les écrans sont mobiles-first ; aucune maquette desktop n’existe                                                | Constat sur la planche                           | Grilles desktop déduites                |
| A05 | Les photos produits et le logo ne sont pas extraits de la planche                                               | Assets aplatis, qualité insuffisante             | Utilisation de visuels de démonstration |

## Couleurs

| ID  | Hypothèse                                                | Valeur retenue                                                                                                  | Justification                                     |
| --- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| A06 | Six couleurs de marque sont certaines                    | `#131B2E`, `#C89B3C`, `#FAFAF7`, `#25D366`, `#D62839`, `#1E8E5A`                                                | Étiquetées dans la maquette                       |
| A07 | Le doré clair ne doit pas servir de texte sur fond clair | Texte : `#8A6A1F` ; décor : `#C89B3C`                                                                           | 2,45:1 mesuré, échec AA                           |
| A08 | Le vert WhatsApp avec texte blanc doit être foncé        | `#0F7A40` pour le fond des CTA                                                                                  | 5,41:1 avec blanc                                 |
| A09 | Le vert succès avec texte blanc doit être foncé          | `#0F7A40` pour les badges texte                                                                                 | 4,14:1 insuffisant en texte normal                |
| A10 | Neutres dérivés des aplats                               | `#FFFFFF`, `#F4F3EF`, `#ECE9E2`, `#687087`, `#6B7280` (placeholder), `#FDE7E9`, `#FFF3D6`, `#D1E4DC`, `#E8EDF9` | Valeurs observées, non étiquetées                 |
| A11 | L’état d’erreur utilise le rouge promo                   | `#D62839`                                                                                                       | Seul rouge de la maquette, contraste blanc 4,97:1 |
| A12 | L’état d’avertissement utilise l’ambre                   | Fond `#FFF3D6`, texte `#7A5B12`                                                                                 | Cohérent avec les alertes stock                   |
| A13 | L’état d’information utilise un bleu ardoise             | `#2F5D8A` sur `#E8EDF9`                                                                                         | Absent de la maquette, cohérent avec le navy      |
| A14 | Aucun thème sombre n’est livré                           | La maquette n’en montre pas                                                                                     | Tokens structurés pour un ajout futur             |

## Typographie

| ID  | Hypothèse                           | Valeur retenue                                                                                                 |
| --- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| A15 | Famille unique pour titres et corps | Plus Jakarta Sans                                                                                              |
| A16 | Chargement de la police             | Auto-hébergée via `@fontsource-variable/plus-jakarta-sans`, fallback `system-ui` (CSP `font-src 'self' data:`) |
| A17 | Échelle                             | 12, 14, 16, 18, 20, 24, 30, 38, 48 px                                                                          |
| A18 | Graisses                            | 400, 500, 600, 700, 800                                                                                        |
| A19 | Interlettrage display               | −0,03 em ; micro-libellés +0,08 em                                                                             |
| A20 | Taille minimale du texte informatif | 12 px ; 11 px réservé aux micro-libellés décoratifs                                                            |

## Espacements et formes

| ID  | Hypothèse                      | Valeur retenue                                                                    |
| --- | ------------------------------ | --------------------------------------------------------------------------------- |
| A21 | Base d’espacement              | 4 px, échelle 4/8/12/16/20/24/32/40/48/64                                         |
| A22 | Gouttières                     | 16 px mobile, 24 px desktop                                                       |
| A23 | Rayons                         | 8 px contrôles, 12 px cartes, 20 px feuilles, 999 px pastilles                    |
| A24 | Hauteur minimale des contrôles | 44 px (48 px pour les champs de saisie)                                           |
| A25 | Ombres                         | carte `0 8px 24px rgb(19 27 46 / 8%)`, flottant `0 16px 40px rgb(19 27 46 / 14%)` |
| A26 | Anneau de focus                | `0 0 0 2px #FAFAF7, 0 0 0 4px #131B2E`                                            |
| A27 | Breakpoints                    | 480 / 768 / 1024 / 1280 px                                                        |
| A28 | Largeur maximale de contenu    | 1200 px                                                                           |
| A29 | Mouvement                      | 120 / 180 / 240 ms, `cubic-bezier(0.2, 0, 0, 1)`                                  |
| A30 | Z-index                        | 100 sticky, 1000 dropdown, 1050 overlay, 1060 dialog, 1100 toast                  |

## Composants non spécifiés

| ID  | Hypothèse                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A31 | Select : `<select>` natif stylisé (clavier, lecteurs d’écran et mobile gratuits) ; menu custom uniquement si un besoin de listes très longues apparaît |
| A32 | Checkbox et radio : 20 px visuels, zone tactile 44 px via le label                                                                                     |
| A33 | Toggle : piste 44 × 24 px, zone tactile 44 px, état annoncé par `role="switch"`                                                                        |
| A34 | Modal : largeur maximale 560 px, overlay `rgb(19 27 46 / 60%)`, focus trap et restitution du focus                                                     |
| A35 | Toast : empilement en bas à droite (desktop) et bas de l’écran (mobile), `aria-live="polite"`, fermeture 5 s                                           |
| A36 | Table admin : version desktop avec tri et pagination ; version mobile en cartes empilées                                                               |
| A37 | Skeleton : fond `#F1F0ED`, animation de pulsation désactivée en `prefers-reduced-motion`                                                               |
| A38 | Spinner : 20 px, bordure 2 px, animation 600 ms                                                                                                        |
| A39 | Table : colonne d’actions alignée à droite, ligne cliquable uniquement si une action explicite existe                                                  |
| A40 | Badges de statut : couleur + texte + icône, jamais la couleur seule                                                                                    |

## Implémentation

| ID  | Hypothèse                                                                                                                                                                  |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A41 | Pas de Storybook : route `/design-system` dans le storefront                                                                                                               |
| A42 | Pas de librairie UI externe ; SVG inline pour les icônes                                                                                                                   |
| A49 | Cible Angular 22.2.2 (standalone, signals, `@if`/`@for`, `OnPush`), pas Angular 17                                                                                         |
| A43 | Pas de CDK : focus trap et overlay implémentés manuellement                                                                                                                |
| A44 | Tests composants : Vitest 4 + `jsdom` + `@analogjs/vite-plugin-angular` (compilation des gabarits), TestBed zoneless comme les apps ; `pnpm -C frontend test`              |
| A45 | Seuls le catalogue et la fiche produit consomment les nouveaux composants ; les autres pages gardent leurs styles hérités, les alias `--color-*` assurant la compatibilité |
| A46 | Les montants restent formatés par `FcfaPipe` (entiers XAF)                                                                                                                 |
| A47 | Les textes d’interface sont en français, les noms techniques et commentaires en anglais                                                                                    |
| A48 | Les images de démo utilisent les URL du seed ou des placeholders locaux, jamais des captures de la planche                                                                 |
