# BRUNY SHOPPING

Fondation d’une boutique en ligne de chaussures pour le Cameroun : interface en français, prix en FCFA, boutique SSR, espace d’administration et API modulaire.

## Démarrage local

Prérequis : Git, Node.js `24.11.0` (voir `.nvmrc`), pnpm `12.11.2` et Docker Compose.

```bash
git clone <URL_DU_DEPOT> bruny-shopping
cd bruny-shopping
pnpm install
cp .env.example .env   # définir au minimum DATABASE_URL, REDIS_URL et JWT_ACCESS_SECRET
pnpm docker:up
pnpm db:migrate && pnpm db:seed
```

Lancer ensuite l’API avec `pnpm dev:api`, la boutique avec `pnpm dev:storefront` et l’administration avec `pnpm dev:admin`. La boutique est disponible sur `http://localhost:4200`, l’admin sur `http://localhost:4201`, l’API sur `http://localhost:4000/api/v1` et Swagger en développement sur `http://localhost:4000/api/docs`.

Le mot de passe du compte seed est lu depuis `SEED_ADMIN_PASSWORD`. Le seed est réservé au développement et refuse de créer le compte administrateur en production.

## Commandes

| Commande                                                  | Description                                                     |
| --------------------------------------------------------- | --------------------------------------------------------------- |
| `pnpm docker:up` / `pnpm docker:down`                     | Démarrer / arrêter PostgreSQL, Redis et Mailpit                 |
| `pnpm dev:api` / `pnpm dev:storefront` / `pnpm dev:admin` | Démarrer un composant en développement                          |
| `pnpm build`                                              | Compiler l’API, le storefront SSR et l’admin                    |
| `pnpm lint` / `pnpm typecheck`                            | Vérifier le style et les types                                  |
| `pnpm test` / `pnpm test:e2e`                             | Lancer les tests unitaires / API e2e (services actifs requis)   |
| `pnpm db:migrate` / `pnpm db:seed`                        | Appliquer les migrations / charger les données de démonstration |
| `pnpm api:generate`                                       | Générer les types TypeScript depuis Swagger (API en marche)     |

## Structure

- `backend/` : API NestJS, schéma et migrations Prisma, modules métier.
- `frontend/apps/storefront/` : boutique Angular SSR et hydratation.
- `frontend/apps/admin/` : SPA Angular d’administration.
- `frontend/libs/` : client API et état, composants partagés, utilitaires et tokens visuels.
- `infra/` : images Docker et configurations Nginx.
- `docs/` : décisions, architecture, sécurité et conventions.

## Configuration

Copier `.env.example` vers `.env`; chaque variable y est décrite. Les secrets réels ne doivent jamais être commités. Les ports PostgreSQL et Redis publiés par Compose ne servent qu’au développement local. Pour la configuration sans ports de base de données exposés, voir `docker-compose.production.yml`.

## Vérifications

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Les tests e2e ont besoin de PostgreSQL et Redis, puis des migrations appliquées. Pour une vérification SSR, lancer l’API et le storefront puis consulter le HTML retourné par `curl -s http://localhost:4200/boutique`.

## Qualité de code

Le monorepo applique une chaîne d’outils de qualité, activée à chaque commit :

| Outil           | Rôle                                                              | Fichier de config                          |
| --------------- | ----------------------------------------------------------------- | ------------------------------------------ |
| **ESLint**      | Règles statiques + **frontières de modules** (frontend Nx et backend NestJS) | `frontend/eslint.config.mjs`, `backend/eslint.config.mjs` |
| **Prettier**    | Formatage uniforme (2 espaces, LF, guillemets simples, 100 colonnes) | `.prettierrc`, `.prettierignore`           |
| **Husky** v9    | Hooks Git : `pre-commit` (lint-staged), `commit-msg` (commitlint), `pre-push` (protège `main`) | `.husky/`                                  |
| **lint-staged** | Applique ESLint + Prettier aux fichiers stagés uniquement        | `package.json` (champ `lint-staged`)       |
| **commitlint**  | Messages de commit en **Conventional Commits**                    | `commitlint.config.mjs`                    |
| **Renovate**    | Mises à jour des dépendances (groupées Angular, Nx, NestJS, Prisma, tooling) | `renovate.json`                            |

### Frontières de modules

- **Frontend (Nx)** : la règle `@nx/enforce-module-boundaries` applique des `depConstraints` à partir des tags de chaque projet (`type:app`, `type:ui`, `type:util`, `type:data-access`, `type:styles`). Une feature/app ne peut pas dépendre d’une autre feature/app, uniquement des couches infra.
- **Backend (NestJS)** : `no-restricted-imports` interdit les imports directs entre modules frères dans `src/modules/**`. On passe par la composition NestJS (`imports: [...]`) ou le code partagé dans `src/common/`.

### Commandes de vérification

```bash
pnpm lint        # ESLint backend + frontend (frontières incluses)
pnpm typecheck   # tsc --noEmit backend + frontend (strict)
pnpm format      # Prettier : formate tout sauf *.md
```

Les hooks Husky bloquent un commit non conforme : message hors Conventional Commits rejeté par commitlint, fichiers mal formatés reformatés par lint-staged avant commit.

## Documentation et limites connues

Lire [l’architecture](docs/architecture.md), [la sécurité](docs/security.md), [les conventions](docs/conventions.md) et les [ADR](docs/adr/README.md). Cette livraison est une fondation : panier côté client et flux de paiement/commande ne sont pas encore des parcours transactionnels complets; les modules correspondants sont câblés mais restent des squelettes.
