# MKT-04 — Rapport de vérification

Branche : `feature/MKT-04-meta-pixel-utm-consent`
Date : 18 novembre 2026

## Résultat synthétique

Le consentement, le bandeau, le Pixel Meta, les UTM et le delta backend sont livrés et
testés. Deux limites de périmètre subsistent : **P08/P11/P12 n'existent pas côté Angular**,
donc `InitiateCheckout`, `Purchase` et le test « rechargement de la confirmation » ne
peuvent pas être démontrés de bout en bout. Le test Meta Pixel Helper n'a pas été exécuté
faute d'ID réel.

## Vérifications

| # | Vérification | Résultat | Preuve / limite |
| --- | --- | --- | --- |
| 1 | Branche dédiée | ✅ | `feature/MKT-04-meta-pixel-utm-consent` |
| 2 | Analyse design produite | ✅ | `docs/features/MKT-04/ANALYSE-DESIGN.md` |
| 3 | ConsentService (signals, version, 13 mois, SSR) | ✅ | 8 tests |
| 4 | MetaPixelService (init, PageView, événements, révocation) | ✅ | 10 tests |
| 5 | UtmService (first-touch, stockage, enrichissement) | ✅ | 6 tests |
| 6 | Bandeau et préférences | ✅ | 6 tests |
| 7 | Intégration App + footer | ✅ | Bandeau racine, lien « Gérer mes préférences cookies » |
| 8 | ViewContent sur P04 | ✅ | Test unitaire + e2e |
| 9 | AddToCart après ajout réussi | ✅ | Test unitaire + e2e |
| 10 | InitiateCheckout | ⚠️ | Méthode testée unitairement, **aucun écran P08/P11** |
| 11 | Purchase | ⚠️ | Méthode testée unitairement, **aucun écran P12** |
| 12 | Anti-double-comptage Purchase | ⚠️ | Flag + localStorage testés ; **rechargement P12 non testable** |
| 13 | UTM conservés et enregistrés avec la commande | ⚠️ | Capture + backend testés ; **aucun POST /orders depuis l'UI** |
| 14 | `Order.source` backend | ✅ | `orders-create.e2e-spec.ts` : 15/15 |
| 15 | Politique de confidentialité | ✅ | Section « Cookies et traceurs », `_fbp`/`_fbc`, Meta, 13 mois |
| 16 | CSP production | ✅ | `connect.facebook.net` et `www.facebook.com` autorisés |
| 17 | E2E Pixel et consentement | ✅ | **9/9** |
| 18 | Non-régression e2e | ✅ | **41/41** avec `--workers=2` |
| 19 | SSR sans bandeau ni script Pixel | ✅ | E2E `request.get('/politique-confidentialite')` |
| 20 | Meta Pixel Helper / Events Manager | ❌ | **Non exécuté** : pas d'ID réel, procédure dans `TEST-PIXEL.md` |

## Commandes et résultats

```bash
# Unitaires frontend
cd frontend
pnpm exec vitest run --maxWorkers=2
# 95 fichiers, 496 tests passés

# Ciblés
pnpm exec vitest run apps/storefront/src/app/core/services --maxWorkers=1
# 3 fichiers, 24 tests passés

# E2E
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome \
  pnpm exec playwright test --timeout=60000 --workers=2
# 41 passés

PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome \
  pnpm exec playwright test e2e/meta-pixel.spec.ts --timeout=60000
# 9 passés

# Backend
cd backend
pnpm exec vitest run --config vitest.e2e.config.ts test/orders-create.e2e-spec.ts
# 15 passés

# Builds et lint
pnpm build                 # backend
pnpm -C frontend build:storefront
pnpm -C frontend build:admin
pnpm -C frontend lint      # exit 0
```

### Notes sur l’exécution e2e

Le premier lancement avec le parallélisme maximal (9 workers) a produit 3 échecs sur des
tests existants, dont deux dus à l’ambiguïté `getByRole('dialog')` créée par le bandeau.
Le bandeau est finalement une `role="region"` non modale, et les tests ont été rejoués avec
`--workers=2` : **41/41**. Le parallélisme maximal reste sensible aux accès concurrents au
backend de test.

## Ce qui est réellement actif

- Bandeau au premier accès, aucun script Meta avant consentement.
- « Accepter » : choix stocké, script chargé, `PageView`.
- « Refuser » : choix stocké, aucun script, aucun événement.
- « Personnaliser » : modal accessible, cases mesure d’audience et Pixel Meta.
- Footer : réouverture du bandeau, retrait du consentement, suppression `_fbp`/`_fbc`.
- ViewContent et AddToCart sur la fiche produit.
- UTM capturés au boot, conservés en localStorage, prêts pour le POST commande.
- Backend : `source` validé, fusionné avec IP/User-Agent, exclu du hash d’idempotence.

## Limites et points d’attention

1. **Pas de tunnel checkout frontend** : aucun `OrdersApi`, aucun POST `/orders` depuis la
   boutique. Les UTMs ne peuvent donc pas encore être envoyés par un formulaire réel.
2. **Pas de page P12** : Purchase n’est jamais déclenché dans l’application. Le service et
   son anti-double-comptage sont testés, mais pas le rechargement de la confirmation.
3. **Pas de test Meta Pixel Helper** : l’ID reste `CHANGEME_meta_pixel_id`.
4. **Pas d’audit lecteur d’écran** : navigation clavier, Échap, labels et focus du modal
   sont couverts ; VoiceOver/NVDA ne l’est pas.
5. **AddToCart P01/P02 non instrumenté** : seuls P04 et son ajout sont couverts.
6. **CSP non testée en conteneur** : la configuration est mise à jour, mais aucun build
   Docker n’a été exécuté.
7. **First-touch** : conforme au prompt ; si le métier veut le dernier clic non direct,
   il faudra modifier `UtmService`.
8. **Date légale globale inchangée** : le contenu P27 est mis à jour, mais
   `LEGAL_INFO.lastUpdated` reste partagé avec les autres pages légales.

## Definition of Done

| Critère | État |
| --- | --- |
| ConsentService + tests | ✅ |
| MetaPixelService + tests | ✅ |
| UtmService + tests | ✅ |
| Bandeau + modal + footer | ✅ |
| Hooks ViewContent / AddToCart | ✅ |
| Hooks InitiateCheckout / Purchase | ⚠️ méthodes seules |
| Delta backend ORD-01 | ✅ |
| Politique de confidentialité | ✅ |
| CSP production | ✅ |
| Tests unitaires 496 | ✅ |
| E2E 41 | ✅ |
| Builds storefront/admin/backend | ✅ |
| ESLint | ✅ |
| Meta Pixel Helper | ❌ non exécuté |
| Commit unique | ✅ |
