# infra/ — Infrastructure et déploiement

| Dossier    | Contenu                                                           |
| ---------- | ----------------------------------------------------------------- |
| `docker/`  | Dockerfiles multi-étapes (api, storefront, admin, gateway), Nginx |
| `scripts/` | Réservé aux scripts d’exploitation ajoutés avec le déploiement    |

Le `docker-compose.yml` démarre l’infrastructure locale (PostgreSQL, Redis, Mailpit). Le profil `full` ajoute API, boutique, admin et gateway; `docker-compose.production.yml` retire les ports hôtes des services de données et des applications derrière le reverse proxy. Vérifier la configuration composée avant déploiement.
