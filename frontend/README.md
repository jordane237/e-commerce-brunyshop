# Frontend — BRUNY SHOPPING

Workspace **Nx** hébergeant les deux applications Angular et les bibliothèques partagées.

| Dossier               | Contenu                                                       |
| --------------------- | ------------------------------------------------------------- |
| `apps/storefront/`    | Boutique publique — Angular **SSR + hydratation**             |
| `apps/admin/`         | Back-office — Angular **SPA**                                 |
| `libs/ui/`            | Composants visuels partagés (Button, Input, ProductCard…)     |
| `libs/data-access/`   | Client API généré depuis l'OpenAPI, modèles, stores à signaux |
| `libs/util/`          | Pipes (prix FCFA), validateurs (téléphone +237), helpers      |
| `libs/design-tokens/` | Variables CSS/SCSS : couleurs, typographie, espacements       |

## Client API

Les types OpenAPI sont générés dans `libs/data-access/src/generated/api-types.ts` :

```bash
pnpm api:generate   # backend/openapi.json -> types + Prettier
pnpm api:check      # échoue si le client généré n'est pas à jour (CI)
```

Procédure complète, utilisation de `LoginDto`, conversion `toSignal()` et
limites du contrat : [`docs/frontend/API-CLIENT.md`](../docs/frontend/API-CLIENT.md).

Générés aux étapes 7 à 9 du plan d'exécution.
