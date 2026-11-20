-- Add terms and consent fields to User (AUT-01)

-- Add termsVersion column (nullable String with default '1.0')
ALTER TABLE "User" ADD COLUMN "termsVersion" VARCHAR(255) NOT NULL DEFAULT '1.0';

-- Add termsAcceptedAt column (nullable DateTime)
ALTER TABLE "User" ADD COLUMN "termsAcceptedAt" TIMESTAMP WITH TIME ZONE;
