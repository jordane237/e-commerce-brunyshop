-- PAY-01 : confirmation COD (appel/WhatsApp) + encaissement à la livraison.
-- Migration additive : aucune donnée existante n'est réécrite.

-- Enum des méthodes de confirmation.
CREATE TYPE "OrderConfirmationMethod" AS ENUM ('CALL', 'WHATSAPP');

-- Order : traçabilité de la confirmation.
ALTER TABLE "Order"
  ADD COLUMN "confirmed_at" TIMESTAMP(3),
  ADD COLUMN "confirmed_by" TEXT,
  ADD COLUMN "confirmation_method" "OrderConfirmationMethod",
  ADD COLUMN "confirmation_notes" VARCHAR(500);

CREATE INDEX "Order_confirmedAt_idx" ON "Order" ("confirmed_at");
CREATE INDEX "Order_confirmationMethod_idx" ON "Order" ("confirmation_method");

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_confirmedBy_fkey"
  FOREIGN KEY ("confirmed_by") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Shipment : traçabilité de l'encaissement COD.
ALTER TABLE "Shipment"
  ADD COLUMN "cod_collected_at" TIMESTAMP(3),
  ADD COLUMN "cod_collected_by" TEXT,
  ADD COLUMN "cod_amount" INTEGER;

CREATE INDEX "Shipment_codCollectedAt_idx" ON "Shipment" ("cod_collected_at");

ALTER TABLE "Shipment"
  ADD CONSTRAINT "Shipment_codCollectedBy_fkey"
  FOREIGN KEY ("cod_collected_by") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
