# BO-05 — Vérification du générateur de grille couleurs × pointures

Date : 25 novembre 2026

Branche : `feat/BO-05-variant-grid-colors-sizes`

Ticket : #85 — « Générateur de grille de variantes couleurs × pointures »

## A. Résumé

La grille de variantes est intégrée à l’onglet « Variantes et stock » du formulaire BO-04. Le gérant sélectionne des couleurs et des pointures, génère toutes les combinaisons, puis édite chaque cellule : SKU, stock, seuil d’alerte et prix spécifique.

Les variantes déjà vendues ne sont plus supprimées : elles sont archivées, conservées avec leur SKU et leur historique, puis peuvent être réactivées. Le catalogue public, le panier, les commandes, les alertes de stock et les écrans de stock excluent les variantes archivées.

Décisions techniques principales :

- réutilisation du modèle `ProductVariant` et de l’unicité `(productId, color, size)` ;
- ajout de `archivedAt` plutôt qu’un nouveau modèle de variante ;
- réutilisation du générateur SKU backend, étendu pour réserver les SKU personnalisés ;
- API existante `PUT /admin/products/:id/variants` étendue avec `sku` et l’archivage automatique ;
- grille construite à partir du `FormArray` BO-04, sans second formulaire produit ;
- correction transverse de `bruny-button` : la sortie `(clicked)` existait dans les templates mais n’était pas exposée par le composant.

## B. Git

- Branche de base : `working`, HEAD `79ecf25` (BO-04 fusionné).
- Branche créée : `feat/BO-05-variant-grid-colors-sizes`.
- État initial : arbre propre, aucun travail BO-05 existant.
- Commit BO-05 créé localement après les vérifications, sans signature GPG.
- Aucun push effectué.

## C. Analyse préalable

- Architecture analysée : Angular standalone admin, `@bruny/ui`, data-access, NestJS/Prisma, RBAC et audit existants.
- BO-04 réutilisé : formulaire cinq onglets, `FormArray` des variantes, sauvegarde brouillon/publication, guard de sortie, API produits et options.
- CAT-04 réutilisé : modèle `ProductVariant`, générateur SKU, `PUT /variants`, mouvements de stock, audits et invalidation du cache.
- Aucun référentiel séparé de couleurs ou pointures n’existe : les valeurs sont des chaînes normalisées en majuscules, avec unicité par produit.
- Aucun mécanisme d’archivage de variante n’existait ; le service refusait toute suppression liée à une commande.
- `design1/bruny shopping/bruny shopping.png` a été examiné : planche de maquettes storefront/admin sans écran dédié à la grille. L’interface reprend donc la hiérarchie, les couleurs et les composants du back-office existant.
- Aucun job ou agent concurrent n’était actif sur les mêmes fichiers.

## D. Implémentation

### Backend

- `ProductVariant.archivedAt` et index associé.
- `GET /admin/products/:id` renvoie `archivedAt` et `orderCount` par variante.
- `POST /admin/products` et `PUT /admin/products/:id/variants` acceptent un `sku` personnalisé.
- Les SKU manuels sont normalisés en majuscules, validés et réservés dans le générateur pour éviter les collisions.
- Une variante retirée et liée à une commande est archivée, jamais supprimée.
- Une variante archivée renvoyée avec son `id` est réactivée sans perdre son identité.
- Une variante non vendue peut toujours être supprimée.
- Les suppressions et archivages sont audités (`PRODUCT_VARIANT_ARCHIVED`, `PRODUCT_VARIANT_RESTORED`).
- Les variantes archivées sont exclues des stocks admin, alertes, facettes, listes et détails publics, panier et création de commande.
- La publication ne considère que les variantes actives pour le contrôle de stock.

### Frontend

- Sélection de couleurs sous forme de jetons, avec ajout, suppression et refus des doublons.
- Pointures personnalisées et plage numérique de 15 à 60.
- Génération cartésienne complète, sans doublon, avec conservation des variantes et SKU existants.
- Grille responsive avec couleurs en lignes et pointures en colonnes.
- Chaque cellule contient SKU, stock, seuil d’alerte et prix spécifique.
- SKU affiché en aperçu avant sauvegarde et modifiable manuellement.
- Remplissage en masse par ligne ou colonne, sur le stock ou le seuil.
- Blocage des SKU dupliqués côté formulaire et backend.
- Confirmation explicite avant retrait d’une variante vendue.
- Liste des variantes archivées avec date, nombre de commandes et action de réactivation.
- États d’erreur, de sauvegarde et de modifications non enregistrées conservés.

