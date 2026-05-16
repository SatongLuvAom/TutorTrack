"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireParent, requirePermission } from "@/lib/guards";
import { canCreatePayment, canViewParentChild } from "@/lib/permissions";
import {
  parentPaymentCreateSchema,
  paymentCreateSchema,
} from "@/lib/validators/payment";
import {
  createParentChildPayment,
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

  return "Unable to create child payment.";
}

function redirectWithError(path: string, message: string): never {
  const [pathname, queryString] = path.split("?", 2);
  const params = new URLSearchParams(queryString);
  params.set("error", message);

  redirect(`${pathname}?${params.toString()}`);
}

function paymentErrorMessage(error: unknown): string {
  if (error instanceof PaymentManagementError) {
    if (error.code === "PARENT_CHILD_LINK_REQUIRED") {
      return "Parent can create payments only for active linked children.";
    }

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

  return "Unable to create child payment.";
}

export async function createParentChildPaymentAction(
  formData: FormData,
): Promise<void> {
  const studentId = readString(formData, "studentId");
  const enrollmentId = readString(formData, "enrollmentId");
  const fallback =
    studentId && enrollmentId
      ? `/dashboard/parent/children/${studentId}/enrollments/${enrollmentId}/payment`
      : "/dashboard/parent";
  const parsed = parentPaymentCreateSchema.safeParse({
    studentId,
    enrollmentId,
    amount: readString(formData, "amount"),
    method: readString(formData, "method"),
    proofUrl: readString(formData, "proofUrl"),
    note: readString(formData, "note"),
  });

  if (!parsed.success) {
    redirectWithError(fallback, firstValidationMessage(parsed.error));
  }

  const user = await requireParent();
  await requirePermission(canViewParentChild(user, parsed.data.studentId));
  await requirePermission(canCreatePayment(user, parsed.data.enrollmentId));

  try {
    await createParentChildPayment(
      user.id,
      parsed.data.studentId,
      parsed.data.enrollmentId,
      paymentCreateSchema.parse(parsed.data),
    );
  } catch (error) {
    redirectWithError(fallback, paymentErrorMessage(error));
  }

  revalidatePath(`/dashboard/parent/children/${parsed.data.studentId}/payments`);
  revalidatePath(
    `/dashboard/parent/children/${parsed.data.studentId}/enrollments`,
  );
  redirect(`/dashboard/parent/children/${parsed.data.studentId}/payments?created=1`);
}
