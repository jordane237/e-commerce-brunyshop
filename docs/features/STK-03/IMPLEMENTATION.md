# STK-03 — Implémentation

## Flux

```text
OrdersService
  └─ transaction : décrément atomique du stock
  └─ après commit : InventoryService.emitLowStockEvents()
       └─ événement stock.low
            └─ StockLowListener
                 ├─ UPDATE conditionnel lowStockAlertSentAt
                 ├─ notification IN_APP par administrateur interne
                 ├─ email interne
                 └─ audit STOCK_LOW_ALERT_SENT
```

L’événement est émis après le commit de la commande. Un rollback ne produit
aucune alerte. Une panne de notification est journalisée et ne fait pas échouer
la commande déjà enregistrée.

## Anti-spam

`ProductVariant.lowStockAlertSentAt` est nullable et indexé. Le listener pose la
date avec un UPDATE conditionnel `WHERE lowStockAlertSentAt IS NULL`. Un seul
événement concurrent peut donc réclamer l’alerte.

Le réapprovisionnement via `PUT /admin/products/:id/variants` remet le flag à
`NULL` lorsque le stock repasse au-dessus du seuil effectif de la variante.

## Seuil

Hiérarchie :

```text
seuil de la variante
  > Setting stock.low.defaultThreshold
  > STOCK_LOW_THRESHOLD_DEFAULT
  > 5
```

La clé existante `stock.low.defaultThreshold` est réutilisée, pas dupliquée.
`SettingsService` fournit le seuil global à la création de variantes.

## Notifications

- `NotificationsService.enqueueInApp()` crée une notification `IN_APP`
  immédiatement `SENT`, avec titre et corps rendus dans `metadata`.
- L’email utilise le template versionné `stock.low` / `v1`.
- Les destinataires sont les utilisateurs `ACTIVE` portant `SUPER_ADMIN`,
  `ADMIN` ou `STOCK_MANAGER`.

## API

```http
GET /api/v1/admin/stock/alerts?page=1&limit=20&threshold=5&productId=<uuid>
```

Rôles autorisés : `SUPER_ADMIN`, `ADMIN`, `STOCK_MANAGER`, `ORDER_MANAGER`.

La réponse contient `stock`, `reservedStock`, `availableStock`, `threshold`,
`status` (`LOW` ou `OUT`) et les compteurs paginés. Le filtre `productId` sert à
la vue A06 filtrée sur un produit.

## Audit

`AuditLog.userId` devient nullable pour représenter une action système. La
migration conserve les entrées existantes et passe la clé étrangère en
`ON DELETE SET NULL`. L’action `STOCK_LOW_ALERT_SENT` est écrite avec
`userId: null`.

## Fichiers principaux

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20261116120000_stk03_low_stock_alerts/`
- `backend/src/modules/settings/settings.service.ts`
- `backend/src/modules/inventory/events/stock-low.event.ts`
- `backend/src/modules/inventory/listeners/stock-low.listener.ts`
- `backend/src/modules/inventory/admin/`
- `backend/src/modules/notifications/templates/fr/stock.low.v1.ts`
- `backend/openapi.json`
