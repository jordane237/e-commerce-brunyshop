# OPS-01 — Analyse de l'existant

## Branche
`feature/OPS-01-dockerfiles-nginx`

## État initial
- Dockerfiles existants : `infra/docker/Dockerfile.api`, `Dockerfile.storefront`, `Dockerfile.admin`, `Dockerfile.gateway`.
- Compose local : `docker-compose.yml` (TEC-03), ne pas modifier.
- Overlay production existant : `docker-compose.production.yml`.
- Configuration Nginx existante : `infra/docker/nginx.admin.conf`, `infra/docker/nginx.gateway.conf`.
- `.dockerignore` racine et `infra/docker/.dockerignore` existants mais incomplets.

## Versions et scripts
- Node : `24.15.0` (`.nvmrc`, `engines`).
- pnpm : `12.11.2` (`packageManager`).
- Backend : `pnpm -C backend build` = `prisma generate && tsc -p tsconfig.build.json`, sortie `backend/dist/main.js`, port `4000`, préfixe `/api/v1`, health `/api/v1/health/live` et `/ready`.
- Frontend boutique : `pnpm -C frontend build:storefront` → `frontend/dist/apps/storefront` (`browser` + `server/server.mjs`, port `4000`).
- Frontend admin : `pnpm -C frontend build:admin` → `frontend/dist/apps/admin/browser`.

## Points adaptés
- Les chemins de l'énoncé (`backend/Dockerfile`, `projects/...`) ne correspondent pas au monorepo réel ; la convention `infra/docker/...` est conservée.
- `docker-compose.prod.yml` est ajouté comme stack autonome de production, sans exposer PostgreSQL ni Redis.
- L'overlay `docker-compose.production.yml` est conservé pour la compatibilité avec le profil `full` local.

## Design
OPS-01 est un ticket DevOps (Docker, Nginx, CI). Les maquettes `design/` et `design1/` ne contiennent aucun artefact d'infrastructure et ne sont pas concernées.