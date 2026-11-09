-- Migration additive NTF-01
-- Tables : notifications, dead_letter_jobs
-- Enums  : NotificationChannel, NotificationStatus
-- Index : userId, status, createdAt, templateKey/templateVersion, queueName, failedAt

CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'IN_APP');
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'DEAD_LETTER');

CREATE TABLE "notifications" (
  "id"              UUID            NOT NULL DEFAULT gen_random_uuid(),
  "userId"          UUID            REFERENCES "User"(id) ON DELETE SET NULL,
  "channel"         "NotificationChannel" NOT NULL,
  "templateKey"     VARCHAR(64)    NOT NULL,
  "templateVersion" VARCHAR(16)    NOT NULL,
  "recipient"       VARCHAR(255)   NOT NULL,
  "status"          "NotificationStatus" NOT NULL DEFAULT 'PENDING',
  "attempts"        INTEGER         NOT NULL DEFAULT 0,
  "lastError"       TEXT,
  "metadata"        JSONB,
  "sentAt"          TIMESTAMP,
  "createdAt"       TIMESTAMP       NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMP       NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX "notifications_status_idx" ON "notifications"("status");
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");
CREATE INDEX "notifications_templateKey_templateVersion_idx" ON "notifications"("templateKey", "templateVersion");

CREATE TABLE "dead_letter_jobs" (
  "id"          UUID            NOT NULL DEFAULT gen_random_uuid(),
  "queueName"   VARCHAR(64)    NOT NULL,
  "jobId"       VARCHAR(64)    NOT NULL,
  "jobName"     VARCHAR(64)    NOT NULL,
  "payload"     JSONB          NOT NULL,
  "error"       TEXT           NOT NULL,
  "attempts"    INTEGER        NOT NULL,
  "failedAt"    TIMESTAMP      NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

CREATE INDEX "dead_letter_jobs_queueName_idx" ON "dead_letter_jobs"("queueName");
CREATE INDEX "dead_letter_jobs_failedAt_idx" ON "dead_letter_jobs"("failedAt");