## E. Fichiers principaux

### Créés

- `backend/prisma/migrations/20261125130000_bo05_variant_archiving/migration.sql` : colonne et index d’archivage.
- `docs/frontend/BO-05-VERIFICATION.md` : ce rapport.

### Modifiés

- `backend/prisma/schema.prisma` : `archivedAt`.
- `backend/src/modules/catalog/admin/dto/create-product.dto.ts` : SKU optionnel.
- `backend/src/modules/catalog/admin/dto/update-variants.dto.ts` : SKU modifiable.
- `backend/src/modules/catalog/admin/dto/admin-product-detail.dto.ts` : archivage et nombre de commandes.
- `backend/src/modules/catalog/admin/admin-product.mapper.ts` : métadonnées de variante.
- `backend/src/modules/catalog/admin/admin-products.service.ts` : SKU manuels, archivage, restauration.
- `backend/src/modules/catalog/admin/sku/sku-generator.service.ts` : réservation des SKU personnalisés.
- `backend/src/modules/catalog/admin/catalog-audit.actions.ts` : actions d’audit.
- `backend/src/modules/catalog/catalog.service.ts` : filtres publics.
- `backend/src/modules/catalog/products/product-detail.service.ts` : détails publics filtrés.
- `backend/src/modules/cart/cart-validation.service.ts` : variantes archivées non vendables.
- `backend/src/modules/orders/orders.service.ts` : commande refusée sur variante archivée.
- `backend/src/modules/inventory/admin/admin-stock.service.ts` : stock admin filtré.
- `backend/src/modules/inventory/admin/stock-alerts.service.ts` : alertes filtrées.
- `backend/test/admin-products.e2e-spec.ts` : SKU manuel, archivage, réactivation, catalogue public.
- `backend/src/modules/catalog/admin/admin-products.service.test.ts` : archivage.
- `frontend/apps/admin/src/app/features/products/product-form/*` : grille, SKU, masse, archivage.
- `frontend/apps/admin/src/app/features/products/product-form/product-form.component.spec.ts` : 17 tests.
- `frontend/libs/data-access/src/lib/admin-products-api.ts` : contrats SKU/archivage.
- `frontend/libs/ui/src/lib/button/*` : sortie `clicked` et test.
- `backend/openapi.json` et `frontend/libs/data-access/src/generated/api-types.ts` : contrats régénérés.

## F. Tests et vérifications

| Commande | Résultat réel |
| --- | --- |
| `cd backend && pnpm lint` | OK |
| `cd backend && pnpm exec tsc --noEmit -p tsconfig.build.json` | OK |
| `cd backend && pnpm exec vitest run` | 39 fichiers, 346/346 tests |
| `cd backend && pnpm exec vitest run --config vitest.e2e.config.ts test/admin-products.e2e-spec.ts` | 47/47 tests |
| Suite E2E backend complète | 22 fichiers OK, 274 tests réussis ; 1 échec préexistant hors BO-05 |
| `cd frontend && pnpm exec nx lint ui` | OK |
| `cd frontend && pnpm exec nx lint admin` | OK |
| `cd frontend && pnpm exec nx run-many -t typecheck` | OK (admin + storefront) |
| `cd frontend && pnpm exec nx build admin` | OK, chunk formulaire 81,63 kB |
| `pnpm exec vitest run apps/admin libs/ui/src/lib/button/button.component.spec.ts --maxWorkers=2` | 15 fichiers, 76/76 tests |
| `pnpm -C backend exec prisma migrate deploy` | Migration appliquée |
| `pnpm openapi:export` | 43 paths |
| `pnpm api:generate` | Types régénérés |
| Prettier sur les fichiers BO-05 | OK |

### Échec E2E préexistant

