# MKT-04 — Analyse design et existant

Ticket : `[MKT-04] Pixel Meta, UTM et bandeau de consentement`
Branche : `feature/MKT-04-meta-pixel-utm-consent`
Date : 18 novembre 2026

## 1. Sources et réalité du dépôt

Le prompt mentionne `projects/shop`, `@brunyshop/*`, Angular 17-19 et un `environment.ts`.
Le dépôt réel utilise :

| Élément | Réalité |
| --- | --- |
| Application boutique | `frontend/apps/storefront/` |
| Alias | `@bruny/core`, `@bruny/ui`, `@bruny/data-access`, `@bruny/util` |
| Angular | 22.2.2, zoneless |
| Config | `core/app-config.ts` (`APP_CONFIG`), aucun `environment.ts` |
| Tests unitaires | Vitest + jsdom |
| Tests e2e | Playwright |

Aucun package Pixel, GTM, GA ou cookie consent n'est installé. L'intégration utilise
le snippet officiel Meta, sans dépendance supplémentaire.

## 2. Design existant

### 2.1 Fichiers localisés

`/design` et `/design-1` n'existent pas. Les sources sont :

| Chemin | Contenu |
| --- | --- |
| `design1/bruny shopping/bruny shopping.png` | Planche unique 4302 × 5532 |
| `docs/design-1/ANALYSE-MAQUETTES.md` | Cartographie des zones A à L |
| `docs/design/DSG-04/P08…P13.md` | Specs du tunnel, non implémenté |
| `docs/design/DSG-05/P27-pages-legales.md` | Spec des pages légales |
| `docs/design/DSG-05/CONTENUS.md` | Contenus P27 |
| `frontend/libs/design-tokens/src/_tokens.scss` | Tokens DSG-02 |

| Page | Maquette | Implémentation |
| --- | --- | --- |
| P01 Accueil | Zone E | Oui |
| P02 Catalogue | Zone F | Oui |
| P04 Fiche produit | Zone G | Oui |
| P06 Panier | Zone H | Oui |
| P08–P11 Checkout | Zone C + specs | **Non** |
| P12 Confirmation | Zone I + spec | **Non** |
| P13 Suivi | Zone J + spec | **Non** |

### 2.2 Bandeau de consentement

Aucun design de bandeau n'existe. P27 précise que le bandeau, s'il est ajouté, est global.
Le bandeau a donc été conçu avec les tokens DSG-02 :

- **Mobile 360** : barre fixe en bas, pleine largeur, fond surface, bordure haute,
  ombre `--bs-shadow-lg`, padding 16 px, boutons sur deux colonnes.
- **≥ 768 px** : texte à gauche, actions à droite.
- **Z-index** : `--bs-z-consent: 1041`, au-dessus de la sticky buy bar (100), sous
  le modal (1050) et le toast (1100).
- **Préférences** : `bruny-modal` (focus trap, Échap, `aria-modal`) et
  `bruny-checkbox`.
- **Égalité des choix** : « Refuser » et « Accepter » ont le même poids visuel.
- **Sémantique** : le bandeau est une `role="region"` nommée, pas un dialogue modal,
  car il ne bloque pas la navigation. Le panneau de préférences reste le seul dialogue
  modal. C'est un écart assumé par rapport au libellé initial du ticket.

### 2.3 Microtextes

DSG-07 ne contient aucun texte cookies. Les textes suivants ont été ajoutés et restent
à valider par le propriétaire :

- « Nous respectons votre vie privée »
- « Nous utilisons des cookies et le Pixel Meta pour mesurer l’efficacité de nos
  publicités et améliorer votre expérience. Vous pouvez accepter, refuser ou
  personnaliser vos choix. »
- « En savoir plus » → `/politique-confidentialite`
- « Personnaliser », « Refuser », « Accepter »
- « Gérer mes préférences »
- « Cookies essentiels », « Mesure d’audience », « Publicité (Pixel Meta) »
- « Annuler », « Enregistrer mes choix »
- « Gérer mes préférences cookies » (pied de page)

Ton vouvoiement, pas de jargon, montants XAF existants.

### 2.4 Tokens utilisés

- `--bs-color-primary` `#131B2E`
- `--bs-color-accent` `#C89B3C`
- `--bs-color-surface` `#FFFFFF`
- `--bs-color-text-muted` `#687087`
- `--bs-color-border` `#ECE9E2`
- `--bs-space-sm|md|lg|4`
- `--bs-radius-md|lg|full`
- `--bs-shadow-lg`, `--bs-shadow-focus`
- `--bs-touch-target` 44 px
- `--bs-z-consent` 1041
- Breakpoints 360 / 768 / 1280

## 3. Points de contact Pixel

| Événement | Point prévu | État |
| --- | --- | --- |
| PageView | Initialisation + `NavigationEnd` | Implémenté |
| ViewContent | `ProductDetailPage`, après chargement | Implémenté |
| AddToCart | `ProductDetailPage`, après ajout réussi | Implémenté |
| InitiateCheckout | P08/P11 | Méthode prête, aucun écran |
| Purchase | P12 | Méthode prête, aucun écran |

Les ajouts rapides depuis P01/P02 passent par `CartStore.addProduct` et ne sont pas
instrumentés : le ticket ne demande que P04. Risque de sous-comptage documenté.

## 4. Écarts et décisions

| Écart | Décision |
| --- | --- |
| Tunnel P08–P12 absent | Aucun faux hook ; services prêts et documentés |
| `_orders` client absent | Delta backend et UtmService prêts pour le futur P11 |
| `Order.source` ne contenait que IP/User-Agent | Fusion avec les UTMs, sans écrasement |
| CSP bloquait `connect.facebook.net` | CSP gateway mise à jour |
| Bandeau non modal | `role="region"` sur le bandeau, modal pour les préférences |
| `bruny-checkbox` double-toggle | `for` redondant retiré du label imbriqué |
| ID Pixel absent | Placeholder `CHANGEME_meta_pixel_id` |
| Pixel Helper non exécutable sans ID | Procédure documentée dans `TEST-PIXEL.md` |

## 5. Contenu P27 mis à jour

La section « Cookies et traceurs » décrit désormais :

- les cookies essentiels (session, panier, sécurité, consentement) ;
- la mesure d’audience soumise au consentement ;
- le Pixel Meta et les cookies `_fbp` / `_fbc` ;
- les données techniques transmises et l’absence de nom, e-mail, téléphone ou adresse ;
- la durée de 13 mois et la gestion depuis le pied de page ;
- le retrait du consentement et la suppression des cookies Meta ;
- la validation juriste restant à faire (CNT-03).
