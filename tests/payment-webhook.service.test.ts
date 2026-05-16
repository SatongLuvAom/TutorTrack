import { describe, expect, it } from "vitest";
import { PaymentStatus } from "../lib/generated/prisma/enums";
import { handleOmiseWebhook } from "../services/payment-webhook.service";
import type { PaymentWriteStore } from "../services/payment.service";
import type { OmiseClient, OmiseCharge } from "../services/payment-gateway/omise.service";

const successfulCharge: OmiseCharge = {
  id: "chrg_test_missing_local",
  status: "successful",
  paid: true,
  paid_at: "2026-05-10T01:00:00Z",
};

const gatewayClient: OmiseClient = {
  async createPromptPayCharge() {
    return successfulCharge;
  },
  async retrieveCharge() {
    return successfulCharge;
  },
};

const emptyStore = {
  async getPaymentForGatewayCharge() {
    return null;
  },
} as unknown as PaymentWriteStore;

describe("omise webhook handler", () => {
  it("ignores unsupported event types", async () => {
    const result = await handleOmiseWebhook(
      { id: "evnt_1", key: "charge.create", data: { id: "chrg_1" } },
      gatewayClient,
    );

    expect(result.processed).toBe(false);
    expect(result.ignored).toBe(true);
  });

  it("rejects invalid charge.complete payloads", async () => {
    await expect(
      handleOmiseWebhook({ id: "evnt_1", key: "charge.complete" }, gatewayClient),
    ).rejects.toThrow("Invalid Omise webhook payload");
  });

  it("retrieves provider charge status and ignores unknown local payments safely", async () => {
    const result = await handleOmiseWebhook(
      {
        id: "evnt_1",
        key: "charge.complete",
        data: { id: "chrg_test_missing_local" },
      },
      gatewayClient,
      emptyStore,
    );

    expect(result.processed).toBe(false);
    expect(result.ignored).toBe(true);
    expect(result.status).toBe(PaymentStatus.PAID);
  });
});
