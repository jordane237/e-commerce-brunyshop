# MKT-06 — Rapport de vérification

Branche : `feature/MKT-06-whatsapp-floating-button`
Base : `51f8f02` (`MKT-04`)
Date : 19 novembre 2026

## Résultat synthétique

Le bouton WhatsApp flottant, les messages contextuels, le masquage sur
`/contact`, pendant le consentement et sur P04 mobile sont livrés et vérifiés.
La configuration provient de `APP_CONFIG.contactWhatsappUrl`, sans backend ni
nouvelle variable d’environnement.

Deux limites de périmètre subsistent : **aucune route de tunnel n’existe côté
Angular**, donc le masquage du tunnel (CA2) n’est démontré qu’en tests
unitaires, et **le numéro reste le placeholder** `237600000000` tant que le
propriétaire ne l’a pas remplacé. Le FAB n’est pas dessiné dans la maquette :
c’est une proposition MKT-06.

## Vérifications

| # | Vérification | Résultat | Preuve / limite |
| --- | --- | --- | --- |
| 1 | Branche dédiée | ✅ | `feature/MKT-06-whatsapp-floating-button` |
| 2 | Analyse design produite | ✅ | `docs/features/MKT-06/ANALYSE-DESIGN.md` |
| 3 | Service WhatsApp : contextes, validation, extraction du numéro | ✅ | 11 tests (`whatsapp.service.spec.ts`) |
| 4 | Composant FAB : visibilité, Router, consentement | ✅ | 8 tests (`whatsapp-fab.component.spec.ts`) |
| 5 | Intégration dans `App`, avant le bandeau | ✅ | `app.html` : `<app-whatsapp-fab />` puis `<app-consent-banner />` |
| 6 | Contexte accueil `/` | ✅ | Test unitaire + e2e « je visite votre boutique » |
| 7 | Contexte boutique `/boutique` | ✅ | Test unitaire + e2e « je parcours votre boutique » |
| 8 | Contexte fiche produit `/produit/:slug` | ✅ | Test unitaire + e2e + contexte `product` sur P04 |
| 9 | Contexte panier `/panier` | ✅ | Test unitaire + e2e « mon panier » |
| 10 | Contexte guide des pointures | ✅ | Test unitaire + e2e `/guide-des-tailles` |
| 11 | Masquage sur `/contact` | ✅ | Composant non rendu (pas seulement CSS), e2e `toHaveCount(0)` |
| 12 | Masquage dans le tunnel | ⚠️ | Préfixes `/commande`, `/checkout`, `/paiement`, `/confirmation`, `/suivi` testés unitairement ; **aucune route tunnel réelle** pour un e2e |
| 13 | Masquage pendant le bandeau de consentement | ✅ | E2E : absente avant choix, visible après « Accepter » |
| 14 | Masquage sur P04 mobile (sticky bar CAT-10) | ✅ | E2E 390 px : sticky bar visible, FAB `toBeHidden()` |
| 15 | Numéro depuis `APP_CONFIG`, FAB masqué si absent/invalide | ✅ | Tests unitaires ; placeholder `237600000000`, aucun numéro supplémentaire codé en dur |
| 16 | Accessibilité : nom, nouvel onglet, focus, infobulle, cible 56 px | ✅ | E2E : `aria-label`, `target`, `rel`, `role="tooltip"`, focus visible, anneau `solid` |
| 17 | Cible mobile 52 px et position à 16 px du bord | ✅ | E2E 390 px : `52 × 52`, `x = 390 − 16 − 52` |
| 18 | Contraste et `prefers-reduced-motion` | ✅ | Glyphe navy sur `#25D366` = **8,65:1** ; réduction des animations en CSS |
| 19 | Rendu SSR du lien | ✅ | E2E `request.get('/')` : URL WhatsApp et nom accessible dans le HTML serveur |
| 20 | Empilement sous le bandeau | ✅ | `--bs-z-whatsapp-fab: 1030` < overlay `1040` < consentement `1041` |
| 21 | Non-régression complète | ✅ | **515/515** unitaires, **53/53** e2e, builds storefront/admin et lint complets |

## Commandes et résultats

