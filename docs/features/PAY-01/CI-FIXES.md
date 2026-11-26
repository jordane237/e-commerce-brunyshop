# PAY-01 — Diagnostic CI

## Statut
Les logs GitHub Actions (`ci-success`, `security` — pull_request et push) n'ont pas été accessibles (`gh` CLI absent, aucun token GitHub). Conformément aux consignes, **aucune modification de workflow n'a été effectuée** et aucun check n'a été désactivé.

## Actions réalisées localement
- `pnpm -C backend build` → OK.
- `pnpm -C backend lint` → OK.
- `pnpm -C backend test` → 330 tests verts (dont 11 OrderConfirmationService).
- Migration Prisma appliquée, seed mis à jour.
- OpenAPI régénéré (`openapi.json`), client Angular régénéré.

## À faire dès que les logs sont fournis
- Lire les logs `ci-success` et `security` (push + pull_request).
- Identifier la cause racine de chaque échec (sans supposition).
- Corriger la cause racine dans `.github/workflows/ci.yml` (modifications minimales, justifiées).
- Vérifier localement : `pnpm audit --prod --audit-level=high`, `gitleaks detect --source .`, YAML valide, build/tests OK.
- Documenter ici chaque correction.
