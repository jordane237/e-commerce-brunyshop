# BO-04 — Vérification du formulaire produit en onglets

Date : 24 novembre 2026

Branche : `feat/BO-04-product-form-tabs`

Ticket : #84 — « Formulaire produit en onglets »

## Périmètre livré

- Formulaire produit admin en cinq onglets : **Informations**, **Variantes et stock**, **Images**, **Tarifs**, **SEO**.
- Validation réactive avec messages français, compteur d’erreurs et navigation vers le premier onglet invalide.
- Génération de variantes par combinaisons couleur × pointure, avec détection des doublons.
- Enregistrement en brouillon et publication ; la publication exige au moins une variante avec stock positif.
- Aperçu MVP de la fiche produit dans une modale.
- Duplication d’un produit existant en brouillon.
- Avertissement de sortie avec modifications non enregistrées (`CanDeactivate` + dialogue de confirmation + `beforeunload`).
- Gestion des images : ajout par URL à la création, téléversement presign/confirm après création du brouillon, suppression et réorganisation des images persistées.
- Endpoints backend ajoutés : `GET /admin/products/:id` et `GET /admin/catalog/options`.
- Gestion de l’effacement d’une promotion par `null` dans la mise à jour produit.

## Vérifications exécutées

| Commande | Résultat |
| --- | --- |
| `pnpm -C frontend exec prettier --check …` (fichiers BO-04) | OK après formatage |
| `pnpm -C frontend exec nx lint admin` | OK |
| `pnpm -C frontend exec nx run-many -t typecheck` | OK — admin et storefront |
| `pnpm -C frontend exec nx build admin` | OK — bundle production, chunk `product-form-component` 62,37 kB |
| `pnpm -C frontend exec vitest run apps/admin/src/app/features/products/product-form/product-form.component.spec.ts` | OK — 12/12 tests |
| `pnpm -C frontend exec vitest run apps/admin/src/app/app.routes.spec.ts` | OK — 7/7 tests |
| `pnpm -C backend lint` | OK |
| `pnpm -C backend exec tsc --noEmit -p tsconfig.build.json` | OK |
| `pnpm -C backend exec vitest run` | OK — 39 fichiers, 346/346 tests |
| `pnpm -C backend exec vitest run --config vitest.e2e.config.ts test/admin-products.e2e-spec.ts` | OK — 45/45 tests, dont 4 nouveaux cas BO-04 |
| `pnpm openapi:export` puis `pnpm api:generate` | OK — contrat et types TypeScript régénérés |
| Démarrage réel `pnpm -C backend start` | OK — `GET /api/v1/health/live` → 200 `status: ok` |
| Démarrage réel `pnpm -C frontend dev:admin` | OK — `http://127.0.0.1:4201/` → 200 |
| Routes protégées sans jeton | `GET /admin/catalog/options` → 401 ; `GET /admin/products/:id` → 401 |

Les serveurs de vérification ont été arrêtés après les contrôles.

## Couverture des tests ajoutés

### Backend (`backend/test/admin-products.e2e-spec.ts`)

- Détail admin d’un produit : 200 avec catégorie, marque, variantes et images.
- Détail d’un produit inexistant : 404.
- Options catégories/marques : 200 et présence des données créées.
- Options réservées aux rôles catalogue : 403 pour `CUSTOMER`.

### Frontend (`product-form.component.spec.ts`)

- Initialisation d’un brouillon avec variante vide et chargement des options.
- Refus d’un brouillon invalide.
- Création d’un brouillon avec variantes et redirection vers l’édition.
- Publication refusée sans stock.
- Publication acceptée avec stock.
- Chargement d’un produit existant sans faux positif de modification.
- Confirmation et annulation de sortie avec modifications.
- Génération couleur × pointure sans doublon.
- Ajout d’une image par URL et rejet d’une URL invalide.
- Duplication en brouillon avec redirection.

## Limites connues

- La suite Vitest frontend complète lancée avec la parallélisation par défaut a produit 18 timeouts dans des specs préexistantes non liées à BO-04 (storefront et routes admin). Les specs admin concernées et le formulaire passent lorsqu’ils sont exécutés isolément ; le problème observé est une contention d’exécution, pas un échec fonctionnel reproduit.
- Aucune suite Playwright dédiée au back-office n’existe dans le dépôt ; le parcours navigateur complet création → publication n’a donc pas été automatisé. Les flux correspondants sont couverts par les tests composant et les tests E2E API.
- L’aperçu produit est volontairement une modale MVP, pas une route de prévisualisation complète.
- Les images par URL sont proposées à la création uniquement ; en édition, les images passent par le pipeline média existant. Le téléversement de fichiers nécessite qu’un brouillon ait déjà été créé, car le presign exige un produit existant.
- La régénération OpenAPI a aussi intégré des routes `shipping` déjà présentes dans le code mais absentes du contrat versionné avant ce ticket. Ce diff est antérieur à BO-04 et n’a pas modifié le comportement de livraison.
- BRUNY SHOPPING reste une fondation e-commerce : aucun paiement, aucune commande transactionnelle complète et aucune intégration de production ne doit être considérée comme livrée par ce ticket.

## État Git

Aucun commit ni push n’a été effectué. Les modifications et fichiers non suivis restent dans l’arbre de travail de la branche `feat/BO-04-product-form-tabs`.
