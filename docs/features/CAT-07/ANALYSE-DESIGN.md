# CAT-07 — Analyse design (page d’accueil)

**Ticket** : `[CAT-07] Page d’accueil de la boutique`
**Branche** : `feature/CAT-07-home-page`
**Sources** : `docs/design-1/ANALYSE-MAQUETTES.md` (analyse de la planche), `docs/design/DSG-07/GLOSSAIRE-MICROTEXTES.md`, `docs/design/DSG-03/README.md`, tokens `frontend/libs/design-tokens/src/_tokens.scss`.

## 1. État réel de la source design

| Élément | Constat |
| --- | --- |
| Fichier P01 | Planche unique `design1/bruny shopping/bruny shopping.png` — zone **E** (852, 824, 396 × 2396) |
| Export par écran | Aucun (pas de SVG/PDF/Figma) |
| Spec écrite `docs/design/DSG-03/P01-*.md` | **Inexistante** — `DSG-03/README.md` le confirme |
| Breakpoints 768 / 1280 | **Aucune maquette** |
| États (chargement, erreur, vide) | **Aucun dessiné** |

Conséquence : le critère 1 (« conforme à la maquette P01 ») ne peut être validé que sur la
structure mobile extraite de l’analyse de planche. Les déclinaisons desktop et les états
sont des décisions d’implémentation, pas une conformité maquette.

## 2. Structure P01 extraite (zone E, ~390 px)

De haut en bas, tel que documenté dans `docs/design-1/ANALYSE-MAQUETTES.md` §6 :

1. En-tête : hamburger, loupe, logo « BRUNY SHOPPING », panier avec pastille.
2. Hero éditorial sur photo sombre : badge « ÉDITION DOUALA & YAOUNDÉ 2025 », titre,
   paragraphe, CTA blanc « Découvrir la Collection → », CTA WhatsApp vert, deux réassurances.
3. « Rayons Phares » : cinq pastilles photo (Mocassins, Richelieu, Sneakers, Bottines,
   Femme Chic) en défilement horizontal + lien « Catalogue 2025 ».
4. « Nouveautés de la Semaine » : grille 2 colonnes, badges, notes, prix barrés, pointures,
   lien « Voir tout › ».
5. « Garanties Bruny Shopping » : trois cartes (paiement, livraison, échange).
6. « Meilleures Ventes » : grille 2 colonnes, badges « BEST-SELLER » / « EXCLUSIF ».
7. Avis client, bandeau concierge (hors périmètre du ticket).
8. Pied de page + barre inférieure.

Le ticket demande aussi une section « Promotions » et un lien Facebook : absents de la
planche, présents dans le périmètre fonctionnel du ticket.

## 3. Microtextes utilisés

Aucun texte marketing inventé. Les libellés proviennent de la planche (via l’analyse) ou
du glossaire DSG-07 :

| Emplacement | Texte | Origine |
| --- | --- | --- |
| Badge hero | « Édition Douala & Yaoundé 2025 » | planche |
| CTA principal | « Découvrir la Collection » | planche (« Découvrir la Collection → ») |
| CTA WhatsApp | « Nous contacter » | en-tête existant du storefront |
| Ligne hero | « Prix en FCFA · Livraison à Douala et Yaoundé. » | pied de page existant + glossaire (« Livraison ») |
| Pastilles | « Rayons Phares », « Catalogue 2025 » | planche |
| Sections | « Nouveautés de la Semaine », « Meilleures Ventes », « Promotions » | planche + ticket |
| Lien section | « Voir tout › » | planche |
| Réassurance | « Garanties Bruny Shopping » + 4 items | planche (3 cartes) + « Support WhatsApp » du ticket |
| Facebook | « Suivez-nous sur Facebook » | ticket |
| Erreurs | « Impossible de charger … Réessayez. » | glossaire (formulation des erreurs) |
| Étés vides | « Aucune promotion pour le moment. », etc. | dérivés du glossaire |

