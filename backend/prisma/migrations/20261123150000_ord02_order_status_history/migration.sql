-- ORD-02 : historique des transitions de statut de commande.
-- Migration additive : nouvelle table uniquement, aucune donnée existante
-- n'est réécrite. Les commandes antérieures n'ont simplement pas d'historique
-- initial, ce que l'API tolère (liste vide).

CREATE TABLE "OrderStatusHistory" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "fromStatus" "OrderStatus",
  "toStatus" "OrderStatus" NOT NULL,
  "reason" TEXT,
  "note" TEXT,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderStatusHistory_orderId_createdAt_idx"
  ON "OrderStatusHistory" ("orderId", "createdAt");

CREATE INDEX "OrderStatusHistory_userId_idx"
  ON "OrderStatusHistory" ("userId");

ALTER TABLE "OrderStatusHistory"
  ADD CONSTRAINT "OrderStatusHistory_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderStatusHistory"
  ADD CONSTRAINT "OrderStatusHistory_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
