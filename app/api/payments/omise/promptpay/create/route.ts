import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { canCreatePayment } from "@/lib/permissions";
import { isSameOriginRequest } from "@/lib/request-security";
import { createPromptPayPaymentSchema } from "@/lib/validators/payment-gateway";
import {
  createPromptPayPayment,
  PaymentManagementError,
} from "@/services/payment.service";

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function mapPaymentError(error: unknown): NextResponse {
  if (error instanceof PaymentManagementError) {
    if (error.code === "FORBIDDEN" || error.code === "PARENT_CHILD_LINK_REQUIRED") {
      return jsonError("Forbidden.", 403);
    }

    if (error.code === "ENROLLMENT_NOT_FOUND") {
      return jsonError("Enrollment not found.", 404);
    }

    if (
      error.code === "ENROLLMENT_NOT_PAYABLE" ||
      error.code === "DUPLICATE_PENDING_PAYMENT" ||
      error.code === "AMOUNT_MISMATCH"
    ) {
      return jsonError(error.message, 409);
    }

    if (
      error.code === "GATEWAY_NOT_CONFIGURED" ||
      error.code === "GATEWAY_CHARGE_FAILED"
    ) {
      return jsonError(error.message, 502);
    }
  }

  return jsonError("Unable to create PromptPay payment.", 500);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Authentication required.", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const parsed = createPromptPayPaymentSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid payment request.", 400);
  }

  if (!(await canCreatePayment(user, parsed.data.enrollmentId))) {
    return jsonError("Forbidden.", 403);
  }

  try {
    const result = await createPromptPayPayment(
      user,
      parsed.data.enrollmentId,
      parsed.data,
    );

    return NextResponse.json({
      data: {
        paymentId: result.payment.id,
        status: result.payment.status,
        providerStatus: result.providerStatus,
        providerChargeId: result.providerChargeId,
        providerSourceId: result.providerSourceId,
        authorizeUri: result.authorizeUri,
        qrCodeImageUrl: result.qrCodeImageUrl,
        expiresAt: result.expiresAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    return mapPaymentError(error);
  }
}
