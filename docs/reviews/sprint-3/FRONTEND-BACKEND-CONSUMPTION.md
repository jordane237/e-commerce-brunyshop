# Consommation frontend ↔ backend — Sprint 3

- **Date** : 19 novembre 2026
- **Périmètre** : 33 opérations exposées dans `backend/openapi.json`.
- **Méthode** : lecture de `openapi.json`, des wrappers `frontend/libs/data-access/src/lib/*`, de `frontend/libs/core/src/lib/auth/auth.service.ts`, puis recherche des usages dans les applications storefront et admin.
- **Convention** : ✅ consommé, ⚠️ partiel, ❌ non consommé avec justification.

> Le dépôt n'utilise pas les services générés d'un générateur OpenAPI : TEC-09 a généré les **types** (`api-types.ts`) et des wrappers typés manuels (`CatalogApi`, `AdminProductsApi`, `CartApi`, `ContactApi`, `PublicConfigService`). L'authentification passe directement par `HttpClient` dans `AuthService`.

## 1. Matrice

| # | Endpoint | Ticket | Wrapper / client | Consommateur | Statut |
|---|---|---|---|---|---|
| 1 | `GET /api/v1/products` | CAT-02 → CAT-07/CAT-08 | `CatalogApi.list` | `HomeDataService`, `CatalogStore` | ✅ |
| 2 | `GET /api/v1/products/{slug}` | CAT-03 → CAT-10 | `CatalogApi.get` | `ProductDetailStore` | ✅ |
| 3 | `GET /api/v1/categories` | CAT-01 → CAT-07/BO-03 | `CatalogApi.categories` | `HomeDataService`, `AdminProductsStore` | ✅ |
| 4 | `GET /api/v1/size-guides/{categoryId}` | CAT-06 → CAT-10 | Aucun | `SizeGuideComponent` utilise une copie statique du seed | ❌ oubli partiel |
| 5 | `POST /api/v1/cart/validate` | CRT-01 → CRT-02/03/04 | `CartApi.validate` | `CartStore` (boot, panier, mini-panier) | ✅ |
| 6 | `POST /api/v1/orders` | ORD-01 | Aucun | Aucun écran P11/P12 | ❌ futur justifié |
| 7 | `POST /api/v1/auth/register` | AUT-01/AUT-09 | `AuthService.register` | `RegisterComponent` | ✅ |
| 8 | `POST /api/v1/auth/login` | AUT-02/AUT-09 | `AuthService.login` | `LoginComponent`, `admin/login-page` | ✅ |
| 9 | `POST /api/v1/auth/refresh` | AUT-02/TEC-12 | `AuthService.refresh` | `auth.interceptor`, `SessionRestoreService` | ✅ |
| 10 | `POST /api/v1/auth/logout` | AUT-03 | `AuthService.logout` | Header admin / session | ✅ |
| 11 | `GET /api/v1/me` | AUT-02/TEC-12 | `AuthService.me` | `SessionRestoreService` | ✅ |
| 12 | `POST /api/v1/auth/2fa/setup` | AUT-xx | Aucun | Aucun écran 2FA client | ❌ futur justifié |
| 13 | `POST /api/v1/auth/2fa/verify` | AUT-xx | Aucun | Aucun écran 2FA client | ❌ futur justifié |
| 14 | `POST /api/v1/auth/forgot-password` | AUT-xx | Aucun | Route P16 non livrée (lien mort dans AUT-09) | ❌ oubli |
| 15 | `POST /api/v1/auth/reset-password` | AUT-xx | Aucun | Route P16 non livrée | ❌ oubli |
| 16 | `GET /api/v1/config` | AUT-11/TEC-13 | `PublicConfigService.getConfig` | Login/inscription/contact, login admin | ✅ |
| 17 | `POST /api/v1/contact` | MKT-02 | `ContactApi.submit` | `ContactComponent` | ✅ |
| 18 | `GET /api/v1/admin/products` | CAT-04 → BO-03 | `AdminProductsApi.list` | `AdminProductsStore` → liste produits | ✅ |
| 19 | `POST /api/v1/admin/products` | CAT-04 | Aucun | Création produit non livrée (BO-04 futur) | ❌ futur justifié |
| 20 | `PATCH /api/v1/admin/products/{id}` | CAT-04 → BO-03 | `AdminProductsApi.updateStatus` | `AdminProductsStore` (publier/masquer) | ✅ |
| 21 | `DELETE /api/v1/admin/products/{id}` | CAT-04 → BO-03 | `AdminProductsApi.archive` | `AdminProductsStore` (archiver) | ✅ |
| 22 | `POST /api/v1/admin/products/{id}/duplicate` | CAT-04 | Aucun | Duplication non livrée | ❌ futur justifié |
| 23 | `PUT /api/v1/admin/products/{id}/variants` | CAT-04 | Aucun | Édition variantes non livrée | ❌ futur justifié |
| 24 | `PUT /api/v1/admin/size-guides/{id}` | CAT-06 | Aucun | Édition guide non livrée | ❌ futur justifié |
| 25 | `GET /api/v1/admin/stock/alerts` | STK-03 | Aucun | Dashboard et page Stock = placeholders | ❌ oubli (CA #3) |
| 26 | `POST /api/v1/admin/media/presign` | CAT-05 | Aucun | Formulaire produit non livré | ❌ futur justifié |
| 27 | `POST /api/v1/admin/media/confirm` | CAT-05 | Aucun | Formulaire produit non livré | ❌ futur justifié |
| 28 | `PATCH /api/v1/admin/media/images/reorder` | CAT-05 | Aucun | Formulaire produit non livré | ❌ futur justifié |
| 29 | `DELETE /api/v1/admin/media/images/{id}` | CAT-05 | Aucun | Formulaire produit non livré | ❌ futur justifié |
| 30 | `GET /api/v1/admin/notifications/dead-letters` | NTF-01 | Aucun | Cloche admin figée à 0 | ❌ futur justifié |
| 31 | `GET /api/v1/admin/notifications/{id}` | NTF-01 | Aucun | Cloche admin figée à 0 | ❌ futur justifié |
| 32 | `GET /api/v1/health/live` | TEC-05 | N/A | Supervision, pas le frontend | ➖ hors périmètre |
| 33 | `GET /api/v1/health/ready` | TEC-05 | N/A | Supervision, pas le frontend | ➖ hors périmètre |

## 2. Bilan

| Statut | Nombre | Commentaire |
|---|---|---|
| ✅ Consommés | 14 | Tous les flux du Sprint 3 réellement livrés côté UI |
| ⚠️ Partiels | 0 | Aucun endpoint n'est appelé avec un contrat incomplet |
| ❌ Non consommés | 17 | 13 justifiés par un écran futur, 4 oublis (size-guides, mot de passe oublié/réinitialisation, stock alerts) |
| ➖ Hors périmètre | 2 | Health checks d'infrastructure |

## 3. Écarts à traiter

1. **`GET /size-guides/{categoryId}`** — la page `/guide-des-tailles` affiche une copie statique du seed et la fiche produit ne transmet pas la catégorie. L'API CAT-06 n'est donc jamais exercée en production. **Action** : brancher `SizeGuideComponent` sur l'API et ajouter `?category=` depuis CAT-10.
2. **`GET /admin/stock/alerts`** — le backend STK-03 est complet mais aucun écran ne l'appelle. **Action** : implémenter la carte d'alertes du dashboard A03 ou la page Stock (CA #3 de STK-03).
3. **`POST /auth/forgot-password` et `reset-password`** — le lien « Mot de passe oublié » de AUT-09 pointe vers une route inexistante. **Action** : livrer P16 ou retirer le lien.
4. **`POST /orders`** — aucun wrapper `OrdersApi` n'existe. **Action** : à créer avec P11 (checkout) et à relier à `UtmService` pour le CA #3 de MKT-04.

## 4. Points de conception

- Les wrappers sont typés à partir de `api-types.ts` généré ; une dérive de contrat casse la compilation après `pnpm api:generate`.
- `AuthService` n'utilise pas le client généré mais respecte les mêmes chemins et `withCredentials`.
- Aucun appel direct à une URL absolue hors `API_BASE_URL` (`/api/v1`).
- Aucun endpoint backend du Sprint 3 n'est dupliqué en Mock côté frontend, à l'exception des données statiques du guide des tailles.
