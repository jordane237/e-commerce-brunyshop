-- CAT-05: trace the processed WebP key so delete can remove all 3 versions.
ALTER TABLE "ProductImage" ADD COLUMN "storageKey" TEXT;
