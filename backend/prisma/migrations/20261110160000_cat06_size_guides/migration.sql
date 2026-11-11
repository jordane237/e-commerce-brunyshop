-- CAT-06: size guides and the optional Category -> SizeGuide relation.
CREATE TABLE "size_guides" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "table" JSONB NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "size_guides_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "size_guides_slug_key" ON "size_guides"("slug");
CREATE INDEX "size_guides_slug_idx" ON "size_guides"("slug");
CREATE INDEX "Category_sizeGuideId_idx" ON "Category"("sizeGuideId");

ALTER TABLE "Category"
  ADD CONSTRAINT "Category_sizeGuideId_fkey"
  FOREIGN KEY ("sizeGuideId") REFERENCES "size_guides"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
