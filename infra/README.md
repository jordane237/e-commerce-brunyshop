# infra/ — Infrastructure et déploiement

| Dossier    | Contenu                                                         |
| ---------- | --------------------------------------------------------------- |
| `docker/`  | Dockerfiles multi-étapes (api, storefront, admin), config Nginx |
| `scripts/` | Scripts utilitaires (génération client API, sauvegardes…)       |

Le `docker-compose.yml` à la racine démarre l'infrastructure locale (PostgreSQL, Redis, Mailpit).
