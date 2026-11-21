# Corrections — Sprint 3

- **Date** : 20 novembre 2026
- **Branche** : `review/sprint-3-final-audit`

## 1. Corrections d'infrastructure (TEC-11)

- Migration `notifications` renommée pour respecter l'ordre chronologique Prisma.
- Audit de sécurité limité aux dépendances de production ; overrides `body-parser`, `multer`, `vite`.
- Gitleaks exécuté via le binaire CLI épinglé.
- E2E backend et frontend séparés, avec API et storefront démarrés et attendus avant les tests.
- `PORT=4000` limité aux processus backend.
- Attente d'hydratation Angular ajoutée aux e2e ; suite frontend sérialisée.
- Notifications rendues tolérantes aux suppressions concurrentes (P2025) et aux transactions fermées à l'arrêt (P2028).

## 2. Corrections de configuration (MKT-06)

- Remplacement du numéro WhatsApp placeholder par `+237 6 79 17 62 96`.
- Remplacement de l'URL Facebook placeholder par `https://www.facebook.com/profile.php?id=100087026340515`.
- Mise à jour du seed backend, de la config frontend et des tests associés.

## 3. Corrections de démarrage frontend (TEC-11)

- `allowedHosts: true` dans la configuration `serve` pour accepter `localhost:4200`.

## 4. Corrections non réalisées

- Aucune correction fonctionnelle des 19 tickets n'a été faite au-delà des points ci-dessus.
- Les quatre oublis de consommation frontend restent à traiter dans des tickets dédiés.
- Le tunnel P08–P13 reste non implémenté.