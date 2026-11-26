# STK-02 — Vérification

| # | Check | Résultat |
|---|---|---|
| 1 | Branche `feature/STK-02-stock-adjustments` créée et active | ✅ |
| 2 | Migration additive appliquée (enum + colonnes + index) | ✅ |
| 3 | `pnpm -C backend prisma generate` | ✅ |
| 4 | `pnpm -C backend build` | ✅ |
| 5 | `pnpm -C backend openapi:export` | ✅ (33 paths) |
| 6 | `pnpm api:generate` (idempotent) | ✅ |
| 7 | Tests unitaires backend (`pnpm -C backend test`) | ✅ 275 tests |
| 8 | Tests e2e (`stock-adjustments.e2e-spec.ts`) | ✅ 6 tests |
| 9 | ESLint backend (`pnpm -C backend exec eslint src test --max-warnings=0`) | ✅ |
| 10 | Gitleaks local (`/tmp/gitleaks detect ...`) | ✅ 0 leak |
| 11 | Audit dépendances (`pnpm audit --prod --audit-level=high`) | ✅ 0 high/critical |
| 12 | Ajustement valide (200, before/after/delta) | ✅ |
| 13 | Validation newStock < 0 (400) | ✅ |
| 14 | Motif absent/invalide (400) | ✅ |
| 15 | Variante inexistante (404) | ✅ |
| 16 | RBAC (CUSTOMER/ORDER_MANAGER/LIVREUR → 403; STOCK_MANAGER/ADMIN/SUPER_ADMIN → 200) | ✅ |
| 17 | StockMovement créé (delta, motif, notes, before, after, userId, orderId=null) | ✅ |
| 18 | Audit `PRODUCT_STOCK_ADJUSTED` créé | ✅ |
| 19 | Historique filtrable (variantId, from/to, motif, pagination) | ✅ |
| 20 | from > to → 400 | ✅ |
| 21 | Non-régression STK-01 (concurrence) | ✅ (tests unitaires passent) |
| 22 | CI gitleaks corrigé (allowlist findings) | ✅ |