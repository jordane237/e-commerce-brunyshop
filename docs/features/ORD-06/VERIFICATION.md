# ORD-06 — Vérification

## Checks techniques
- [x] Branche `feature/ORD-06-order-tracking-page` active
- [x] Typecheck frontend → OK
- [x] Lint frontend → OK
- [x] Build storefront → OK
- [x] Tests unitaires store (5) → verts
- [x] Tests unitaires timeline (3) → verts
- [ ] Tests e2e `order-tracking.spec.ts` → non exécutés localement (Playwright nécessite serveurs)
- [ ] CI relancée → logs inaccessibles (voir CI-FIXES.md)

## Checks fonctionnels (CA)
- [x] CA #1 : formulaire reference (regex `^BRN-[0-9]{4}-[A-Z0-9]{4}$`) + phone (regex `^\+237[0-9]{9}$`), validation inline FR ; timeline `<ol>/<li>` avec `aria-current="step"`
- [x] CA #2 : bouton WhatsApp contextualisé via `WhatsAppService.buildLink({ page: 'confirmation', orderReference })`, `target="_blank" rel="noopener noreferrer"`, `aria-label` explicite ; FAB global masqué sur `/suivi`
- [x] CA #3 : message neutre identique (EmptyState « Référence introuvable ou numéro incorrect » + aide), `role="status"`, CTA « Réessayer »
- [x] CA #4 : lien « Demander un échange » conditionnel `status === 'DELIVERED'` → `/retours`
- [x] SEO `noIndex: true`
- [x] URL partageable `?reference=...&phone=...` avec pré-remplissage + soumission auto
- [x] Lien confirmation → `/suivi?reference=...&phone=...`
- [x] Lien footer → `/suivi`

## Limitations
- Diagnostic CI non réalisé (logs inaccessibles) — aucun workflow modifié.
- 15 tests préexistants (timeouts) dans la suite complète vitest restent à investiguer ; non liés à ORD-06.
- Gitleaks non installé localement (scan non exécuté).
