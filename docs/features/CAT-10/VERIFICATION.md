# CAT-10 — Rapport de vérification

Ticket : `[CAT-10] Fiche produit : galerie, couleurs, pointures, achat`
Branche : `feature/CAT-10-product-detail-page`
Date des vérifications : 18 novembre 2026

## Résultat synthétique

Les fonctionnalités demandées sont livrées et couvertes par des tests automatisés.
Deux points ne peuvent pas être déclarés conformes : **Lighthouse n'a pas été exécuté**
sur cette machine, et **aucun audit manuel de lecteur d'écran** n'a été réalisé.
Le numéro WhatsApp reste un placeholder de configuration.

| Vérification | Résultat | Preuve / limite |
| --- | --- | --- |
| 1. Contrat API et backend inchangés | ✅ | Aucun fichier `backend/` modifié par CAT-10 |
| 2. Tests unitaires ciblés fiche produit | ✅ | 37 tests, 5 fichiers |
| 3. Tests unitaires complets | ✅ | 463 tests, 91 fichiers |
| 4. E2E fiche produit | ✅ | 14/14 |
| 5. Non-régression catalogue | ✅ | 13/13 |
| 6. Build storefront | ✅ | `pnpm build:storefront`, exit 0 |
| 7. Build admin | ✅ | `pnpm build:admin`, exit 0 |
| 8. ESLint frontend | ✅ | `pnpm lint`, exit 0 |
| 9. Rendu SSR réel | ✅ | `GET /produit/mocassins-camostride-elegance` → 200 |
| 10. JSON-LD `Product` côté serveur | ✅ | `"@type":"Product"`, `"availability"` `InStock` |
| 11. Métadonnées SEO côté serveur | ✅ | `<title>`, description, canonical, Open Graph |
| 12. Produit introuvable | ✅ | État vide + message, couvert en e2e/unitaires |
| 13. Galerie : miniatures, clic, zoom | ✅ | E2E : changement d'image et modale de zoom |
| 14. Galerie : swipe tactile | ✅ | Test unitaire de geste tactile ; pas de swipe réel Playwright |
| 15. Couleur → galerie, prix, disponibilité | ✅ | E2E : BLANC → image, `26 000 FCFA`, pointures |
| 16. Pointures épuisées et stock faible | ✅ | Barrées, `aria-disabled`, « Plus que X » |
| 17. CTA désactivé + message explicite | ✅ | Couleur/pointure manquantes, rupture |
| 18. CTA actif + ajout panier | ✅ | E2E : ligne ajoutée, mini-panier ouvert |
| 19. Barre fixe mobile panier + WhatsApp | ✅ | Visible à 360 px, masquée à 768 px |
| 20. Onglets Description / Livraison / Retours | ✅ | Navigation clavier, `aria-selected`, panneaux |
| 21. Produits similaires | ✅ | E2E : navigation vers une autre fiche |
| 22. Mise en page 360 / 768 / 1280 | ✅ | 1 colonne, 2 colonnes dès 768, 4 similaires à 1024 |
| 23. Accessibilité WCAG 2.1 AA | ⚠️ | Rôles, libellés, clavier, focus testés ; **pas d'audit VoiceOver/NVDA** |
| 24. Lighthouse Perf ≥ 85, A11y/BP/SEO ≥ 90 | ❌ | **Non exécuté** : Lighthouse absent/localement indisponible |

## Commandes exécutées

```bash
# Frontend
cd frontend
pnpm exec vitest run apps/storefront/src/app/features/product-detail --maxWorkers=2
pnpm exec vitest run --maxWorkers=2
pnpm lint
pnpm build:storefront
pnpm build:admin

# E2E (API sur :4000 et boutique SSR sur :4200)
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome \
  pnpm exec playwright test e2e/product-detail.spec.ts --timeout=60000
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome \
  pnpm exec playwright test e2e/catalog.spec.ts --timeout=60000

# SSR
curl -s http://127.0.0.1:4200/produit/mocassins-camostride-elegance
```

### Résultats bruts

- Unitaires ciblés : `5 passed (5)`, `37 passed (37)`.
- Unitaires complets : `91 passed (91)`, `463 passed (463)`.
- E2E fiche produit : `14 passed`.
- E2E catalogue : `13 passed`.
- Build storefront : exit 0, 19,5 s.
- Build admin : exit 0.
- ESLint : exit 0.
- SSR : `HTTP/1.1 200 OK`, prix rendu avec espaces insécables (`29 500 FCFA`),
  canonical `https://brunyshop.cm/produit/mocassins-camostride-elegance`.

## Périmètre fonctionnel livré

- Route enfant lazy `/produit/:slug`, `ProductDetailStore` fourni par la route.
- Galerie : images de la couleur sélectionnée, miniatures horizontales en mobile et
  verticales à partir de 1024 px, swipe, clavier, zoom modal, compteur.
- Couleur : pastilles accessibles, indisponibilité, mise à jour galerie/prix/pointures.
- Pointure : sélection obligatoire, pointures épuisées barrées, seuil de stock faible.
- Achat : quantité, CTA désactivé avec message, ajout au panier idempotent.
- Barre fixe mobile : prix, panier, WhatsApp, safe-area.
- Onglets et produits similaires.
- SEO : titre, description, canonical, Open Graph, JSON-LD `Product` avec prix XAF.
- États chargement (squelettes) et erreur/404.

## Écarts et limites connus

1. **Lighthouse non exécuté.** L'outil n'est pas installé dans le projet et l'appel
   `pnpm exec lighthouse` n'a pas abouti. Aucun score de performance ou
   d'accessibilité n'est donc revendiqué.
2. **Audit lecteur d'écran absent.** Les rôles ARIA, libellés, états et navigation
   clavier sont testés, mais pas l'expérience réelle VoiceOver/NVDA.
3. **Données de seed pauvres.** Une seule couleur par produit, deux images communes,
   aucune promotion : les scénarios multi-couleurs, promo et stock faible sont couverts
   par des mocks, pas par les données réelles.
4. **WhatsApp placeholder.** `APP_CONFIG.contactWhatsappUrl` vaut
   `https://wa.me/237600000000` ; le numéro réel doit être fourni avant production.
5. **Guide des tailles.** Le lien pointe vers la route existante `/guide-des-tailles`
   (le ticket indiquait `/guide-tailles`) ; le paramètre `?category=` n'est pas encore
   exploité par la page.
6. **Spec design P04 absente.** `docs/design/DSG-03/P04-fiche-produit.md` n'existe pas ;
   l'analyse s'appuie sur la maquette et `docs/design-1/ANALYSE-MAQUETTES.md`.

## Definition of Done

| Critère | État |
| --- | --- |
| Branche dédiée | ✅ `feature/CAT-10-product-detail-page` |
| Galerie, couleurs, pointures, achat | ✅ |
| SEO + JSON-LD SSR | ✅ |
| Microtextes FR, aucune invention produit | ✅ |
| Format FCFA via `FcfaPipe` | ✅ |
| Unitaires + e2e (14 cas) | ✅ |
| Builds storefront et admin | ✅ |
| ESLint | ✅ |
| Docs d'analyse et de vérification | ✅ |
| Lighthouse | ❌ non exécuté |
| Commit unique | ✅ `feat(product): add product detail page with gallery, selectors and SEO [CAT-10]` |
