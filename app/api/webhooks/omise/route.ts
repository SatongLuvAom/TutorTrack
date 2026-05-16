import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { handleOmiseWebhook, PaymentWebhookError } from "@/services/payment-webhook.service";

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
): NextResponse {
  return NextResponse.json(body, { status });
}

function safeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function getPresentedWebhookSecret(request: NextRequest): string | null {
  const headerSecret = request.headers.get("x-omise-webhook-secret");
  if (headerSecret) {
    return headerSecret;
  }

  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length);
  }

  return request.nextUrl.searchParams.get("secret");
}

function isWebhookAuthorized(request: NextRequest): boolean {
  const { OMISE_WEBHOOK_SECRET } = getServerEnv();

  if (!OMISE_WEBHOOK_SECRET) {
    return true;
  }

  const presented = getPresentedWebhookSecret(request);

  return presented ? safeEquals(presented, OMISE_WEBHOOK_SECRET) : false;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isWebhookAuthorized(request)) {
    return jsonResponse({ error: "Unauthorized webhook." }, 401);
  }

  let event: unknown;
  try {
    event = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid webhook JSON." }, 400);
  }

  try {
    const result = await handleOmiseWebhook(event);

    return jsonResponse({
      processed: result.processed,
      ignored: result.ignored,
    });
  } catch (error) {
    if (error instanceof PaymentWebhookError) {
      return jsonResponse({ error: "Invalid webhook payload." }, 400);
    }

    return jsonResponse({ error: "Unable to process webhook." }, 500);
  }
}
