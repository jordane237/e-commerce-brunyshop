# CRT-03 — Vérification

**Date** : 16 novembre 2026
**Branche** : `feature/CRT-03-mini-cart-drawer`
**Environnement** : Linux, Chromium système, Node/Angular du dépôt.

## Résumé

Le mini-panier en tiroir est implémenté avec un `DrawerComponent` réutilisable basé sur
CDK Overlay et FocusTrap, l'ouverture automatique après ajout, le badge temps réel, les
états de chargement / vide / rempli / erreur, la revalidation à l'ouverture et les CTA.

Deux limites sont assumées et documentées :

1. **P07 n'existe pas** dans les sources de design (ni maquette ni spec), donc aucune
   conformité pixel ou wireframe 360 / 768 / 1280 ne peut être revendiquée.
2. **Le checkout P08 n'existe pas** : « Passer la commande » est désactivé avec une
   mention explicite au lieu de naviguer vers une route inexistante.

## Les 18 vérifications

| # | Vérification | Résultat | Preuve |
| --- | --- | --- | --- |
| 1 | Build storefront production | ✅ | `npx nx build storefront --configuration=production` — succès, bundle serveur généré |
| 2 | Build admin production (non-régression) | ✅ | `npx nx build admin --configuration=production` — succès |
| 3 | Tests unitaires CRT-03 | ✅ | 41 tests : `CartStore` 25, `MiniCart` 11, `Drawer` 5 |
| 4 | ESLint | ✅ | `npx eslint apps libs e2e --max-warnings=0` — 0 erreur |
| 5 | Backend local | ✅ | `GET /api/v1/health/ready` → 200 |
| 6 | Storefront servi | ✅ | `ng serve storefront` utilisé par Playwright ; SSR build sur port 4300 |
| 7 | Ajout + ouverture automatique | ✅ | e2e : ajout depuis `/boutique`, tiroir visible, ligne affichée, focus initial sur Fermer |
| 8 | Ouverture manuelle | ✅ | e2e : clic sur le déclencheur, dialogue `role="dialog"` visible |
| 9 | CTA « Continuer mes achats » | ✅ | e2e : clic → fermeture + URL `/boutique` |
| 10 | CTA « Passer la commande » | ⚠️ | Bouton présent, libellé DSG-07, **désactivé** car `/commande` (P08) n'existe pas |
| 11 | Échap | ✅ | Unit + e2e : le tiroir se ferme et le focus revient au déclencheur |
| 12 | Focus trap / focus initial | ✅ | e2e : focus sur Fermer à l'ouverture ; Tab depuis le dernier CTA revient sur Fermer |
| 13 | Backdrop + scroll lock | ✅ | e2e : clic backdrop ferme et restaure le focus ; classe `cdk-global-scrollblock` posée puis retirée |
| 14 | Badge temps réel | ✅ | Unit : 2 → 3 → 0 articles, libellé ARIA recalculé ; e2e : badge à 1 après ajout |
| 15 | État vide | ✅ | Unit : « Votre panier est vide », texte et « Découvrir la boutique », aucun CTA commande |
| 16 | SSR | ✅ | `/`, `/boutique`, `/panier` → 200 ; `role="dialog"` = 0, `cdk-overlay` = 0, badge « 0 article » |
| 17 | Lecteur d'écran réel | ❌ | Non exécuté : aucun NVDA/VoiceOver disponible. Structure ARIA vérifiée par tests, pas l'annonce vocale |
| 18 | Non-régression boutique / panier | ✅ | SSR 200 sur `/`, `/boutique`, `/panier` ; e2e panier 4/4 |

### Détail des tests unitaires

```text
apps/storefront/src/app/core/cart/cart.store.spec.ts      25 passed
apps/storefront/src/app/layout/.../mini-cart.component.spec.ts 11 passed
libs/ui/src/lib/drawer/drawer.component.spec.ts           5 passed
Total                                                     41 passed
```

Couverture fonctionnelle : ajout, fusion de variante, quantité invalide, plafond,
`lastAddedAt`, ouverture auto sans réouverture après fermeture, badge réactif, erreur et
retry, issues, vide, chargement, retrait, CTA Continuer, Échap, backdrop, focus retour,
`aria-modal`, `aria-labelledby`, `aria-label` du bouton Fermer.

### Détail e2e

```text
e2e/cart.spec.ts — 4 passed
- conserve le panier invité, ouvre le mini-panier après ajout et le revalide
- ferme le mini-panier au backdrop puis continue vers la boutique
- affiche le changement de prix dans une bannière persistante
- retire une ligne en rupture et explique pourquoi
```

