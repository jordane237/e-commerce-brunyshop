-- Statut par défaut des nouveaux comptes (voir migration précédente).
ALTER TABLE "User" ALTER COLUMN "status" SET DEFAULT 'PENDING_VERIFICATION';

-- Aligne les colonnes de consentement (AUT-01) sur prisma/schema.prisma :
-- termsVersion est optionnel (String?), les types correspondent aux
-- conventions Prisma (TEXT / TIMESTAMP(3)).
ALTER TABLE "User"
  ALTER COLUMN "termsVersion" DROP NOT NULL,
  ALTER COLUMN "termsVersion" SET DATA TYPE TEXT,
  ALTER COLUMN "termsAcceptedAt" SET DATA TYPE TIMESTAMP(3);
