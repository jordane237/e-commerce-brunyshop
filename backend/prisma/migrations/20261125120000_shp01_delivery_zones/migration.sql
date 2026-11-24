-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('HOME', 'RELAY', 'PICKUP');

-- AlterTable
ALTER TABLE "DeliveryZone"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "modes" "DeliveryMode"[] NOT NULL DEFAULT ARRAY['HOME']::"DeliveryMode"[],
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryZone_name_key" ON "DeliveryZone"("name");
