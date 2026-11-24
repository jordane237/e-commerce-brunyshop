# PAY-01 — Paiement à la livraison avec confirmation avant expédition

## Règle métier
- Commande COD créée en `PENDING_CONFIRMATION` (ORD-01).
- Confirmation par appel (`CALL`) ou WhatsApp (`WHATSAPP`) : `POST /admin/orders/:id/confirm` → enregistre `confirmedAt`, `confirmedBy`, `confirmationMethod`, `confirmationNotes`, passe le statut à `CONFIRMED`, audit + SMS client.
- Impossible de passer en `PREPARING` sans `confirmedAt` enregistré (`ORDER_CONFIRMATION_REQUIRED`).
- Seuil configurable `Setting.order.codConfirmationThreshold` (défaut 100 000 XAF) : si montant ≥ seuil et pas de confirmation → message spécifique.
- Encaissement COD : `PATCH /admin/shipments/:id/collect-cod` → vérifie `paymentMethod=COD`, `shipment.status=DELIVERED`, `0 <= amount <= total`, enregistre `codCollected`, `codCollectedAt`, `codCollectedBy`, `codAmount`, audit.

## RBAC
- `confirm` : ORDER_MANAGER, ADMIN, SUPER_ADMIN.
- `collect-cod` : LIVREUR, ORDER_MANAGER, ADMIN, SUPER_ADMIN.

## Endpoints
- `POST /api/v1/admin/orders/:id/confirm`
- `PATCH /api/v1/admin/orders/:id/status` (complété avec validation)
- `PATCH /api/v1/admin/shipments/:id/collect-cod`

## Audit
`ORDER_CONFIRMED_CALL`, `ORDER_CONFIRMED_WHATSAPP`, `ORDER_CONFIRMATION_REQUIRED_BLOCKED`, `ORDER_COD_COLLECTED`.

## Notifications
- `enqueueSms` client après confirmation (`order.confirmed` v1).
- `enqueueWhatsapp` (`order.confirmation.whatsapp` v1, FakeWhatsAppAdapter en dev).

## Migration
`prisma/migrations/20261124100000_pay01_cod_confirmation/migration.sql` (additive).

## Seed
`order.codConfirmationThreshold` = 100 000 XAF (upsert idempotent).
