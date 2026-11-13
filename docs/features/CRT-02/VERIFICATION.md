# CRT-02 — Vérification

Exécutée le 13 novembre 2026 sur la branche
`feature/CRT-02-cart-store-persistent`.

## Résultats des 18 contrôles

| # | Contrôle | Résultat | Preuve |
|---|---|---|---|
| 1 | Branche et documentation créées | ✅ | Branche active, `ANALYSE-DESIGN.md` présent |
| 2 | Store à signaux isolé | ✅ | `core/cart/cart.store.ts`, état privé exposé en `readonly` |
| 3 | Format persisté versionné et borné | ✅ | Version `1`, clé `brunyshop.cart.v1`, 50 lignes, 100 unités/ligne |
| 4 | Protection SSR | ✅ | `isPlatformBrowser` + restauration dans `afterNextRender` |
| 5 | Ajout, suppression et quantité | ✅ | Store, page panier et e2e |
| 6 | Panier conservé après rechargement | ✅ | e2e : badge à `1` après `page.reload()` |
| 7 | Ouverture du panier et revalidation CRT-01 | ✅ | `CartPage.ngOnInit`, `MiniCart`, revalidation au boot |
| 8 | Revalidation après changement de quantité | ✅ | Debounce 500 ms, test dédié avec faux timers |
| 9 | Changement de prix affiché | ✅ | e2e : bannière persistante + total serveur `25 000 FCFA` |
| 10 | Rupture de stock affichée | ✅ | e2e : bannière, message de rupture, panier vide |
| 11 | Aucune donnée sensible dans localStorage | ✅ | e2e : assertion `token|authorization|email|address` |
| 12 | Total final issu du serveur | ✅ | `displayTotal` prioritaire après validation |
| 13 | États vide, chargement et erreur | ✅ | Tests unitaires `cart-page.spec.ts`, `mini-cart.component.spec.ts` |
| 14 | Microtextes et format XAF | ✅ | Textes DSG-07, `FcfaPipe`, aucune devise codée en dur |
| 15 | Accessibilité de base | ✅ | Dialogues nommés, boutons labellisés, `aria-live`, focus modal |
| 16 | Tests unitaires storefront | ✅ | `21` fichiers, `111` tests passés |
| 17 | E2E complet | ✅ | `16` tests passés (`cart.spec.ts` + `catalog.spec.ts`) |
| 18 | Non-régression build, lint, typecheck | ✅ | Storefront et admin buildés, ESLint `0` erreur, `tsc` OK |

## Commandes exécutées

```bash
cd frontend
npx vitest run apps/storefront --maxWorkers=2
# 21 fichiers, 111 tests passés

PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome npx playwright test
# 16 tests passés

npx eslint . --max-warnings=0
npx tsc --noEmit -p apps/storefront/tsconfig.app.json

npx nx build storefront --configuration=production
npx nx build admin --configuration=production
```

## Vérification SSR réelle

Build production lancé avec :

```bash
PORT=4300 API_INTERNAL_URL=http://localhost:4000/api/v1 \
  APP_PUBLIC_URL=http://localhost:4300 \
  node dist/apps/storefront/server/server.mjs
```

```text
GET /panier → HTTP 200
HTML initial : « Mon panier », « Votre panier est vide »
stderr : aucune erreur « localStorage is not defined »
```

## Limites et points connus

- La suite frontend complète reste à `5` suites UI en échec, `41` tests
  préexistants dans `libs/ui` (documentés dans
  `docs/reviews/sprint-2/VERIFICATION-FINALE.md`). Aucun de ces échecs ne
  concerne CRT-02 ; avec ces suites, le total est de `232` tests passés.
- Le changement de prix a été vérifié via une réponse CRT-01 simulée en e2e,
  pas en modifiant la base de données locale.
- Les frais de livraison, coupons, fusion du panier invité et tunnel
  P08–P11 restent hors périmètre.
- Le CTA « Passer la commande » est volontairement désactivé : le tunnel
  n'existe pas encore.
- `frontend/angular.json` contient une modification préexistante CAT-08 et
  n'est pas inclus dans le commit CRT-02.