```bash
# Unitaires frontend
cd frontend
pnpm exec vitest run --maxWorkers=2
# 97 fichiers, 515 tests passés

# Ciblés MKT-06
pnpm exec vitest run \
  apps/storefront/src/app/core/services/whatsapp.service.spec.ts \
  apps/storefront/src/app/layout/components/whatsapp-fab/whatsapp-fab.component.spec.ts \
  apps/storefront/src/app/features/home/sections/hero-banner/hero-banner.component.spec.ts \
  --maxWorkers=1
# 3 fichiers, 20 tests passés

# Typecheck
pnpm exec nx run storefront:typecheck
# succès

# Builds
pnpm build:storefront   # succès
pnpm build:admin        # succès

# Lint complet (racine)
pnpm lint               # exit 0

# E2E complets (API backend démarrée sur le port 4000)
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome \
  pnpm exec playwright test --timeout=60000 --workers=2
# 53 passés

# E2E MKT-06 seuls
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome \
  pnpm exec playwright test e2e/whatsapp-fab.spec.ts --timeout=60000 --workers=1
# 12 passés
```

### Notes sur l’exécution e2e

Le premier lancement complet a eu lieu sans API : 14 tests existants
(`catalog`, `cart`, `product-detail`) ont échoué, avec un rendu SSR
« Produit introuvable ». Après démarrage du backend (`pnpm dev` dans
`backend/`, PostgreSQL et Redis déjà sains), les 32 tests concernés puis la
suite entière sont passés : **53/53**. Aucun de ces échecs n’était lié au FAB.

Playwright lance lui-même le serveur de développement storefront sur
`127.0.0.1:4200`. L’API et la base seedée sont un prérequis externe pour les
tests catalogue, panier et fiche produit.

## Ce qui est réellement actif

- FAB présent sur les pages publiques, en bas à droite.
- Message prérempli différent selon l’accueil, la boutique, la fiche produit, le
  panier, le compte, le guide des pointures et les pages génériques.
- Lien construit depuis `https://wa.me/237600000000` avec `encodeURIComponent`.
- FAB masqué sur `/contact`, dans le tunnel, tant que le consentement n’est pas
  rendu, et sur P04 mobile sous 768 px.
- Ouverture dans un nouvel onglet avec `noopener noreferrer`.
- Focus visible, infobulle, nom accessible et cible tactile conformes.
- Aucun script, réseau ou stockage supplémentaire : simple ancre HTML.

## Limites et points d’attention

1. **Pas de routes de tunnel** : CA2 est couvert par le code et les tests
   unitaires, pas par un parcours e2e réel. Les liens d’aide P08/P12 restent à
   spécifier avec les pages du tunnel.
2. **Pas de FAB dans la maquette** : la planche mobile ne dessine pas ce bouton ;
   il s’aligne sur les couleurs et CTA existants.
3. **Bottom-nav future** : le design prévoit un onglet WhatsApp non implémenté.
   Il faudra éviter le doublon lors de son ajout.
4. **Placeholder** : `237600000000` est syntaxiquement valide mais ne correspond
   pas à un vrai numéro. Il doit être remplacé dans `APP_CONFIG` avant mise en
   production.
5. **Numéro compilé dans le bundle** : pas de source admin ni d’endpoint public ;
   hors périmètre MKT-06.
6. **Message produit générique** : le layout ne connaît pas le nom du produit ;
   le service accepte déjà `productName` pour une évolution future.
7. **Pas de suivi de clic** : aucun événement Meta n’est ajouté.
8. **Pas de test lecteur d’écran réel** : VoiceOver/NVDA reste manuel.
9. **Test « configuration manquante »** : couvert unitairement, pas en e2e, car
   il faudrait reconstruire l’application avec une autre configuration.

## Definition of Done

| Critère | État |
| --- | --- |
| FAB sur les pages publiques | ✅ |
| Messages contextuels | ✅ |
| Masquage `/contact` | ✅ |
| Masquage consentement | ✅ |
| Masquage P04 mobile | ✅ |
| Masquage tunnel | ⚠️ code + tests unitaires, routes absentes |
| Configuration sans backend | ✅ |
| Accessibilité WCAG 2.1 AA | ✅ sauf audit lecteur d’écran |
| Tests unitaires | ✅ 19 nouveaux |
| Tests e2e | ✅ 12 |
| Non-régression | ✅ 515 unitaires, 53 e2e, builds, lint |
| Documentation | ✅ `ANALYSE-DESIGN.md`, `VERIFICATION.md` |
| Numéro réel fourni | ❌ placeholder |
