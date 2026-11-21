-- MKT-02: support triage workflow for contact messages.
-- Additive only: the AUT-11 table and its columns are preserved.

CREATE TYPE "ContactMessageStatus" AS ENUM ('NEW', 'READ', 'REPLIED', 'SPAM', 'CLOSED');

ALTER TABLE "ContactMessage"
    ADD COLUMN "status" "ContactMessageStatus" NOT NULL DEFAULT 'NEW',
    ADD COLUMN "handledAt" TIMESTAMP(3),
    ADD COLUMN "handledBy" TEXT;

CREATE INDEX "ContactMessage_status_idx" ON "ContactMessage"("status");

ALTER TABLE "ContactMessage"
    ADD CONSTRAINT "ContactMessage_handledBy_fkey"
    FOREIGN KEY ("handledBy") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
