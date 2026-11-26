# STK-03 — Vérifications

## Commandes exécutées

```bash
cd backend
pnpm test
pnpm test:e2e
pnpm lint
pnpm build
pnpm openapi:export
```

## Résultats

- Tests unitaires : 25 fichiers, 246 tests réussis.
- Tests e2e : 15 fichiers, 207 tests réussis.
- ESLint : aucun problème.
- Build TypeScript : réussi.
- Client Prisma régénéré.
- Migration `20261116120000_stk03_low_stock_alerts` appliquée à la base locale.
- Contrat OpenAPI réexporté.

## Couverture fonctionnelle STK-03

Le fichier `backend/test/stock-low-alerts.e2e-spec.ts` vérifie :

1. franchissement du seuil → une alerte ;
2. notification `IN_APP` et email pour l’administrateur ;
3. audit système `userId: null` ;
4. deuxième commande sous seuil → aucune nouvelle alerte ;
5. réapprovisionnement au-dessus du seuil → reset du flag ;
6. nouvelle baisse → nouvelle alerte ;
7. endpoint admin filtré par produit avec compteurs LOW/OUT ;
8. endpoint protégé : 401 sans jeton, 403 pour un client ;
9. seuil global du Setting utilisé pour une variante sans seuil explicite.

Les suites STK-01 (`orders`, `stock-concurrency`) désactivent explicitement
`STOCK_LOW_ALERT_ENABLED` afin de rester isolées des notifications STK-03.
