# Contrôle d’accès par rôles (RBAC) — AUT-05

Ce document décrit le contrôle d’accès effectivement appliqué par l’API
BrunyShop. La source de vérité des permissions est
`backend/src/common/rbac/permissions.matrix.ts` ; le runtime applique les rôles
avec le décorateur `@Roles`.

## Principe : refus par défaut

`AppModule` enregistre deux gardes globales, dans cet ordre :

1. `JwtAuthGuard` : toute route sans `@Public` exige un jeton d’accès Bearer
   valide. Sans jeton → `401 UNAUTHORIZED`.
2. `RolesGuard` : si la route déclare `@Roles(...)`, l’utilisateur doit posséder
   au moins un des rôles listés. Sinon → `403 FORBIDDEN`.

Une route protégée mais sans `@Roles` reste accessible à tout compte
authentifié. Les routes d’administration doivent donc **toujours** déclarer
`@Roles`. `SUPER_ADMIN` possède tous les droits et satisfait n’importe quel
`@Roles`.

`@Public` est prioritaire sur `@Roles` : une route marquée publique reste
accessible anonymement, même si un rôle a été déclaré par erreur.

## Routes publiques

Les routes suivantes sont explicitement marquées `@Public` :

- `POST /api/v1/auth/register`, `/login`, `/refresh`, `/forgot-password`,
  `/reset-password`, endpoints 2FA ;
- `GET /api/v1/health` ;
- `GET /api/v1/products`, `/products/:slug`, `/categories`, `/size-guides` ;
- `POST /api/v1/cart/validate` ;
- lecture des médias locaux.

Toute nouvelle route est privée par défaut : il faut soit l’ouvrir avec
`@Public`, soit accepter un compte authentifié, soit la contraindre avec
`@Roles`.

## Codes d’erreur d’authentification

| Situation | Statut | `code` |
|---|---|---|
| Aucun jeton Bearer | 401 | `UNAUTHORIZED` |
| Jeton malformé ou signature invalide | 401 | `INVALID_TOKEN` |
| Jeton expiré | 401 | `TOKEN_EXPIRED` |
| Compte supprimé, `SUSPENDED` ou `DISABLED` | 401 | `INVALID_TOKEN` |
| Rôle insuffisant | 403 | `FORBIDDEN` |

Les rôles et le statut du compte sont relus en base à chaque requête. Un
changement de rôle ou une suspension prend donc effet immédiatement, sans
attendre l’expiration du jeton. `PENDING_VERIFICATION` reste autorisé tant que
le parcours de vérification d’e-mail n’existe pas.

## Matrice des permissions

`SA` = SUPER_ADMIN, `AD` = ADMIN, `OM` = ORDER_MANAGER,
`SM` = STOCK_MANAGER, `LI` = LIVREUR, `CU` = CUSTOMER.

| Permission | SA | AD | OM | SM | LI | CU |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `dashboard:read` | x | x |  |  |  |  |
| `product:read` | x | x | x | x |  | x |
| `product:write` | x | x |  | x |  |  |
| `product:delete` | x | x |  |  |  |  |
| `order:read` | x | x | x | x | x | x |
| `order:write` | x | x | x |  |  | x |
| `order:cancel` | x | x | x |  |  |  |
| `stock:read` | x | x | x | x |  |  |
| `stock:write` | x | x |  | x |  |  |
| `shipment:read` | x | x | x |  | x |  |
| `shipment:write` | x | x | x |  | x |  |
| `user:read` | x | x | x |  |  |  |
| `user:write` | x | x |  |  |  |  |
| `user:delete` | x |  |  |  |  |  |
| `coupon:read` | x | x | x |  |  |  |
| `coupon:write` | x | x |  |  |  |  |
| `setting:read` | x | x |  |  |  |  |
| `setting:write` | x | x |  |  |  |  |
| `audit:read` | x | x |  |  |  |  |
| `notification:read` | x | x | x |  |  |  |
| `size-guide:read` | x | x | x | x |  |  |
| `size-guide:write` | x | x |  | x |  |  |
| `media:write` | x | x |  | x |  |  |

`ADMIN` possède toutes les permissions sauf `user:delete`, réservée à
`SUPER_ADMIN`. `CUSTOMER` ne possède aucune permission d’administration : ses
accès personnels sont filtrés par identité, pas par cette matrice.

Le seed `backend/prisma/seeds/roles.seed.ts` matérialise cette matrice dans les
tables `Role`, `Permission` et `RolePermission`. Il est idempotent et ne
redéfinit aucune permission en dur.

## Application actuelle

| Domaine | Route | Rôles requis |
|---|---|---|
| Produits admin | `/admin/products*` | `STOCK_MANAGER`, `ADMIN`, `SUPER_ADMIN` |
| Médias admin | `/admin/media/*` | `STOCK_MANAGER`, `ADMIN`, `SUPER_ADMIN` |
| Guides de tailles admin | `/admin/size-guides/:id` | `STOCK_MANAGER`, `ADMIN`, `SUPER_ADMIN` |
| Notifications admin | `/admin/notifications/*` | `ADMIN`, `SUPER_ADMIN` |
| Profil | `/me` | tout compte authentifié |

Les routes `audit-logs`, `brands` et `config` citées dans certains documents ne
sont pas exposées par l’API à ce stade ; aucune route fictive n’a été créée.

## Protection IDOR

`GET /api/v1/me` construit la réponse à partir de `@CurrentUser()`, jamais
d’un identifiant fourni par le client. Un paramètre `?userId=` est ignoré : le
client A ne peut pas lire les données du client B.

Pour les futures ressources possédées par un utilisateur, la politique retenue
est : filtrer par `userId` issu du jeton et répondre **404** lorsqu’une
ressource existe mais appartient à un autre compte, afin de ne pas révéler son
existence. Aucun `OwnershipGuard` générique n’est introduit dans AUT-05 : il
devra être ajouté avec la première ressource concernée.

## Tester

```bash
pnpm -C backend test \
  src/common/guards/roles.guard.test.ts \
  src/common/guards/jwt-auth.guard.test.ts

pnpm -C backend test:e2e -- test/rbac.e2e-spec.ts
```

La suite `test/rbac.e2e-spec.ts` vérifie les routes publiques, les 401 sans
jeton, les 403 avec un rôle insuffisant, les 200/201 avec un rôle autorisé, le
rejet d’un faux `SUPER_ADMIN` injecté dans le jeton et l’isolation IDOR entre
deux clients. Elle nécessite PostgreSQL et Redis ainsi que les rôles seedés.
