# Client API Angular — génération et vérification

Ce document décrit la chaîne qui relie le contrat OpenAPI du backend aux types
consommés par les applications Angular (TEC-09).

## Générateur retenu

**`openapi-typescript`** (version épinglée `^7.13.0` dans `frontend/package.json`),
et non `@openapitools/openapi-generator-cli` / `typescript-angular`.

Justification :

- le besoin des applications est de **typer les appels HTTP**, pas de générer une
  seconde couche de services : `CatalogApi` et `SessionService` sont déjà écrits,
  testés et branchés sur `HttpClient`, `provideHttpClient()` et `API_BASE_URL` ;
- `typescript-angular` produit des services `HttpClient` redondants avec ceux de
  `libs/data-access` et impose une JVM (jar OpenAPI Generator) dans la CI et sur
  chaque poste, pour un gain nul ici ;
- `openapi-typescript` ne génère que des types (`paths`, `components`,
  `operations`) : sortie déterministe, vérifiable par `git diff`, sans dépendance
  runtime supplémentaire ;
- la version du générateur est verrouillée par le `pnpm-lock.yaml` et le
  `package.json` du workspace frontend.

Le dossier généré est déjà exclu d'ESLint (`ignores: ['**/generated/**']` dans
`frontend/eslint.config.mjs`) : il n'est jamais linté ni édité à la main.

## Fichiers concernés

| Fichier | Rôle |
| --- | --- |
| `backend/openapi.json` | Contrat exporté par le backend (source de vérité, versionné) |
| `frontend/libs/data-access/src/generated/api-types.ts` | Sortie du générateur, **versionnée**, ne jamais modifier à la main |
| `frontend/libs/data-access/src/lib/api-contracts.ts` | Noms stables des DTO générés (`LoginDto`, `RegisterDto`…) |
| `frontend/libs/data-access/src/lib/catalog-api.ts` | Services catalogue écrits à la main ; l'enum de tri `ProductSort` vient du contrat généré |
| `frontend/libs/data-access/src/lib/session.service.ts` | Session admin, consomme `LoginDto` généré |

## Procédure

```bash
# 1. Exporter le contrat depuis le backend (obligatoire après tout changement d'API)
pnpm -C backend openapi:export

# 2. Générer les types + formater la sortie (Prettier, même rendu que le fichier commité)
pnpm api:generate

# 3. Vérifier qu'aucune dérive n'existe — c'est exactement ce que fait la CI
pnpm api:check
```

`pnpm api:generate` lit **`backend/openapi.json`** (pas un serveur démarré) :
la génération est reproductible hors ligne et en CI.

`pnpm api:check` vérifie d'abord qu'aucune modification non commitée ne traîne dans
le fichier généré, régénère depuis `backend/openapi.json`, puis exécute
`git diff --exit-code -- frontend/libs/data-access/src/generated/api-types.ts`.
Une édition manuelle (même commitée) ou un contrat modifié sans régénération fait
échouer la commande.

## Quand régénérer

À chaque modification du contrat backend : nouvel endpoint, DTO ajouté ou renommé,
enum modifié, paramètre de requête changé. Le fichier généré se commit **dans la
même PR** que le changement backend, sinon le job CI `api-client` bloque la PR.

## Utilisation dans le code

```ts
import { inject } from '@angular/core';
import { LoginDto, SessionService } from '@bruny/data-access';

const session = inject(SessionService);
session.login({ identifier: 'admin@exemple.cm', password: '…' } satisfies LoginDto);
```

Conversion Observable → Signal (Angular moderne) :

```ts
import { toSignal } from '@angular/core/rxjs-interop';

readonly products = toSignal(this.catalog.list(), { initialValue: undefined });
```

## Limite connue du contrat actuel

`backend/openapi.json` documente aujourd'hui les **corps de requête** (RegisterDto,
LoginDto, CreateProductDto…) mais pas les **réponses** : les endpoints `200/201`
n'ont pas de schéma de contenu. Les types de réponse (`CatalogProduct`,
`CatalogVariant`, `SessionUser`, `AuthResponse`) restent donc écrits à la main dans
`catalog-api.ts` et `session.service.ts`.

Dès que le backend ajoutera des DTO de réponse (`@ApiOkResponse({ type: … })`),
`pnpm api:generate` les exposera dans `components['schemas']` et ces interfaces
pourront être remplacées par les types générés, sans changer la CI.

## CI

Job `api-client` dans `.github/workflows/ci.yml` :

1. `pnpm install --frozen-lockfile`
2. `pnpm api:check`

Il est requis par l'agrégateur `ci-success`, donc une PR dont le client généré est
désynchronisé est bloquée. Le job `openapi-check` existant garantit en amont que
`backend/openapi.json` est lui-même à jour.

## Dépannage

| Symptôme | Cause | Correction |
| --- | --- | --- |
| `api:check` échoue en CI avec un diff | Le contrat a changé sans régénération | `pnpm -C backend openapi:export && pnpm api:generate`, puis commiter |
| `api:check` échoue après une modification manuelle | Le fichier généré a été édité | `git checkout -- frontend/libs/data-access/src/generated/api-types.ts` |
| `The Angular CLI requires a minimum Node.js version` | Node local plus ancien que `.nvmrc` (24.15.0) | `nvm install && nvm use` |
| Erreur de type sur un champ de DTO | Contrat backend obsolète dans le dépôt | `pnpm -C backend openapi:export` puis `pnpm api:generate` |

Ne jamais ajouter de règle ESLint ni de correction manuelle dans
`src/generated/` : la prochaine génération écraserait le contenu.