Commande :

```bash
cd frontend
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome \
  npx playwright test e2e/cart.spec.ts --reporter=list
```

### SSR

```bash
cd frontend
PORT=4300 API_INTERNAL_URL=http://localhost:4000/api/v1 \
APP_PUBLIC_URL=http://localhost:4300 \
node dist/apps/storefront/server/server.mjs

curl -s -o /dev/null -w '%{http_code}' http://localhost:4300/
curl -s -o /dev/null -w '%{http_code}' http://localhost:4300/boutique
curl -s -o /dev/null -w '%{http_code}' http://localhost:4300/panier
```

Résultats : `200`, `200`, `200`. Le HTML SSR contient le déclencheur avec
« Ouvrir le panier (0 article) » mais aucun `role="dialog"` ni `cdk-overlay`.

## Limites et points d'attention

- **P07 absent** : la maquette et les specs DSG-03 n'existent pas. Le tiroir est dérivé de
  P06, du Modal et des tokens DSG-02 ; la revue pixel ne peut pas être réalisée.
- **Checkout absent** : le CTA commande est désactivé avec « Le paiement sera disponible
  prochainement. ». L'activer suppose P08 et la route `/commande`.
- **Suite globale du frontend** : `npx vitest run` seul remonte 43 échecs dans 7 fichiers
  hors périmètre (specs historiques `skeleton`, `size-selector`, `product-grid`, etc.)
  dont les API ne correspondent plus aux composants. Les suites CRT-03 et le lint ciblé
  sont verts ; ces échecs préexistants n'ont pas été modifiés dans ce ticket.
- **Lecteur d'écran** : non testé avec NVDA/VoiceOver. Les rôles, libellés, focus et
  annonces `aria-live` sont couverts par les tests navigateur et unitaires.

## Checklist DoD

- [x] Branche `feature/CRT-03-mini-cart-drawer` active
- [x] `ANALYSE-DESIGN.md` produit, avec constat P07 absent
- [x] `DrawerComponent` CDK Overlay + FocusTrap, rôle, ARIA, Échap, backdrop, focus retour
- [x] MiniCart basé sur `DrawerComponent` + signaux `CartStore`
- [x] CA #1 : tiroir, résumé, badge `itemCount()` temps réel
- [ ] CA #2 : « Continuer mes achats » oui ; « Passer la commande » présent mais désactivé
- [x] CA #3 : focus trap, Échap, focus retour, ARIA complet
- [x] Header réel (inline `app.html`) avec déclencheur, badge et `aria-live`
- [x] Ouverture auto via `lastAddedAt` + `effect()` sans réouverture après fermeture
- [x] États loading / vide / rempli / issues / erreur
- [x] Revalidation à l'ouverture si `isStale()` ou erreur
- [x] SSR-safe, rendu navigateur uniquement
- [x] Composants standalone, OnPush, Signals, `@if` / `@for (track)`
- [x] Microtextes alignés DSG-07 (dérogations documentées)
- [x] Prix FCFA via `PriceTagComponent`
- [x] Zones ≥ 44 × 44 px, focus visible, `prefers-reduced-motion`
- [x] Tests unitaires et e2e CRT-03 verts
- [x] Builds storefront + admin
- [x] ESLint 0 erreur
- [x] Backend et storefront démarrés
- [x] SSR vérifié
- [ ] Test lecteur d'écran réel
- [x] Aucun secret, aucun `dist/` ajouté
- [x] Commit unique : `feat(cart): add mini-cart drawer with focus trap and auto-open on add [CRT-03]`

## Fichiers livrés

```text
frontend/libs/ui/src/lib/drawer/
├── drawer.component.ts
├── drawer.component.html
├── drawer.component.scss
└── drawer.component.spec.ts
frontend/apps/storefront/src/app/layout/components/mini-cart/
├── mini-cart.component.ts
├── mini-cart.component.html
├── mini-cart.component.scss
└── mini-cart.component.spec.ts
frontend/apps/storefront/src/app/core/cart/cart.store.ts
frontend/apps/storefront/src/app/core/cart/cart.store.spec.ts
frontend/libs/ui/src/index.ts
frontend/libs/ui/project.json
frontend/package.json
pnpm-lock.yaml
frontend/e2e/cart.spec.ts
docs/features/CRT-03/ANALYSE-DESIGN.md
docs/features/CRT-03/VERIFICATION.md
```
