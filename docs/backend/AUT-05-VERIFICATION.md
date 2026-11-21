# AUT-05 — Vérification du RBAC et du refus par défaut

Date des vérifications : **11 novembre 2026**
Branche : `feature/AUT-05-rbac-default-deny`

## Périmètre livré

- Matrice unique des permissions dans
  `backend/src/common/rbac/permissions.matrix.ts` (23 permissions, 6 rôles).
- `@Roles` typé avec `RoleName`, sans chaîne libre.
- `RolesGuard` global : `@Public` prioritaire, 401 `UNAUTHORIZED` sans
  utilisateur, 403 `FORBIDDEN` pour un rôle insuffisant.
- `JwtAuthGuard` global : 401 `UNAUTHORIZED` sans jeton, `INVALID_TOKEN` pour
  un jeton invalide, `TOKEN_EXPIRED` pour un jeton expiré.
- Rechargement en base de l’utilisateur, de ses rôles et de son statut à
  chaque requête ; comptes supprimés, `SUSPENDED` et `DISABLED` refusés.
- Seed des rôles et permissions aligné sur la matrice, idempotent.
- Suite e2e RBAC couvrant les routes publiques, les refus 401/403, les accès
  200/201, un faux `SUPER_ADMIN` dans le jeton et l’isolation IDOR A/B.
- Swagger/OpenAPI actualisé avec les codes d’erreur d’authentification.
- Documentation fonctionnelle : [`rbac.md`](./rbac.md).

## Critères d’acceptation

| Critère | Preuve | Résultat |
|---|---|---|
| Toute route non publique exige un jeton | `JwtAuthGuard` global + 5 cas e2e sans jeton | Conforme |
| Un rôle non autorisé reçoit 403 | 7 cas e2e `CUSTOMER`/`LIVREUR`/`ORDER_MANAGER` | Conforme |
| Un rôle autorisé accède à la route | 201 produits, 200 guide, 200 presign, 200 dead-letters | Conforme |
| `SUPER_ADMIN` satisfait tous les `@Roles` | Cas e2e dédié | Conforme |
| Les routes publiques restent anonymes | 10 cas e2e | Conforme |
| Les rôles du jeton ne suffisent pas | Faux `SUPER_ADMIN` dans le JWT → refus | Conforme |
| Un client ne lit pas les données d’un autre | `/me` avec `?userId=` et deux comptes | Conforme |
| La matrice est matérialisée en base | `seedRoles` exécuté puis interrogé | Conforme |
| Aucun secret ni route fictive ajouté | Revue du diff | Conforme |

## Commandes et résultats

### Typage et build

```bash
pnpm -C backend build
```

Résultat : **succès** (`prisma generate` + `tsc -p tsconfig.build.json`).

### Lint

```bash
pnpm -C backend lint
```

Résultat : **succès**, aucune erreur ni avertissement ESLint.

### Tests unitaires

```bash
pnpm -C backend test
```

Résultat : **212 tests / 212 passés**, 20 fichiers.

Dont les guards :

```bash
pnpm -C backend test \
  src/common/guards/roles.guard.test.ts \
  src/common/guards/jwt-auth.guard.test.ts
```

- `roles.guard.test.ts` : **11 tests**
- `jwt-auth.guard.test.ts` : **10 tests**

### Tests e2e

```bash
pnpm -C backend test:e2e
```

Résultat : **171 tests / 171 passés**, 9 fichiers.

Suite RBAC ciblée :

```bash
pnpm -C backend test:e2e -- test/rbac.e2e-spec.ts
```

Résultat : **38 tests / 38 passés**.

La suite complète inclut la mise à jour de `notifications.e2e-spec.ts`, qui
attend désormais `UNAUTHORIZED` au lieu de l’ancien `UNAUTHENTICATED`.

### Contrat OpenAPI

```bash
pnpm -C backend openapi:export
```

Résultat : **succès**, `backend/openapi.json` régénéré, **27 chemins**. Les
réponses 401 décrivent `UNAUTHORIZED`, `INVALID_TOKEN` et `TOKEN_EXPIRED` ; les
réponses 403 décrivent `FORBIDDEN`.

### Seed des rôles

Le seed complet `pnpm -C backend db:seed` n’a pas été exécuté : il exige
`SEED_SUPER_ADMIN_EMAIL` et `SEED_SUPER_ADMIN_PASSWORD`, volontairement absents
de l’environnement de travail. La partie concernée par AUT-05, `seedRoles`, a
été exécutée seule et de façon idempotente contre PostgreSQL, puis relue :

```text
SUPER_ADMIN=... (23 permissions, dont user:delete)
ADMIN=... (22 permissions, sans user:delete)
ORDER_MANAGER=11 permissions
STOCK_MANAGER=7 permissions
LIVREUR=3 permissions
CUSTOMER=3 permissions
```

Le détail exact est dans la matrice de [`rbac.md`](./rbac.md). Aucun secret
n’a été lu ni journalisé.

### Démarrage réel

Le binaire compilé a été démarré sur un port isolé, puis arrêté :

```bash
PORT=3999 node backend/dist/main.js
```

Résultats observés :

- `GET /api/v1/health/live` → **200**, `app: up`
- `GET /api/v1/health/ready` → **200**, `database: up`, `redis: up`
- `GET /api/v1/products` → **200**
- `POST /api/v1/admin/products` sans jeton → **401 `UNAUTHORIZED`**

## Limites connues

- Les tests e2e utilisent des jetons signés directement pour les rôles
  administratifs, car la connexion ADMIN est protégée par la 2FA. Le flux de
  connexion 2FA lui-même n’est pas modifié par AUT-05.
- Aucun `OwnershipGuard` générique n’est livré : la politique IDOR est appliquée
  sur `/me` et documentée pour les futures ressources.
- Les routes `audit-logs`, `brands` et `config` ne sont pas exposées ; elles
  n’ont pas été inventées pour satisfaire le ticket.
- Le seed complet dépend de secrets d’environnement et n’a pas été lancé ; seul
  `seedRoles`, périmètre AUT-05, a été vérifié.