`test/order-status.e2e-spec.ts > limite le livreur aux constats de livraison` attend `403` et reçoit `400`. Le test n’a pas été modifié et le code concerné n’appartient pas à BO-05 : le contrôle PAY-01 de confirmation bloque la transition avant le contrôle de rôle. Cet échec est reproduit isolément et documenté, pas masqué.

## G. Vérification du démarrage réel

- API : `pnpm -C backend start`, `GET /api/v1/health/live` → 200.
- Admin : `pnpm -C frontend dev:admin`, `http://127.0.0.1:4201` → 200.
- Connexion réelle avec un compte SUPER_ADMIN temporaire et configuration 2FA TOTP automatisée.
- Parcours Chrome headless via Playwright :
  1. création d’un produit brouillon ;
  2. sélection NOIR/BLANC et 40/41 ;
  3. génération de 4 cellules ;
  4. saisie du SKU `BO05-UI-SKU`, stock 7, seuil 2 ;
  5. remplissage de la ligne NOIR avec stock 12 ;
  6. enregistrement, rechargement et vérification de la persistance ;
  7. ajout d’une commande de test liée à la variante ;
  8. retrait confirmé puis archivage de la variante vendue ;
  9. rechargement et présence de la variante dans « Variantes archivées ».
- Les données temporaires (produit, commande, utilisateur) ont été supprimées après le test.
- Les serveurs ont été arrêtés après vérification.

## H. Critères d’acceptation

| Critère | Statut | Justification |
| --- | --- | --- |
| Sélection couleurs et plage de pointures | Validé | Jetons couleurs, ajout manuel et plage 15–60. |
| Génération complète de la grille | Validé | Produit cartésien, doublons ignorés, variantes existantes conservées. |
| SKU automatique par variante | Validé | Générateur backend existant, aperçu UI, réservation des SKU manuels. |
| SKU modifiable manuellement | Validé | Champ éditable, validation, persistance et test E2E. |
| Saisie du stock par cellule | Validé | Champ par cellule, sauvegarde et persistance vérifiées. |
| Seuil d’alerte par variante | Validé | Champ par cellule et remplissage en masse. |
| Remplissage d’une ligne | Validé | Test unitaire et parcours Chrome. |
| Remplissage d’une colonne | Validé | Test unitaire, isolation des autres cellules. |
| Variantes vendues non supprimables | Validé | Archivage automatique au lieu de suppression. |
| Archivage et conservation de l’historique | Validé | `archivedAt`, relations commandes conservées, réactivation. |
| Grille fonctionnelle et responsive | Validé | Grille à défilement horizontal, styles back-office. |
| Intégration BO-04 | Validé | Même onglet, même formulaire, même guard. |
| API et contrats cohérents | Validé | OpenAPI et types régénérés. |
| Validations et erreurs | Validé | Doublons, SKU, stock, seuil, erreurs API. |
| Tests complets | Validé | 346 unitaires backend, 47 E2E admin, 76 frontend admin/UI. |
| Lint, typecheck, build | Validé | Tous réussis. |
| Démarrage et parcours réel | Validé | API, admin et parcours Chrome documentés. |
| Aucun commit/push non autorisé | Validé | Commit local autorisé, aucun push. |

## I. Limites et points restants

- L’échec E2E ORD-02 décrit ci-dessus reste à traiter dans le ticket concerné.
- La suite Vitest frontend complète reste sujette aux timeouts de parallélisation déjà observés sur BO-04 ; les suites admin et UI concernées passent avec `--maxWorkers=2`.
- La grille utilise un défilement horizontal pour les produits à nombreuses pointures ; aucun virtual scrolling n’est nécessaire à la limite actuelle de 300 variantes.
- Les variantes archivées restent dans le détail admin pour la traçabilité, mais ne sont plus visibles ni vendables publiquement.
- Aucune intégration de paiement ou de commande transactionnelle complète n’est revendiquée par ce ticket.

## J. Conclusion

BO-05 est implémenté, intégré au formulaire BO-04 et vérifié par tests automatisés et parcours navigateur réel. Les critères fonctionnels du ticket sont couverts. Le seul échec de suite complète est un test ORD-02 préexistant, hors périmètre BO-05, documenté sans être masqué.
