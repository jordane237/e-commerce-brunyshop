# BRUNY SHOPPING

Plateforme e-commerce de chaussures (Cameroun · français · FCFA).

**Stack** : Angular (storefront SSR + admin SPA) · NestJS (monolithe modulaire) · PostgreSQL · Prisma · Redis · BullMQ · Docker · GitHub Actions.

> ⚠️ Projet en cours d'initialisation — l'étape 1 (monorepo + outillage qualité) vient d'être posée. Les applications arrivent dans les étapes suivantes.

## Installation locale (5 commandes)

```bash
git clone <repo> && cd bruny-shopping
pnpm install            # installe les dépendances
cp .env.example .env    # crée votre configuration locale
docker compose up -d    # démarre PostgreSQL + Redis (étape 2)
pnpm db:migrate && pnpm db:seed   # base de données (étape 4)
```

## Structure du dépôt (monorepo Nx)

```
apps/              # applications
  storefront/      # boutique publique Angular (SSR + hydratation)
  admin/           # back-office Angular (SPA)
  api/             # API NestJS
libs/              # bibliothèques partagées
  ui/              # composants visuels partagés
  data-access/     # client API généré (OpenAPI), modèles, stores
  util/            # pipes (prix FCFA), validateurs (+237), helpers
  design-tokens/   # variables CSS/SCSS (couleurs, typo, espacements)
infra/             # Dockerfiles, Nginx, scripts utilitaires
docs/              # architecture, ADR, guides
```

## Scripts

| Commande      | Rôle                               |
| ------------- | ---------------------------------- |
| `pnpm lint`   | ESLint sur tout le dépôt           |
| `pnpm format` | Formatage Prettier                 |
| `pnpm test`   | Tests unitaires (tous les projets) |
| `pnpm build`  | Builds de tous les projets         |

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
