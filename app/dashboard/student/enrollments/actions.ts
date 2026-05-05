"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission, requireStudent } from "@/lib/guards";
import { canCancelEnrollment } from "@/lib/permissions";
import {
  cancelStudentEnrollment,
  EnrollmentManagementError,
} from "@/services/enrollment.service";
import { enrollmentCancelSchema } from "@/lib/validators/enrollment";

function readString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function safeReturnPath(value: string | undefined): string {
  if (
    value === "/dashboard/student/enrollments" ||
    value?.startsWith("/dashboard/student/enrollments?")
  ) {
    return value;
  }

  return "/dashboard/student/enrollments";
}

function redirectWithError(path: string, message: string): never {
  const [pathname, queryString] = path.split("?", 2);
  const params = new URLSearchParams(queryString);
  params.set("error", message);

  redirect(`${pathname}?${params.toString()}`);
}

function errorMessage(error: unknown): string {
  if (error instanceof EnrollmentManagementError) {
    if (error.code === "ONLY_PENDING_CAN_BE_CANCELLED") {
      return "Only pending enrollments can be cancelled.";
    }

    if (error.code === "FORBIDDEN") {
      return "You do not have permission to cancel this enrollment.";
    }
  }

  return "Unable to cancel enrollment.";
}

export async function cancelStudentEnrollmentAction(
  formData: FormData,
): Promise<void> {
  const parsed = enrollmentCancelSchema.safeParse({
    enrollmentId: readString(formData, "enrollmentId"),
    returnTo: readString(formData, "returnTo"),
  });

  const returnTo = safeReturnPath(
    parsed.success ? parsed.data.returnTo : undefined,
  );

  if (!parsed.success) {
    redirectWithError(returnTo, "Missing enrollment id.");
  }

  const user = await requireStudent();
  await requirePermission(canCancelEnrollment(user, parsed.data.enrollmentId));

  try {
    await cancelStudentEnrollment(user.id, parsed.data.enrollmentId);
  } catch (error) {
    redirectWithError(returnTo, errorMessage(error));
  }

  revalidatePath("/dashboard/student/enrollments");
  redirect(returnTo);
}
