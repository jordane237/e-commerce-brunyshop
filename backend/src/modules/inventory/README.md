# Inventory module

Owns transactional stock movements. `InventoryService.decrementStockAtomically`
(STK-01) runs a conditional `UPDATE ... RETURNING` inside the caller's
transaction, writes the matching `StockMovement`, and returns
`INSUFFICIENT_STOCK` when no row can be decremented.

Reservations, release and manual adjustment workflows remain to be implemented.

Full contract: [`docs/backend/stock.md`](../../../../docs/backend/stock.md).
