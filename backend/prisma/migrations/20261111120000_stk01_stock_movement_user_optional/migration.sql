-- STK-01: guest checkout has no User row.
-- StockMovement keeps orderId for business traceability; userId becomes
-- nullable so a guest purchase can still write its stock movement.
ALTER TABLE "StockMovement" ALTER COLUMN "userId" DROP NOT NULL;
