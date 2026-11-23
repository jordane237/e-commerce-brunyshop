-- STK-02 : ajustements manuels de stock avec motif et historique.
-- Migration additive : aucune colonne existante n'est modifiée ni supprimée.

CREATE TYPE "StockAdjustmentMotif" AS ENUM (
  'RECEPTION',
  'INVENTAIRE',
  'CASSE',
  'RETOUR',
  'AUTRE'
);

ALTER TABLE "StockMovement"
  ADD COLUMN "motif" "StockAdjustmentMotif",
  ADD COLUMN "notes" TEXT;

CREATE INDEX "StockMovement_variantId_createdAt_idx"
  ON "StockMovement" ("variantId", "createdAt");

CREATE INDEX "StockMovement_motif_idx"
  ON "StockMovement" ("motif");
