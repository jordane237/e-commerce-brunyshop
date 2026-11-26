# Orders module

Owns order creation, immutable line snapshots, idempotency and the first step of
the order lifecycle. `POST /api/v1/orders` (STK-01) creates an order, its
payment/shipment placeholders and atomically decrements stock in the same
Prisma transaction.

Full contract: [`docs/backend/stock.md`](../../../../docs/backend/stock.md).
