import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { canViewPayment } from "@/lib/permissions";
import { paymentStatusQuerySchema } from "@/lib/validators/payment-gateway";
import { getPaymentStatus } from "@/services/payment.service";

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

type PaymentStatusRouteProps = {
  params: Promise<{ paymentId: string }>;
};

export async function GET(
  _request: NextRequest,
  { params }: PaymentStatusRouteProps,
): Promise<NextResponse> {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Authentication required.", 401);
  }

  const parsed = paymentStatusQuerySchema.safeParse(await params);

  if (!parsed.success) {
    return jsonError("Invalid payment id.", 400);
  }

  if (!(await canViewPayment(user, parsed.data.paymentId))) {
    return jsonError("Forbidden.", 403);
  }

  const payment = await getPaymentStatus(parsed.data.paymentId);

  if (!payment) {
    return jsonError("Payment not found.", 404);
  }

  return NextResponse.json({
    data: {
      id: payment.id,
      status: payment.status,
      provider: payment.provider,
      providerStatus: payment.providerStatus,
      method: payment.method,
      amountCents: payment.amountCents,
      paidAt: payment.paidAt?.toISOString() ?? null,
      failedAt: payment.failedAt?.toISOString() ?? null,
      expiresAt: payment.expiresAt?.toISOString() ?? null,
      updatedAt: payment.updatedAt.toISOString(),
    },
  });
}
