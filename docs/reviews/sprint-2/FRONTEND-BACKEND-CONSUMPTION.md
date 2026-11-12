# Matrice de consommation frontend ↔ backend (Sprint 2)

| Endpoint backend | Ticket | Méthode client généré | Wrapper Angular | Composant(s) consommateur(s) | Statut |
|---|---|---|---|---|---|
| POST /api/v1/auth/register | AUT-01/11 | AuthController_register | AuthService.register | Login/inscription (admin) | ✅ |
| POST /api/v1/auth/login | AUT-02/11 | AuthController_login | AuthService.login | Login pages | ✅ |
| POST /api/v1/auth/refresh | AUT-02/03 | AuthController_refresh | AuthService/RefreshQueue | Intercepteur auth | ✅ |
| POST /api/v1/auth/logout | AUT-03 | AuthController_logout | AuthService.logout | Logout | ✅ |
| POST /api/v1/auth/forgot-password | AUT-02 | AuthController_forgotPassword | AuthService | Login page | ✅ |
| POST /api/v1/auth/reset-password | AUT-02 | AuthController_resetPassword | AuthService | Reset page | ✅ |
| POST /api/v1/auth/2fa/setup | AUT-02 | AuthController_setupTwoFactor | AuthService | Admin login | ✅ |
| POST /api/v1/auth/2fa/verify | AUT-02 | AuthController_verifyTwoFactor | AuthService | Admin login | ✅ |
| GET /api/v1/auth/me (ou /me) | AUT-02 | — (HttpClient direct) | AuthService.restore/me | Session restore | ✅ |
| GET /api/v1/config | AUT-11 | PublicConfigController_getPublicConfig | PublicConfigService | Formulaires sensibles | ✅ |
| GET /api/v1/products | CAT-02 | CatalogController_listProducts | CatalogApi.list | CatalogPage, AdminProductsPage | ✅ |
| GET /api/v1/products/:slug | CAT-03 | CatalogController_listProducts (detail) | CatalogApi.get | ProductPage | ✅ |
| POST /api/v1/admin/products | CAT-04 | AdminProductsController_create | — | Aucun composant admin CRUD | ❌ (futur) |
| PATCH /api/v1/admin/products/:id | CAT-04 | AdminProductsController_update | — | Aucun | ❌ (futur) |
| DELETE /api/v1/admin/products/:id | CAT-04 | AdminProductsController_archive | — | Aucun | ❌ (futur) |
| PUT /api/v1/admin/products/:id/variants | CAT-04 | AdminProductsController_updateVariants | — | Aucun | ❌ (futur) |
| POST /api/v1/admin/products/:id/duplicate | CAT-04 | AdminProductsController_duplicate | — | Aucun | ❌ (futur) |
| POST /api/v1/admin/media/presign | CAT-05 | AdminMediaController_presign | — | Aucun | ❌ (futur) |
| POST /api/v1/admin/media/confirm | CAT-05 | AdminMediaController_confirm | — | Aucun | ❌ (futur) |
| DELETE /api/v1/admin/media/images/:id | CAT-05 | AdminMediaController_deleteImage | — | Aucun | ❌ (futur) |
| PATCH /api/v1/admin/media/images/reorder | CAT-05 | AdminMediaController_reorder | — | Aucun | ❌ (futur) |
| GET /api/v1/size-guides/:categoryId | CAT-06 | SizeGuidesController_getByCategoryId | — | Aucun | ❌ (futur) |
| PUT /api/v1/admin/size-guides/:id | CAT-06 | AdminSizeGuidesController_update | — | Aucun | ❌ (futur) |
| POST /api/v1/cart/validate | CRT-01 | CartController_validate | — | CartStore ne l'appelle pas | ⚠️ partiel / oubli |
| POST /api/v1/orders | STK-01 | OrdersController_create | — | Checkout non implémenté | ❌ (futur) |
| GET /api/v1/admin/notifications/dead-letters | NTF-01 | — (généré) | — | Aucun | ❌ (futur) |
| GET /api/v1/audit-logs | AUT-08 | — | — | Aucun | ❌ (futur) |

## Bilan

- ✅ Consommés : 12
- ⚠️ Partiels : 1 (`POST /cart/validate`)
- ❌ Non consommés : 14 (justifiés : admin, checkout et pages prévus au Sprint 3)

## Cas particuliers

- Les endpoints admin CRUD, média, size-guides, commandes, notifications et audit ne sont pas encore consommés par le frontend. C'est attendu pour le Sprint 2 côté storefront/admin minimal ; les pages d'administration complètes sont prévues pour le Sprint 3 (DSG-06).
- `POST /cart/validate` est un oubli partiel : `CartStore` maintient le panier localement et ne recalcule pas les écarts via le backend. À corriger ou à ticketiser pour le Sprint 3.
- Les types générés (TEC-09) sont présents et le client est généré, mais les services Angular de haut niveau ne wrappent pas encore tous les endpoints.
