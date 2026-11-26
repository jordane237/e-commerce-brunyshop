-- ORD-01: bind the idempotency key to the request payload so the same key
-- replaying a different body is rejected as a conflict instead of silently
-- returning an unrelated order. Nullable: existing rows keep no hash.
ALTER TABLE "Order" ADD COLUMN "idempotencyRequestHash" TEXT;
