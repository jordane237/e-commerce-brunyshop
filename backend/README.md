# API BRUNY SHOPPING

API NestJS en monolithe modulaire, TypeScript strict, PostgreSQL et Prisma. Le préfixe public est `/api/v1`; Swagger est exposé en environnement non production sur `/api/docs`.

## Commandes

Depuis la racine : `pnpm dev:api`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm -C backend test` et `pnpm -C backend test:e2e`. Les commandes de base nécessitent PostgreSQL et Redis actifs.

## Modules actifs

- `auth` : inscription, connexion, renouvellement rotatif, déconnexion, profil, TOTP.
- `catalog` : catégories, recherche/pagination/filtres, détail et création de produit protégée.
- `inventory` : point d’extension pour mouvements et réservation de stock.
- `health` : liveness et readiness (PostgreSQL/Redis).
- `audit` : journal transactionnel des changements sensibles câblés.
- Les autres modules métier sont initialisés comme modules vides documentés.

Les contrôleurs n’implémentent pas de logique métier. Les montants sont en entiers XAF, les mots de passe Argon2id et les DTO sont vérifiés globalement.
