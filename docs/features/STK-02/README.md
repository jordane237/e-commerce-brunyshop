# STK-02 — Ajustements manuels de stock avec motif et historique

## Endpoints
- `POST /api/v1/admin/variants/:id/stock-adjust` — ajuster le stock d'une variante (motif requis).
- `GET /api/v1/admin/stock-movements` — historique des mouvements (filtres : variantId, from, to, motif ; pagination page/limit max 100).

## Règles
- `newStock >= 0` (400 `INVALID_STOCK` sinon).
- `motif` requis et enum `StockAdjustmentMotif` (RECEPTION, INVENTAIRE, CASSE, RETOUR, AUTRE).
- Chaque ajustement crée un `StockMovement` (delta signé, reason=`ADJUSTMENT`, motif, notes?, before, after, userId, orderId=null).
- RBAC : `STOCK_MANAGER`, `ADMIN`, `SUPER_ADMIN` (403 sinon, 401 sans JWT).
- Audit : `PRODUCT_STOCK_ADJUSTED` avec before/after/motif/delta/notes.

## Migration
- `20261123100000_stk02_stock_movement_motif` : ajout enum `StockAdjustmentMotif`, colonnes `motif`, `notes`, index.

## Note BO-06 (futur)
Le formulaire admin (A06) pour saisir le nouveau stock + motif + notes via l'UI, et la vue historique (timeline/table filtrable), seront implémentés dans BO-06. En attendant, l'ajustement et l'historique sont accessibles via l'API (Swagger, curl).