-- Add gateway references while preserving the existing manual payment workflow.
CREATE TYPE "PaymentProvider" AS ENUM ('MANUAL', 'OMISE');

ALTER TABLE "Payment"
  ADD COLUMN "provider" "PaymentProvider" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "failedAt" TIMESTAMP(3),
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "providerChargeId" TEXT,
  ADD COLUMN "providerSourceId" TEXT,
  ADD COLUMN "providerStatus" TEXT,
  ADD COLUMN "providerPayload" JSONB,
  ADD COLUMN "webhookEventId" TEXT,
  ADD COLUMN "lastWebhookAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Payment_providerChargeId_key" ON "Payment"("providerChargeId");
CREATE INDEX "Payment_provider_idx" ON "Payment"("provider");
CREATE INDEX "Payment_failedAt_idx" ON "Payment"("failedAt");
CREATE INDEX "Payment_expiresAt_idx" ON "Payment"("expiresAt");
CREATE INDEX "Payment_providerSourceId_idx" ON "Payment"("providerSourceId");
CREATE INDEX "Payment_webhookEventId_idx" ON "Payment"("webhookEventId");
CREATE INDEX "Payment_provider_status_idx" ON "Payment"("provider", "status");
