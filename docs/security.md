# Sécurité

## Mesures présentes

- Validation des variables d’environnement avant le démarrage, validation stricte des DTO, Helmet, liste blanche CORS, cookies HttpOnly et limitation de taille du corps.
- Garde JWT globale avec routes publiques explicites, contrôle des rôles, rate limiting Redis et mots de passe Argon2id.
- Refresh tokens opaques hachés en base, rotation et détection de réutilisation; jetons d’accès gardés en mémoire côté Angular.
- Journaux structurés avec masquage des champs sensibles; erreurs HTTP uniformisées sans détails internes en production.
- Suppression logique de plusieurs entités et audit transactionnel de la création de produit.
- `.env` ignoré par Git; `.env.example` contient uniquement des valeurs d’exemple non secrètes.

## Avant mise en production

- [ ] Générer des secrets aléatoires uniques et stocker les dans un gestionnaire de secrets.
- [ ] Configurer HTTPS, domaine/cookie `Secure`, CORS strict et CSP selon les domaines réels.
- [ ] Exécuter `docker compose -f docker-compose.yml -f docker-compose.production.yml --profile full config` et vérifier les ports privés.
- [ ] Configurer SMTP/SMS/paiement réels, vérifier les signatures webhook et les procédures de remboursement.
- [ ] Réaliser une revue indépendante des flux d’authentification, permissions et migration de base.
- [ ] Activer sauvegardes chiffrées/restauration, alertes, rétention des logs et supervision.
- [ ] Lancer audit des dépendances, tests de sécurité et tests de charge sur la configuration de production.
- [ ] Désactiver Swagger en production et s’assurer qu’aucun compte seed n’est créé.

Ce document décrit les protections présentes dans le code à ce stade; il ne constitue pas une certification ni une revue de sécurité externe.
