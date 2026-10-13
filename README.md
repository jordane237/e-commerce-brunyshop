# BRUNY SHOPPING

Plateforme e-commerce de chaussures (Cameroun · français · FCFA).

**Stack** : Angular (storefront SSR + admin SPA) · NestJS (monolithe modulaire) · PostgreSQL · Prisma · Redis · BullMQ · Docker · GitHub Actions.

## Structure du dépôt

```
backend/           # API NestJS + Prisma (monolithe modulaire)
frontend/          # workspace Nx — applications et bibliothèques Angular
  apps/storefront/   # boutique publique (SSR + hydratation)
  apps/admin/        # back-office (SPA)
  libs/{ui,data-access,util,design-tokens}/
infra/             # Dockerfiles, Nginx, scripts utilitaires
docs/              # architecture, ADR, guides
```

## Installation locale (5 commandes)

```bash
git clone <repo> && cd bruny-shopping
pnpm install            # installe les dépendances
cp .env.example .env    # crée votre configuration locale
docker compose up -d    # démarre PostgreSQL + Redis (étape 2)
pnpm db:migrate && pnpm db:seed   # base de données (étape 4)
```

## Scripts

| Commande                   | Rôle                                                |
| -------------------------- | --------------------------------------------------- |
| `pnpm lint`                | ESLint sur le frontend (backend ajouté à l'étape 3) |
| `pnpm format`              | Formatage Prettier                                  |
| `pnpm test` / `pnpm build` | Tests et builds (activés aux étapes 3/7)            |

## Qualité

- **TypeScript strict** partout.
- **Husky + lint-staged** : formatage et lint avant chaque commit.
- **commitlint** : messages de commit conventionnels (`feat:`, `fix:`, `chore:`…).
- Aucun secret dans Git : copiez `.env.example` vers `.env`.

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — architecture et décisions (étape 11).
- [`docs/adr/`](docs/adr/) — Architecture Decision Records.
- [`docs/security.md`](docs/security.md) — mesures de sécurité.

## Dépannage

- `corepack` introuvable / permissions : `npm install -g pnpm`.
- Docker absent : installez [Docker Desktop](https://docs.docker.com/engine/install/) ou `docker-engine`.
