"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PaymentStatus } from "@/lib/generated/prisma/enums";
import { requireAdmin, requirePermission } from "@/lib/guards";
import { canVerifyPayment } from "@/lib/permissions";
import { paymentStatusUpdateSchema } from "@/lib/validators/payment";
import {
  adminVerifyPayment,
  PaymentManagementError,
} from "@/services/payment.service";

function readString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function safeReturnPath(value: string | undefined, paymentId?: string): string {
  const detail = paymentId ? `/dashboard/admin/payments/${paymentId}` : undefined;

  if (
    value === "/dashboard/admin/payments" ||
    value?.startsWith("/dashboard/admin/payments?") ||
    (detail && (value === detail || value?.startsWith(`${detail}?`)))
  ) {
    return value;
  }

  return detail ?? "/dashboard/admin/payments";
}

function redirectWithError(path: string, message: string): never {
  const [pathname, queryString] = path.split("?", 2);
  const params = new URLSearchParams(queryString);
  params.set("error", message);

  redirect(`${pathname}?${params.toString()}`);
}

function errorMessage(error: unknown): string {
  if (error instanceof PaymentManagementError) {
    if (error.code === "INVALID_STATUS_TRANSITION") {
      return "Invalid payment status transition.";
    }

    if (error.code === "PAYMENT_NOT_FOUND") {
      return "Payment not found.";
    }
  }

  return "Unable to update payment status.";
}

export async function updateAdminPaymentStatusAction(
  formData: FormData,
): Promise<void> {
  const parsed = paymentStatusUpdateSchema.safeParse({
    paymentId: readString(formData, "paymentId"),
    status: readString(formData, "status"),
    returnTo: readString(formData, "returnTo"),
  });
  const returnTo = safeReturnPath(
    parsed.success ? parsed.data.returnTo : undefined,
    parsed.success ? parsed.data.paymentId : undefined,
  );

  if (!parsed.success) {
    redirectWithError(returnTo, "Missing payment status information.");
  }

  const user = await requireAdmin();
  await requirePermission(canVerifyPayment(user, parsed.data.paymentId));

  try {
    await adminVerifyPayment(user.id, parsed.data.paymentId, parsed.data.status);
  } catch (error) {
    redirectWithError(returnTo, errorMessage(error));
  }

  revalidatePath("/dashboard/admin/payments");
  revalidatePath(`/dashboard/admin/payments/${parsed.data.paymentId}`);
  revalidatePath("/dashboard/tutor/payments");
  revalidatePath("/dashboard/admin/enrollments");
  redirect(returnTo);
}

async function updateAdminPaymentStatusWithIntent(
  formData: FormData,
  status: PaymentStatus,
): Promise<void> {
  const paymentId = readString(formData, "paymentId");
  const returnTo = safeReturnPath(readString(formData, "returnTo"), paymentId);

  if (!paymentId) {
    redirectWithError(returnTo, "Missing payment id.");
  }

  const nextFormData = new FormData();
  nextFormData.set("paymentId", paymentId);
  nextFormData.set("status", status);
  nextFormData.set("returnTo", returnTo);

  await updateAdminPaymentStatusAction(nextFormData);
}

export async function markPaymentPaidAction(
  formData: FormData,
): Promise<void> {
  await updateAdminPaymentStatusWithIntent(formData, PaymentStatus.PAID);
}

export async function markPaymentFailedAction(
  formData: FormData,
): Promise<void> {
  await updateAdminPaymentStatusWithIntent(formData, PaymentStatus.FAILED);
}

export async function markPaymentRefundedAction(
  formData: FormData,
): Promise<void> {
  await updateAdminPaymentStatusWithIntent(formData, PaymentStatus.REFUNDED);
}
