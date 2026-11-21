# BO-03 — Vérification

## Commandes exécutées
- `pnpm -C backend build` : OK
- `pnpm -C backend lint` : OK
- `pnpm -C backend test` : 270 tests OK
- `pnpm -C backend test:e2e` : 229 tests OK (dont `admin-products-list.e2e-spec.ts`)
- `pnpm -C backend openapi:export` : OK (31 chemins)
- `pnpm -C frontend build:admin` : OK
- `pnpm -C frontend build:storefront` : OK
- `pnpm -C frontend lint` : OK
- `pnpm -C frontend test` : 399 tests OK

## Points couverts
- CA #1 : tableau desktop + cartes mobile via `bruny-data-table` / `bruny-card-list`.
- CA #2 : recherche (debounce 300 ms), filtres catégorie/statut/stock, tri, pagination.
- CA #3 : sélection + bandeau d'actions groupées Publier / Masquer / Archiver, confirmation pour archiver.
- CA #4 : badges Brouillon / Publié / Archivé via `bruny-status-badge`.
- RBAC : 401 sans jeton, 403 client, 200 admin (e2e).
- A11y : `matchMedia` protégé (`isPlatformBrowser` + existence), focus trap modal, rôles menu.
- Formats : `FcfaPipe` + `DatePipe` fr-CM (`registerLocaleData` ajouté à `app.config.ts`).
