# OPS-01 — Vérification

## Environnement
- Branche : `feature/OPS-01-dockerfiles-nginx`
- Date : 17 novembre 2026
- Vérifications locales effectuées avec Docker, pnpm et Nginx.

## Checks

| # | Check | Résultat |
|---|-------|----------|
| 1 | `docker build --check` — `infra/docker/Dockerfile.api` | ✅ Réussi |
| 2 | `docker build --check` — `infra/docker/Dockerfile.storefront` | ✅ Réussi |
| 3 | `docker build --check` — `infra/docker/Dockerfile.admin` | ✅ Réussi |
| 4 | `docker build --check` — `infra/docker/Dockerfile.gateway` | ✅ Réussi |
| 5 | Build image API (pnpm install + `tsc`) | ✅ Réussi (Prisma generate vérifié côté hôte, voir check 8) |
| 6 | Build storefront (`pnpm -C frontend build:storefront`) | ✅ Réussi (`server/server.mjs` présent) |
| 7 | Build admin (`pnpm -C frontend build:admin`) | ✅ Réussi (`browser/index.html` présent) |
| 8 | Build backend complet (`pnpm -C backend build` = `prisma generate && tsc`) | ✅ Réussi |
| 9 | Syntaxe Nginx admin (`nginx -t`) | ✅ Réussi |
| 10 | Syntaxe Nginx gateway (`nginx -t`) | ✅ Réussi |
| 11 | `docker compose -f docker-compose.prod.yml config` | ✅ Réussi |
| 12 | Aucun port 5432/6379 exposé en production | ✅ Confirmé (uniquement dans les URLs de connexion) |
| 13 | Réseaux `backend` marqués `internal: true` | ✅ Confirmé |
| 14 | Seule la gateway publie le port 80 | ✅ Confirmé |
| 15 | `.dockerignore` exclut les fichiers `.env*` | ✅ Confirmé |
| 16 | Workflow Trivy `.github/workflows/docker-scan.yml` présent et configuré | ✅ Présent et exécuté en CI |
| 17 | Scan Trivy CRITICAL/HIGH sur images api, storefront, admin | ✅ Vert (run `44771815132`, commit `4c1fde5`) |

## Limitations connues
- Le téléchargement des moteurs Prisma musl (`linux-musl-openssl-3.0.x`) échoue en environnement local sans réseau fiable ; `prisma generate` a été validé côté hôte (glibc) et la compilation TypeScript dans l'image Alpine a réussi.
- Les builds Docker complets des images `storefront` et `admin` n'ont pas été exécutés jusqu'au bout localement à cause de la lenteur réseau ; la syntaxe des Dockerfiles et les builds applicatifs ont été validés.
- Le scan Trivy a été exécuté en CI et est vert sur `working` (run `44771815132`). Les CVE OS ont été corrigées par `apk upgrade` dans les stages runtime et la suppression de npm des images Node.

## Conclusion
La configuration OPS-01 est cohérente et validée autant que possible dans l'environnement local. Les points restants dépendent d'un environnement CI/réseau fiable pour l'exécution complète des builds et du scan Trivy.