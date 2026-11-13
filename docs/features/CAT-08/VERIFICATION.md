# CAT-08 — Vérification

Date : 13 novembre 2026
Branche : `feature/CAT-08-catalog-page`
Base : `a8f9808` (CAT-07)
Environnement : Linux, Node 24, backend NestJS local sur `:4000`, seed de 20 produits.

## Résultat des 16 vérifications

| #   | Vérification                                | Résultat       | Preuve                                                                                                         |
| --- | ------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------- |
| 1   | Branche dédiée active                       | ✅             | `git branch --show-current` → `feature/CAT-08-catalog-page`                                                    |
| 2   | Analyse design produite                     | ✅             | `docs/features/CAT-08/ANALYSE-DESIGN.md`                                                                       |
| 3   | Build storefront production                 | ✅             | `npx nx build storefront --configuration=production` → succès                                                  |
| 4   | Build admin production (non-régression)     | ✅             | `npx nx build admin --configuration=production` → succès                                                       |
| 5   | Tests unitaires du catalogue                | ✅             | `npx vitest run apps/storefront/src/app/features/catalog` → **59/59**, 11 fichiers                             |
| 6   | Tests e2e catalogue                         | ✅             | `npx playwright test e2e/catalog.spec.ts` → **13/13**, deux exécutions consécutives                            |
| 7   | ESLint frontend                             | ✅             | `npx eslint .` → 0 erreur                                                                                      |
| 8   | Formatage                                   | ✅             | `npx prettier --check` sur le feature et le spec e2e                                                           |
| 9   | Backend prêt                                | ✅             | `GET /api/v1/health/ready` → 200                                                                               |
| 10  | SSR production, HTML filtré                 | ✅             | `GET :4100/boutique?category=sneakers` → 200, 56 978 octets, « 4 produits » et les 4 noms de sneakers présents |
| 11  | Desktop : grille, filtres, tri, pagination  | ✅             | e2e desktop : 12 cartes, filtre catégorie, tri, pages numérotées                                               |
| 12  | Mobile : tiroir et « Voir les N résultats » | ✅             | e2e 390 × 844 : ouverture, filtre, libellé « Voir les 4 résultats », fermeture, URL et grille à jour           |
| 13  | Retour arrière                              | ✅             | e2e : catégorie + pointure → `goBack()` → pointure retirée, catégorie et 4 cartes restaurées                   |
| 14  | État « Aucun résultat »                     | ✅             | e2e `?size=99` → message du glossaire, réinitialisation, retour à 12 cartes                                    |
| 15  | Partage d'URL                               | ✅             | e2e `?category=sneakers&size=42` → titre, puces, contrôles cochés et 4 cartes identiques                       |
| 16  | Lighthouse `/boutique`                      | ❌ non exécuté | Aucun outil ni configuration Lighthouse dans le dépôt ; voir « Limites »                                       |

## Détail des preuves

### Tests unitaires

```text
Test Files  11 passed (11)
Tests       59 passed (59)
```

Couverture : mapping URL ↔ filtres (19), store (10), en-tête (3), sidebar (5),
tri (1), tiroir (4), puces (3), grille (2), état vide (2), pagination (4),
page et synchronisation URL (6).

Un cas limite a été corrigé pendant la vérification : après l'échec d'un
« Voir plus », `retry()` rejoue désormais le chargement en **ajout** et ne
remplace plus la liste par la seule page 2.

### Tests e2e

```text
Running 13 tests using 10 workers
13 passed
```

Scénarios : première page et fiche produit, filtre catégorie, retour arrière,
tri, suppression des puces une à une, réinitialisation globale, état vide,
pagination desktop, URL partagée, SSR, tiroir mobile, fermeture par Échap avec
retour du focus, « Voir plus » mobile puis retour arrière.

Les tests attendent la fin de l'hydratation (`networkidle`) avant la première
interaction, sinon un clic peut atteindre le HTML SSR avant qu'Angular n'écoute.

### SSR

Commande :

```bash
cd frontend
npx nx build storefront --configuration=production
PORT=4100 node dist/apps/storefront/server/server.mjs
curl 'http://localhost:4100/boutique?category=sneakers'
```

Le HTML contient `Sneakers CamoStride Pulse`, `Sneakers UrbanStep Tempo`,
`Sneakers UrbanStep Lady`, `Sneakers UrbanStep Air` et `4 produits`.
`provideClientHydration(withEventReplay())` et `withFetch()` sont déjà actifs ;
le cache de transfert HTTP par défaut de l'hydratation est donc utilisé.

### Suite frontend complète

`npx vitest run` : **163/204** tests passent. Les 41 échecs concernent
exclusivement cinq specs de `libs/ui` non modifiées :

- `libs/ui/src/lib/input/input.component.spec.ts`
- `libs/ui/src/lib/price-tag/price-tag.component.spec.ts`
- `libs/ui/src/lib/product-card/product-card.component.spec.ts`
- `libs/ui/src/lib/size-selector/size-selector.component.spec.ts`
- `libs/ui/src/lib/skeleton/skeleton.component.spec.ts`

Ces échecs se reproduisent en lançant le spec seul (ex. `skeleton.component.spec.ts`
échoue sur un input `shape` inexistant) et sont indépendants du catalogue.

## Écarts assumés par rapport au ticket

- **Route `/boutique`** au lieu de `/catalogue` : glossaire et liens existants.
- **4 tris** (`newest`, `price_asc`, `price_desc`, `name`) : le backend renvoie
  400 pour `name_asc` et ne fournit pas `popular`.
- **12 produits par page** (et non 24) : multiple de 2/3/4 et pagination
  démontrable avec le seed de 20 produits.
- **Sélecteur de tri natif** au lieu d'une listbox custom : accessible au
  clavier et au lecteur d'écran sans réimplémenter un widget ARIA.
- **Prix validés sur `change`** au lieu d'un debounce : une seule requête par
  valeur confirmée, pas une par frappe.
- **Composants dans le feature** : le tiroir et les puces dépendent du
  vocabulaire du catalogue ; ils restent standalone et sans import cross-feature.

## Limites

- **Lighthouse non mesuré** : aucun script, aucune dépendance et aucun
  `.lighthouserc` dans le dépôt. Le budget Performance ≥ 85 / LCP ≤ 2 500 ms
  reste donc à vérifier avant de l'annoncer.
- **Pas d'audit axe automatisé** : les rôles, libellés, focus visible, Échap et
  le piège de focus sont couverts par les tests, mais pas par un scan WCAG
  exhaustif ni un test lecteur d'écran.
- **Parcours d'erreur réseau** couvert par les tests unitaires du store, pas par
  un scénario e2e avec interception d'API.
- Les états reposent sur les 20 produits du seed : aucune promotion active et
  tout est en stock. Les filtres `promo=true` et `inStock=false` ne sont pas
  démontrables visuellement avec ce jeu de données.
