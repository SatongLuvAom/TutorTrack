-- Improve admin payment list sorting and date filtering.
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");
