# OPS-01 — Sécurité des images et du déploiement

## Images
- Builds multi-stage : `base → deps → build → runtime`.
- Images de base : `node:24.15-alpine`, `nginxinc/nginx-unprivileged:1.29-alpine`.
- Utilisateurs non-root : `bruny` (UID applicatif) pour l'API et le storefront, `nginx` (UID 101) pour l'admin et la gateway.
- Secrets exclus du contexte via `.dockerignore` (`.env*`).

## Scan de vulnérabilités
- Workflow : `.github/workflows/docker-scan.yml`.
- Outil : Trivy.
- Images : `api`, `storefront`, `admin`.
- Sévérités bloquantes : `CRITICAL,HIGH`.
- `exit-code: 1` : la CI échoue si une vulnérabilité bloquante est trouvée.
- `ignore-unfixed: true` : ignore les CVE sans correctif disponible.
- Rapports SARIF envoyés dans l'onglet Security du dépôt.
- Scan planifié chaque lundi à 03:00 UTC.

## Mise à jour des images de base
- Dependabot est configuré pour l'écosystème Docker (`/infra/docker`).
- Les images de base sont épinglées par version dans les Dockerfiles.
- Toute mise à jour d'image de base doit être validée par le scan Trivy et les tests de démarrage.

## Exposition production
- PostgreSQL et Redis n'ont pas de section `ports:` dans `docker-compose.prod.yml`.
- Réseau `backend` marqué `internal: true`.
- Les services applicatifs utilisent `expose:` et ne sont accessibles que via la gateway.
- Vérification hôte : `ss -tlnp` ne doit montrer aucun port `5432` ou `6379`.