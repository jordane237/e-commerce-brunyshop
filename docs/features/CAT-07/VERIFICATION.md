# CAT-07 — Vérification (démarrage, non-régression, critères)

**Branche** : `feature/CAT-07-home-page`
**Date** : 12 novembre 2026
**Environnement** : Node 24.15.0, Angular 22.2.2, backend NestJS local (port 4000), build SSR servi sur le port 4100.

## 1. Résultats des vérifications

| # | Vérification | Commande / preuve | Résultat |
| --- | --- | --- | --- |
| 1 | Build storefront production | `npx nx build storefront --configuration=production` | ✅ 39,8 s puis 12,9 s (cache incrémental) |
| 2 | Build admin production | `npx nx build admin --configuration=production` | ✅ 9,0 s |
| 3 | Lint frontend (périmètre modifié) | `npx eslint apps/storefront/src/app/features/home apps/storefront/src/app/app.routes.ts apps/storefront/src/app/features/catalog/catalog-page.ts --max-warnings=0` | ✅ 0 erreur |
| 4 | Tests unitaires CAT-07 | `npx vitest run apps/storefront/src/app/features/home` | ✅ 7 fichiers / 16 tests |
| 5 | Tests frontend complets | `npx vitest run` | ⚠️ 41 échecs / 105 succès — 5 fichiers `libs/ui` **préexistants** (voir §3) |
| 6 | Backend | `curl http://127.0.0.1:4000/api/v1/health/ready` | ✅ 200 |
| 7 | Page `/` | `curl http://127.0.0.1:4100/` | ✅ 200 |
| 8 | Contenu SSR | HTML initial contient « Rayons Phares », « Nouveautés de la Semaine », « Garanties Bruny Shopping », « Suivez-nous sur Facebook », catégories réelles (« Sneakers ») et 32 références `bruny-product-card` | ✅ contenu rendu, pas seulement `<app-root>` |
| 9 | Image hero préchargée | HTML : `rel="preload" as="image" href="/images/hero-home.png"`, `fetchpriority="high"` ×2, image 200 / 39 851 octets | ✅ |
| 10 | Lighthouse (mobile, slow 4G) | voir `LIGHTHOUSE-REPORT.md` | ✅ Performance 99, LCP 1 560 ms, CLS 0,034, TBT 29 ms |
| 11 | Accessibilité Lighthouse | même passe | ✅ 100 / 100 |
| 12 | Non-régression `/boutique` | `curl -o /dev/null -w '%{http_code}' /boutique` | ✅ 200 |
| 13 | Filtre `?category=sneakers` | `curl /boutique?category=sneakers` | ✅ catégorie appliquée (Sneakers présent) |
| 14 | Non-régression `/panier` | `curl -o /dev/null -w '%{http_code}' /panier` | ✅ 200 |
| 15 | Erreurs serveur SSR | `stderr` du serveur node | ✅ vide |
| 16 | Secrets / artefacts | `git status` | ✅ pas de `.env`, pas de `dist/` suivi |

## 2. Vérifications non exécutables ici

| Vérification | Raison |
| --- | --- |
| Test manuel navigateur (clavier, screen reader, DevTools responsive) | Pas de session graphique interactive ; mesure automatisée Lighthouse uniquement |
| Throttling « Slow 3G » manuel pour voir les squelettes | Non exécuté ; les états sont couverts par les tests unitaires |
| `pnpm openapi:check` | Le ticket ne touche pas le backend ; non relancé |
| Job CI Lighthouse | Non ajouté au workflow GitHub Actions (configuration prête seulement) |

## 3. Échecs préexistants (non introduits par CAT-07)

`npx vitest run` échoue sur 5 fichiers de `libs/ui`, tous antérieurs à ce ticket :

- `skeleton.component.spec.ts` — la spec utilise `shape`, entrée qui n’existe plus
  (`NG0303: Can't bind to 'shape' since it isn't a known property of 'bruny-skeleton'`).
- `size-selector.component.spec.ts` — `fixture.whenStable` sur un fixture `undefined`.
- ainsi que `input`, `price-tag`, `product-card` (mêmes specs obsolètes).

Aucun fichier de `libs/ui` n’est modifié par cette branche : ces échecs ne sont pas des
régressions CAT-07. Ils empêchent toutefois un « tous les tests verts » global demandé par
la DoD et doivent être traités dans un ticket dédié.

## 4. Réserves fonctionnelles

- Conformité P01 partielle : pas de spec écrite, pas de vues 768/1280, aucun état dessiné.
- « Meilleures Ventes » utilise `sort: 'newest'` (pas de tri popularité côté backend).
- Visuel hero de substitution ; lien Facebook en valeur par défaut.
- Mesure Lantern (`simulate`) : LCP 3 784 ms, sous les 2,5 s uniquement en mesure
  `devtools` — détail et justification dans `LIGHTHOUSE-REPORT.md`.
