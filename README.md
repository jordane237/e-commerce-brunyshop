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
git clone <repo> && cd e-commerce-brunyshop
pnpm install            # installe les dépendances
cp .env.example .env    # crée votre configuration locale
pnpm docker:up          # démarre PostgreSQL + Redis + Mailpit
pnpm db:migrate && pnpm db:seed   # migrations + données de départ (étape 4)
```

> Le seed crée l'admin `admin@brunyshopping.example` (mot de passe : `SEED_ADMIN_PASSWORD` du `.env`), les 5 rôles, le catalogue de démonstration et les zones de livraison. Idempotent : relançable sans dupliquer.

## Scripts

| Commande           | Rôle                                                           |
| ------------------ | -------------------------------------------------------------- |
| `pnpm lint`        | ESLint backend + frontend                                      |
| `pnpm format`      | Formatage Prettier                                             |
| `pnpm docker:up`   | Démarre PostgreSQL + Redis + Mailpit (attend les healthchecks) |
| `pnpm docker:down` | Arrête la stack (données conservées)                           |
| `pnpm dev:api`     | Démarre l'API backend en dev (étape 3)                         |
| `pnpm build`       | Build du backend (étape 3)                                     |
| `pnpm db:migrate`  | Applique les migrations Prisma (étape 4)                       |
| `pnpm db:seed`     | Seed : admin, rôles, catalogue, zones (étape 4)                |

## Infrastructure locale

| Service           | Image                    | Port host                     | Détails                                           |
| ----------------- | ------------------------ | ----------------------------- | ------------------------------------------------- |
| PostgreSQL        | `postgres:18-alpine`     | `15432`                       | Volumes persistants, healthcheck `pg_isready`     |
| Redis             | `redis:8-alpine`         | `16379`                       | Volume persistant, healthcheck `ping`             |
| Mailpit           | `axllent/mailpit:latest` | `11025` (SMTP) · `18025` (UI) | Boîte mail de développement                       |
| MinIO (optionnel) | `minio/minio:latest`     | `19000` · `19001`             | Profil `s3` : `docker compose --profile s3 up -d` |

> **Ports décalés** (15432, 16379…) : cohabitation avec d'autres projets Docker déjà lancés sur la machine. Personnalisables via `.env` (voir `.env.example`). Les ports internes des conteneurs restent standards (5432, 6379). PostgreSQL et Redis ne sont exposés sur l'hôte **qu'en développement**.

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
