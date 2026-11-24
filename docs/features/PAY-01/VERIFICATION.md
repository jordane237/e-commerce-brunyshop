# PAY-01 — Vérification

## Checks techniques
- [x] Branche `feature/PAY-01-cod-confirmation` active
- [x] Migration Prisma appliquée (`20261124100000_pay01_cod_confirmation`)
- [x] Prisma generate OK
- [x] Seed `order.codConfirmationThreshold` (100 000 XAF, upsert idempotent)
- [x] Build backend OK
- [x] Lint backend OK (0 erreur)
- [x] Tests unitaires backend : 330 verts (dont 11 OrderConfirmationService)
- [x] OpenAPI régénéré (`openapi.json`, 39 paths)
- [x] Client Angular régénéré
- [ ] Tests e2e dédiés non ajoutés (suite existante non modifiée)
- [ ] CI relancée : logs inaccessibles (voir CI-FIXES.md)

## Checks fonctionnels (CA)
- [x] CA #1 : `POST /admin/orders/:id/confirm` (CALL/WHATSAPP) → confirmedAt, confirmedBy, confirmationMethod, confirmationNotes, statut CONFIRMED, audit, SMS client
- [x] CA #2 : `PATCH /admin/orders/:id/status → PREPARING` sans confirmedAt → 400 `ORDER_CONFIRMATION_REQUIRED`
- [x] CA #3 : seuil `Setting.order.codConfirmationThreshold` (défaut 100 000 XAF) ; message spécifique si montant ≥ seuil ; CA #2 strict même sous le seuil (documenté)
- [x] CA #4 : `PATCH /admin/shipments/:id/collect-cod` → validations + codCollected, codCollectedAt, codCollectedBy, codAmount, audit
- [x] RBAC : confirm (ORDER_MANAGER/ADMIN/SUPER_ADMIN), collect-cod (LIVREUR/ORDER_MANAGER/ADMIN/SUPER_ADMIN)
- [x] Audit : ORDER_CONFIRMED_CALL, ORDER_CONFIRMED_WHATSAPP, ORDER_COD_COLLECTED (+ ORDER_CONFIRMATION_REQUIRED_BLOCKED)
- [x] Notifications : enqueueSms client, enqueueWhatsapp (template enregistré)
- [x] Non-régression : build + tests unitaires OK

## Limitations
- Diagnostic CI non réalisé (logs inaccessibles) — aucun workflow modifié.
- Tests e2e dédiés non écrits (suite existante non touchée).
- Gitleaks non exécuté localement.
