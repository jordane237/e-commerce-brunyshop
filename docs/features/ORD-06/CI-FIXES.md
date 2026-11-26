# ORD-06 — Diagnostic CI

## Statut
Les logs GitHub Actions (`ci-success`, `security` — pull_request et push) n'ont **pas été accessibles** dans cet environnement (`gh` CLI absent, aucun token GitHub). Conformément aux consignes du ticket, **aucune modification de workflow n'a été effectuée** et aucune désactivation de check n'a été appliquée.

## Actions réalisées localement
- `pnpm -C frontend exec nx run-many -t typecheck` → OK (0 erreur).
- `pnpm -C frontend lint` → OK (0 erreur).
- `pnpm -C frontend build:storefront` → OK.
- Tests unitaires ciblés (`order-tracking.store.spec.ts`, `timeline.component.spec.ts`) → 8/8 verts.
- Aucun secret versionné, aucun `dist/` ajouté au suivi Git.

## Correction code (hors workflow)
- `libs/ui/src/lib/empty-state/empty-state.component.html` : `(clicked)` → `(click)` sur `bruny-button`. Le composant `ButtonComponent` n'expose aucun output `clicked` ; le binding était inerte et rendait le CTA « Réessayer » non fonctionnel (CA #3).

## À faire dès que les logs sont fournis
- Lire les logs `ci-success` et `security` (push + pull_request).
- Identifier la cause racine de chaque échec (sans supposition).
- Corriger la cause racine dans `.github/workflows/ci.yml` (modifications minimales, justifiées, documentées ici).
- Vérifier localement : `pnpm audit --prod --audit-level=high`, `gitleaks detect --source .`, YAML valide, build/tests OK.
