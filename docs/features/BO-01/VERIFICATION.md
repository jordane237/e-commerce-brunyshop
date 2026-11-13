# BO-01 — Vérification

Date des contrôles : **13 novembre 2026**.

## Résultats des 18 contrôles

| #   | Contrôle                               | Résultat | Preuve                                                                                                |
| --- | -------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| 1   | Branche dédiée active                  | ✅       | `git branch --show-current` → `feature/BO-01-admin-layout-navigation`                                 |
| 2   | Analyse design livrée                  | ✅       | `docs/features/BO-01/ANALYSE-DESIGN.md`                                                               |
| 3   | Note de sécurité livrée (CA #5)        | ✅       | `docs/features/BO-01/SECURITY-NOTE.md`                                                                |
| 4   | Source unique menus/rôles              | ✅       | `nav-items.config.ts` + `navRoles(id)` consommé par `app.routes.ts` et `shipments.routes.ts`          |
| 5   | Layout desktop repliable + mobile      | ✅       | Sidebar 240/64 px, drawer < 768 px, bottom nav ; e2e desktop + mobile                                 |
| 6   | Menus filtrés par rôle                 | ✅       | Tests unitaires + e2e SUPER_ADMIN, ADMIN, ORDER_MANAGER, STOCK_MANAGER, LIVREUR                       |
| 7   | Routes protégées authGuard + roleGuard | ✅       | `app.routes.spec.ts` (7 tests) : anonyme, CUSTOMER, STOCK_MANAGER, LIVREUR, guestGuard                |
| 8   | Fil d'Ariane + titre de page           | ✅       | `route-meta.service.spec.ts`, e2e `/produits` et `/audit`, un seul `<h1>`                             |
| 9   | Notifications d'actions                | ✅       | `ToastComponent` monté dans `App`, `ToastService` TEC-12 ; cloche prête avec `unreadCount`            |
| 10  | Page 403                               | ✅       | `forbidden-page.spec.ts` (2 tests), e2e `/audit` STOCK_MANAGER et URL inconnue                        |
| 11  | Session expirée contextuelle           | ✅       | e2e : 401 produits + refresh 401 → `/connexion` + toast « Votre session a expiré. Reconnectez-vous. » |
| 12  | Tests unitaires admin                  | ✅       | `npx vitest run apps/admin` → **11 fichiers, 31 tests réussis**                                       |
| 13  | Tests e2e admin                        | ✅       | `playwright test --config=playwright.admin.config.ts` → **17 tests réussis**                          |
| 14  | Build production admin                 | ✅       | `npx nx build admin --configuration=production` → succès                                              |
| 15  | Build production boutique              | ✅       | `npx nx build storefront --configuration=production` → succès                                         |
| 16  | ESLint + typecheck                     | ✅       | `npx eslint .` → 0 erreur ; `tsc --noEmit -p apps/admin/tsconfig.app.json` → succès                   |
| 17  | Backend démarré et non-régression API  | ✅       | `node dist/main.js` ; `/api/v1/health/ready` → 200 (DB + Redis up) ; `/api/v1/products?limit=8` → 200 |
| 18  | Boutique démarrée et non-régression    | ✅       | `nx serve storefront` ; `/` → 200 ; `/catalogue` → 302 vers `/boutique`, puis 200                     |

## Détail des tests

### Unitaires admin — 31/31

```text
Test Files  11 passed (11)
Tests       31 passed (31)
```

Couverture : layout, sidebar, header, bottom nav, drawer mobile, breadcrumb,
page title, cloche, page 403, `RouteMetaService` et routes/guards avec
`RouterTestingHarness`.

### E2E admin — 17/17

```text
Running 17 tests using 4 workers
17 passed (14.8s)
```

Scénarios couverts :

1. visiteur anonyme → connexion avec `returnUrl` ;
2. SUPER_ADMIN → tous les modules ;
3. STOCK_MANAGER → menu filtré ;
4. STOCK_MANAGER → 403 sur `/audit` ;
5. ORDER_MANAGER → menu filtré ;
6. LIVREUR → Mes livraisons uniquement ;
7. repli sidebar + persistance après rechargement ;
8. fil d'Ariane + titre Produits ;
9. menu utilisateur → profil ;
10. fermeture du menu utilisateur avec Échap ;
11. déconnexion → connexion ;
12. session expirée → toast + redirection ;
13. fil d'Ariane Audit ;
14. URL inconnue → 403 ;
15. mobile → bottom nav visible, sidebar masquée, navigation ;
16. mobile → drawer complet, fermeture Échap ;
17. mobile LIVREUR → 2 entrées.

Les tests e2e simulent les rôles par interception de `/auth/refresh`, `/me` et
des produits : aucun compte STOCK_MANAGER/LIVREUR n'existe dans le seed. Ce
choix est documenté et ne modifie pas le code de production.

## Point hors périmètre

La suite frontend globale (`npx vitest run`) reste rouge :

```text
Test Files  5 failed | 48 passed (53)
Tests       41 failed | 194 passed (235)
```

Ces 41 échecs sont **préexistants** et concernent des composants UI/storefront
non modifiés par BO-01 (Skeleton, SizeSelector, Input, PriceTag, ProductCard).
Ils sont déjà consignés dans
`docs/reviews/sprint-2/VERIFICATION-FINALE.md` (« 5 suites UI en échec, 41 tests
échoués ») et `docs/reviews/sprint-2/AUDIT-TEC-08.md`. Les 31 tests admin et les
17 e2e BO-01 sont verts.

## Limites de vérification

- Les comptes SUPER_ADMIN/STOCK_MANAGER/LIVREUR n'ont pas été créés dans le
  seed : les parcours par rôle sont vérifiés par Playwright avec une session
  HTTP mockée, pas par connexion manuelle sur des comptes réels.
- La cloche de notifications affiche volontairement 0 : l'API de notifications
  reste à livrer.
- Les modules autres que Produits sont des placeholders BO-01.

## Fichiers non liés à BO-01

`frontend/angular.json` était déjà modifié avant le ticket (`allowedHosts`,
CAT-08) et ne doit pas être inclus dans le commit BO-01. Aucun secret, aucun
`dist/` ni résultat de test n'est versionné.
