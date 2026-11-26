-- BO-05 : les variantes déjà vendues sont archivées, jamais supprimées.
ALTER TABLE "ProductVariant" ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE INDEX "ProductVariant_archivedAt_idx" ON "ProductVariant"("archivedAt");
