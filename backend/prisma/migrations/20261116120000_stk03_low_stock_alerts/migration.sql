-- STK-03 : alerte de stock bas.
-- Le flag permet une seule alerte par franchissement du seuil ; il est remis
-- à NULL lorsque le stock repasse au-dessus du seuil.
ALTER TABLE "ProductVariant" ADD COLUMN "lowStockAlertSentAt" TIMESTAMP(3);
CREATE INDEX "ProductVariant_lowStockAlertSentAt_idx"
  ON "ProductVariant" ("lowStockAlertSentAt");

-- Les alertes stock bas sont des actions système : aucun utilisateur humain
-- ne peut être associé. On conserve les entrées existantes et on autorise
-- uniquement les nouvelles entrées sans acteur.
ALTER TABLE "AuditLog" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
