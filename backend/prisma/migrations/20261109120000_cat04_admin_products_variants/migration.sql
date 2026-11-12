-- CAT-04 : une seule variante par couple (produit, couleur, pointure).
-- Vérifié sans doublon en base avant application.
CREATE UNIQUE INDEX "ProductVariant_productId_color_size_key"
  ON "ProductVariant" ("productId", "color", "size");

-- CAT-04 : contexte HTTP de l'acteur dans le journal d'audit.
-- Nullable : les entrées existantes restent valides sans backfill.
ALTER TABLE "AuditLog" ADD COLUMN "userAgent" TEXT;
