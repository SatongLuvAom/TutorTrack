"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission, requireStudent } from "@/lib/guards";
import { canCreatePayment } from "@/lib/permissions";
import { paymentCreateSchema } from "@/lib/validators/payment";
import {
  createStudentPayment,
  PaymentManagementError,
} from "@/services/payment.service";

function readString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function firstValidationMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "issues" in error &&
    Array.isArray(error.issues) &&
    error.issues[0] &&
    typeof error.issues[0] === "object" &&
    "message" in error.issues[0] &&
    typeof error.issues[0].message === "string"
  ) {
    return error.issues[0].message;
  }

  return "Unable to create payment.";
}

function redirectWithError(path: string, message: string): never {
  const [pathname, queryString] = path.split("?", 2);
  const params = new URLSearchParams(queryString);
  params.set("error", message);

  redirect(`${pathname}?${params.toString()}`);
}

function paymentErrorMessage(error: unknown): string {
  if (error instanceof PaymentManagementError) {
    if (error.code === "ENROLLMENT_NOT_PAYABLE") {
      return "Payments can be created only for pending or active enrollments.";
    }

    if (error.code === "DUPLICATE_PENDING_PAYMENT") {
      return "This enrollment already has a pending payment.";
    }

    if (error.code === "FORBIDDEN") {
      return "You do not have permission to create this payment.";
    }
  }

  return "Unable to create payment.";
}

export async function createStudentPaymentAction(
  formData: FormData,
): Promise<void> {
  const enrollmentId = readString(formData, "enrollmentId");
  const fallback = enrollmentId
    ? `/dashboard/student/enrollments/${enrollmentId}/payment`
    : "/dashboard/student/enrollments";
  const parsed = paymentCreateSchema.safeParse({
    enrollmentId,
    amount: readString(formData, "amount"),
    method: readString(formData, "method"),
    proofUrl: readString(formData, "proofUrl"),
    note: readString(formData, "note"),
  });

  if (!parsed.success) {
    redirectWithError(fallback, firstValidationMessage(parsed.error));
  }

  const user = await requireStudent();
  await requirePermission(canCreatePayment(user, parsed.data.enrollmentId));

  try {
    await createStudentPayment(user.id, parsed.data.enrollmentId, parsed.data);
  } catch (error) {
    redirectWithError(fallback, paymentErrorMessage(error));
  }

  revalidatePath("/dashboard/student/payments");
  revalidatePath("/dashboard/student/enrollments");
  redirect("/dashboard/student/payments?created=1");
}
