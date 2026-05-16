import { PaymentStatus } from "@/lib/generated/prisma/client";
import { getServerEnv } from "@/lib/env";

const OMISE_API_BASE_URL = "https://api.omise.co";

export type OmiseSource = {
  id: string;
  type?: string;
  scannable_code?: {
    image?: {
      download_uri?: string;
    };
  } | null;
};

export type OmiseCharge = {
  id: string;
  amount?: number;
  currency?: string;
  status?: string;
  paid?: boolean;
  expired?: boolean;
  failure_code?: string | null;
  failure_message?: string | null;
  paid_at?: string | null;
  expires_at?: string | null;
  authorize_uri?: string | null;
  source?: OmiseSource | null;
  metadata?: Record<string, unknown> | null;
};

export type PromptPayChargeInput = {
  amountCents: number;
  currency: "THB";
  paymentId: string;
  enrollmentId: string;
  description: string;
};

export type PromptPayChargeResult = {
  id: string;
  sourceId: string | null;
  status: string | null;
  authorizeUri: string | null;
  qrCodeImageUrl: string | null;
  expiresAt: Date | null;
  raw: OmiseCharge;
};

export type OmiseClient = {
  createPromptPayCharge(input: PromptPayChargeInput): Promise<OmiseCharge>;
  retrieveCharge(chargeId: string): Promise<OmiseCharge>;
};

export class OmiseGatewayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OmiseGatewayError";
  }
}

function getOmiseSecretKey(): string {
  const { OMISE_SECRET_KEY } = getServerEnv();

  if (!OMISE_SECRET_KEY) {
    throw new OmiseGatewayError("OMISE_SECRET_KEY is not configured.");
  }

  return OMISE_SECRET_KEY;
}

function buildAuthHeader(secretKey: string): string {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

async function omiseRequest<T>(
  path: string,
  init: RequestInit = {},
  secretKey = getOmiseSecretKey(),
): Promise<T> {
  const response = await fetch(`${OMISE_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: buildAuthHeader(secretKey),
      ...(init.body instanceof URLSearchParams
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : {}),
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new OmiseGatewayError(`Omise API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

function toPromptPayChargeResult(charge: OmiseCharge): PromptPayChargeResult {
  return {
    id: charge.id,
    sourceId: charge.source?.id ?? null,
    status: charge.status ?? null,
    authorizeUri: charge.authorize_uri ?? null,
    qrCodeImageUrl:
      charge.source?.scannable_code?.image?.download_uri ?? null,
    expiresAt: charge.expires_at ? new Date(charge.expires_at) : null,
    raw: charge,
  };
}

function createForm(data: Record<string, string | number>): URLSearchParams {
  const form = new URLSearchParams();

  for (const [key, value] of Object.entries(data)) {
    form.set(key, String(value));
  }

  return form;
}

export function createOmiseClient(): OmiseClient {
  return {
    async createPromptPayCharge(input) {
      const source = await omiseRequest<OmiseSource>("/sources", {
        method: "POST",
        body: createForm({
          amount: input.amountCents,
          currency: input.currency,
          type: "promptpay",
        }),
      });

      return omiseRequest<OmiseCharge>("/charges", {
        method: "POST",
        body: createForm({
          amount: input.amountCents,
          currency: input.currency,
          source: source.id,
          description: input.description,
          "metadata[paymentId]": input.paymentId,
          "metadata[enrollmentId]": input.enrollmentId,
        }),
      });
    },

    retrieveCharge(chargeId) {
      return omiseRequest<OmiseCharge>(
        `/charges/${encodeURIComponent(chargeId)}`,
      );
    },
  };
}

export async function createPromptPayCharge(
  input: PromptPayChargeInput,
  client: OmiseClient = createOmiseClient(),
): Promise<PromptPayChargeResult> {
  return toPromptPayChargeResult(await client.createPromptPayCharge(input));
}

export function mapOmiseChargeToPaymentStatus(
  charge: OmiseCharge,
): PaymentStatus {
  if (charge.paid || charge.status === "successful") {
    return PaymentStatus.PAID;
  }

  if (
    charge.expired ||
    charge.status === "failed" ||
    charge.status === "expired"
  ) {
    return PaymentStatus.FAILED;
  }

  return PaymentStatus.PENDING;
}

export function sanitizeOmiseChargePayload(
  charge: OmiseCharge,
): Record<string, string | number | boolean | null> {
  return {
    provider: "OMISE",
    chargeId: charge.id,
    amount: charge.amount ?? null,
    currency: charge.currency ?? null,
    status: charge.status ?? null,
    paid: Boolean(charge.paid),
    expired: Boolean(charge.expired),
    failureCode: charge.failure_code ?? null,
    failureMessage: charge.failure_message ?? null,
    paidAt: charge.paid_at ?? null,
    expiresAt: charge.expires_at ?? null,
    sourceId: charge.source?.id ?? null,
    sourceType: charge.source?.type ?? null,
  };
}
