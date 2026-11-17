# CRT-04 — Vérification

**Date** : 17 novembre 2026
**Branche** : `feature/CRT-04-cart-page`
**Périmètre** : page panier boutique (P06), complétée sans dupliquer la page existante.

## Résumé

La page `/panier` réutilise `CartStore` (CRT-02) et s'appuie sur quatre composants dédiés :

- `QuantitySelectorComponent` (`libs/ui`) : quantité bornée au stock serveur, saisie
  manuelle bornée, hint « Quantité maximale disponible (N) atteinte. » ;
- `CartLineItemComponent` : visuel, nom, couleur, pointure, prix unitaire serveur,
  sous-total de ligne, suppression, issue de ligne ;
- `CartSummaryComponent` : sous-total, remise, livraison estimée, total FCFA,
  CTA « Passer la commande », état de chargement ;
- `CartReassuranceComponent` : quatre engagements (paiement à la livraison, échange
  sous 7 jours, livraison Douala/Yaoundé, support WhatsApp).

Les routes panier sont isolées dans `features/cart/cart.routes.ts` et chargées en lazy
depuis `app.routes.ts`.

Deux limites sont assumées :

1. **Le checkout P08/DSG-04 n'existe pas** : le CTA « Passer la commande » reste
   désactivé et une mention « Le paiement sera disponible prochainement. » est affichée.
2. **Aucune comparaison pixel** avec la maquette P06 n'a été faite : la mise en page
   reprend les tokens et composants du design system, sans capture de référence.

## Vérifications

| # | Vérification | Résultat | Preuve |
| --- | --- | --- | --- |
| 1 | Build storefront production | ✅ | `pnpm build:storefront` — succès |
| 2 | Build admin production (non-régression) | ✅ | `pnpm build:admin` — succès |
| 3 | Tests unitaires de la page et des composants panier | ✅ | 26 tests : page 10, ligne 4, récapitulatif 6, réassurance 2, sélecteur 4 |
| 4 | Suite unitaire frontend complète | ✅ | 84 fichiers, 417 tests (`vitest run --maxWorkers=2`) |
| 5 | ESLint | ✅ | `pnpm lint` — 0 erreur |
| 6 | E2E panier | ✅ | `e2e/cart.spec.ts` — 5/5 avec l'API locale démarrée |
| 7 | SSR | ✅ | build production servi sur `:4300` ; `/panier` → 200, contient « Mon panier » et l'état vide SSR |
| 8 | Lignes détaillées | ✅ | E2E : nom, couleur, pointure, prix unitaire et total de ligne visibles |
| 9 | Quantité bornée au stock | ✅ | E2E : stock 1 → bouton « + » désactivé, hint max affiché |
| 10 | Récapitulatif FCFA | ✅ | E2E : total `25 000 FCFA` issu de la validation serveur |
| 11 | Bandeau de réassurance | ✅ | E2E : paiement, échange, livraison et support visibles |
| 12 | État vide | ✅ | Tests unitaires : titre, description et CTA « Découvrir la boutique » |
| 13 | CTA « Passer la commande » | ⚠️ | Présent et libellé, **désactivé** tant que `/commande` n'existe pas |
| 14 | Revalidation après changement de quantité | ✅ | Test unitaire à faux timers : debounce 500 ms |
| 15 | Issue de ligne et bannière persistante | ✅ | Tests unitaires + E2E prix modifié et rupture de stock |
| 16 | Suppression d'une ligne | ✅ | Test unitaire : émission de `variantId` ; E2E rupture → panier vide |
| 17 | Accessibilité de base | ✅ | Régions nommées, `role="list"`, boutons `aria-label`, issues `role="alert"`, cibles 44 px |
| 18 | Lighthouse | ❌ | Non exécuté dans cet environnement |

## Commandes exécutées

```bash
cd frontend
pnpm build:storefront
pnpm build:admin
pnpm lint
pnpm exec vitest run --maxWorkers=2
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome \
  pnpm exec playwright test e2e/cart.spec.ts --timeout=60000
```

## Limites et points ouverts

- **Lighthouse** et un contrôle avec lecteur d'écran réel (NVDA/VoiceOver) restent à
  faire ; seules la structure ARIA et les tests automatisés sont couverts.
- Le premier lancement Playwright échoue sans API sur `:4000`, car le parcours d'ajout
  depuis `/boutique` charge le catalogue réel. Avec l'API locale, les 5 tests passent.
- Le panier persiste côté navigateur (`brunyshop.cart.v1`) ; le rendu SSR initial est
  volontairement vide, puis hydraté après restauration.
- Le paiement, la page de commande et la livraison réelle restent hors périmètre.
