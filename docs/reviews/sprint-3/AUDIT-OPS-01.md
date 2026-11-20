# Audit OPS-01 — Dockerfiles multi-étapes et configuration Nginx

> Revue finale du Sprint 3 — audit en lecture seule.
> Branche auditée : `feature/MKT-06-whatsapp-floating-button` (`2a73701`), tête de la pile Sprint 3.
> Date : 19 novembre 2026. Sources : ticket CSV officiel, cahier des charges, code, tests, documentation du ticket.

## 1. Critères d'acceptation

| # | Critère d'acceptation | Statut | Preuve |
|---|---|---|---|
| 1 | Dockerfiles multi-étapes api/storefront/admin, non-root, `.dockerignore` | ✅ | `infra/docker/Dockerfile.*` : étapes `base/deps/build/runtime` ; `USER bruny` (api/storefront), `USER nginx` (admin/gateway) ; `infra/docker/.dockerignore` |
| 2 | Nginx : reverse proxy, compression, en-têtes de sécurité, cache statique | ✅ | `nginx.gateway.conf` (gzip, proxy `/api`, storefront), `nginx.security-headers.conf` (CSP, HSTS, X-Frame-Options), `expires` sur les assets |
| 3 | Analyse des vulnérabilités intégrée à la CI | ✅ | Workflow `docker-scan.yml` présent ; run vert sur `working` (run `44771815132`, commit `4c1fde5`) après correction des CVE OS (apk upgrade) et suppression de npm dans les images Node |
| 4 | Base de données et Redis non exposés publiquement | ✅ | `docker-compose.prod.yml` : aucun `ports` pour postgres/redis/minio ; seule la gateway publie `80:8080` |

## 2. Conformité au cahier des charges

Le CDC §14 (CI/CD et déploiement) et §10.6 (sécurité d'infrastructure) sont visés. La configuration est cohérente ; la preuve CI manquait à cause du bug de version.

## 3. Qualité du code

- Images multi-étapes, utilisateurs non privilégiés, networks internes.
- Aucun secret dans les Dockerfiles ; variables passées à l'exécution.
- Aucun TODO/FIXME.

## 4. Tests

- Aucun test applicatif spécifique.
- `docker build --check`, `nginx -t` et `docker compose config` documentés dans `VERIFICATION.md`.
- Scan Trivy : run vert sur `working` (run `44771815132`), CA #3 validé.

## 5. Sécurité

- `.dockerignore` exclut les `.env*`.
- Aucun port de données exposé.
- En-têtes CSP/HSTS appliqués au gateway.

## 6. Documentation

- `ANALYSE-EXISTANT.md`, `SECURITY.md`, `VERIFICATION.md` complets.
- Le rapport reconnaît que les builds complets n'ont pas abouti localement.

## 7. Points d'attention

- Le téléchargement des moteurs Prisma musl n'a pas été validé.
- Le scan Trivy est vert ; une future mise à jour d'image de base devra être revalidée.

## 8. Statut global

**✅ Conforme**

Recommandation : **merge OK**. CA #3 clôturé avec un run Docker Scan vert.
