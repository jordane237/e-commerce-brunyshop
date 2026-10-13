# Backend — API BRUNY SHOPPING

Projet **NestJS** (TypeScript strict, monolithe modulaire) + **Prisma** + **PostgreSQL**.

Il est généré/configuré à l'**étape 3** du plan d'exécution : bootstrap, sécurité de base
(helmet, CORS, validation globale, rate limiting), Swagger, health checks.

Structure prévue :

```
backend/
|-- prisma/            # schema.prisma, migrations/, seed.ts
|-- src/
|   |-- main.ts, app.module.ts, config/, common/
|   |-- infrastructure/ (database, cache, queue, storage, mail, sms, payments)
|   `-- modules/       # auth, users, roles, catalog, inventory, health, ...
`-- test/              # tests e2e (supertest)
```

Préfixe API : `/api/v1`.