Le titre `h1` est « Bruny Shopping » (nom de marque, présent sur la planche). Aucune
accroche éditoriale n’est inventée, la planche n’en donnant pas le texte exploitable.

## 4. Tokens DSG-02 réellement utilisés

`--bs-color-primary` / `-hover`, `--bs-color-accent` / `-accent-text` / `-accent-soft`,
`--bs-color-surface`, `--bs-color-surface-muted`, `--bs-color-border` / `-strong`,
`--bs-color-text` / `-text-muted` / `-text-inverse`, `--bs-color-whatsapp-strong`,
`--bs-color-danger` / `-danger-strong`, `--bs-space-*`, `--bs-radius-md` / `-full`,
`--bs-font-size-2xs` … `--bs-font-size-24`.

Correction d’accessibilité au passage : `.brand span` utilisait `#c9a227` (2,41:1 sur blanc).
Remplacé par `var(--bs-color-accent-text)` (4,83:1), token prévu pour le texte.

## 5. Composants TEC-10 réutilisés

`ProductCardComponent` (grilles), `SkeletonComponent` (chargement), `ButtonComponent` non
utilisé (les CTA du hero sont des liens, pas des boutons), `BadgeComponent` indirectement
via `ProductCardComponent`.

Composants créés dans la feature (motifs non transverses à ce stade) :
`HeroBannerComponent`, `CategoriesPillsComponent`, `ProductSectionComponent`,
`ReassuranceBandComponent`, `FacebookCtaComponent`, `HomeComponent`, `HomeDataService`.

Écart assumé : le ticket demande de placer Hero / CategoryPill / ReassuranceBand / FacebookLink
dans `libs/ui`. Ils restent dans `features/home/sections/` tant qu’un second consommateur
n’existe pas ; les extraire maintenant créerait une API publique non validée.

## 6. Écarts entre le ticket et le dépôt réel

| Ticket | Dépôt réel |
| --- | --- |
| `projects/shop/` | `frontend/apps/storefront/` |
| `@brunyshop/data-access`, `@brunyshop/ui` | `@bruny/data-access`, `@bruny/ui` |
| Client généré + `CategoriesControllerService`, `CatalogControllerService` | `CatalogApi` (`list`, `get`, `categories`) dans `libs/data-access` |
| Tri `popular` pour « Meilleures Ventes » | Backend CAT-02 : `newest`, `price_asc`, `price_desc`, `name` uniquement |
| Trois cartes de réassurance | Quatre items (ajout « Support WhatsApp » demandé par le ticket) |
| Sections below-the-fold en `@defer` | Non différées : `@defer` remplacerait le contenu par un placeholder côté SSR |
| Route `/catalogue?category=slug` | Route existante `/boutique`, désormais lue avec `?category=<slug>` |

## 7. Décisions d’implémentation

1. La page d’accueil occupe `/`, le catalogue reste `/boutique` (route `**` → `/boutique`).
2. Route `/` en `loadChildren` vers `features/home/home.routes.ts` (lazy).
3. `HomeDataService` centralise les 4 appels, via `CatalogApi` ; aucun `HttpClient` brut.
4. Sections présentationnelles : elles reçoivent `products`, `loading`, `error` et émettent
   `retry`, ce qui garantit l’isolation des erreurs.
5. « Meilleures Ventes » retombe sur `sort: 'newest'` tant que le backend n’expose pas de
   tri popularité (réserve bloquante pour la sémantique de la section).
6. Hero : image de substitution générée (dégradé navy/or, PNG 39,9 Ko), pattern LCP correct.
7. Pas de cache client : les données changent peu mais la fraîcheur prime en MVP.

## 8. Réserves

- Pas de spec P01 écrite, pas de vues 768/1280 : conformité maquette **partielle**.
- Pas d’avis client ni de bandeau concierge (hors périmètre ticket).
- Tri popularité absent du backend.
- Visuel hero de substitution, lien Facebook codé en valeur par défaut (pas encore dans
  `/api/v1/config`).
- Les sections « Promotions » et « Meilleures Ventes » peuvent être vides selon le seed.
