import { PaymentStatus } from "@/lib/generated/prisma/client";
import { omiseWebhookSchema } from "@/lib/validators/payment-gateway";
import {
  applyGatewayChargeStatus,
  type PaymentWriteStore,
} from "@/services/payment.service";
import {
  createOmiseClient,
  mapOmiseChargeToPaymentStatus,
  type OmiseCharge,
  type OmiseClient,
} from "@/services/payment-gateway/omise.service";

export type OmiseWebhookResult = {
  processed: boolean;
  ignored: boolean;
  paymentId: string | null;
  status: PaymentStatus | null;
};

export class PaymentWebhookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentWebhookError";
  }
}

function getChargeId(event: unknown): string | null {
  const parsed = omiseWebhookSchema.safeParse(event);

  return parsed.success ? parsed.data.data.id : null;
}

export async function handleChargeComplete(
  event: unknown,
  gatewayClient: OmiseClient = createOmiseClient(),
  store?: PaymentWriteStore,
): Promise<OmiseWebhookResult> {
  const parsed = omiseWebhookSchema.safeParse(event);

  if (!parsed.success) {
    throw new PaymentWebhookError("Invalid Omise webhook payload.");
  }

  const charge = await gatewayClient.retrieveCharge(parsed.data.data.id);
  const payment = await applyGatewayChargeStatus(
    charge.id,
    charge,
    parsed.data.id ?? charge.id,
    store,
  );

  return {
    processed: Boolean(payment),
    ignored: !payment,
    paymentId: payment?.id ?? null,
    status: payment?.status ?? mapOmiseChargeToPaymentStatus(charge),
  };
}

export async function handleOmiseWebhook(
  event: unknown,
  gatewayClient: OmiseClient = createOmiseClient(),
  store?: PaymentWriteStore,
): Promise<OmiseWebhookResult> {
  const key =
    typeof event === "object" && event !== null && "key" in event
      ? String((event as { key?: unknown }).key)
      : "";

  if (key !== "charge.complete") {
    return {
      processed: false,
      ignored: true,
      paymentId: null,
      status: null,
    };
  }

  return handleChargeComplete(event, gatewayClient, store);
}

export function extractChargeIdFromOmiseWebhook(event: unknown): string | null {
  return getChargeId(event);
}

export type { OmiseCharge };
