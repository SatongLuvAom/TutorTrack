"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requirePermission } from "@/lib/guards";
import { canManageEnrollmentStatus } from "@/lib/permissions";
import {
  adminUpdateEnrollmentStatus,
  EnrollmentManagementError,
} from "@/services/enrollment.service";
import { enrollmentStatusUpdateSchema } from "@/lib/validators/enrollment";

function readString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function safeReturnPath(value: string | undefined): string {
  if (
    value === "/dashboard/admin/enrollments" ||
    value?.startsWith("/dashboard/admin/enrollments?")
  ) {
    return value;
  }

  return "/dashboard/admin/enrollments";
}

function redirectWithError(path: string, message: string): never {
  const [pathname, queryString] = path.split("?", 2);
  const params = new URLSearchParams(queryString);
  params.set("error", message);

  redirect(`${pathname}?${params.toString()}`);
}

function errorMessage(error: unknown): string {
  if (error instanceof EnrollmentManagementError) {
    if (error.code === "INVALID_STATUS_TRANSITION") {
      return "Invalid enrollment status transition.";
    }

    if (error.code === "ENROLLMENT_NOT_FOUND") {
      return "Enrollment not found.";
    }
  }

  return "Unable to update enrollment status.";
}

export async function updateAdminEnrollmentStatusAction(
  formData: FormData,
): Promise<void> {
  const parsed = enrollmentStatusUpdateSchema.safeParse({
    enrollmentId: readString(formData, "enrollmentId"),
    status: readString(formData, "status"),
    returnTo: readString(formData, "returnTo"),
  });

  const returnTo = safeReturnPath(
    parsed.success ? parsed.data.returnTo : undefined,
  );

  if (!parsed.success) {
    redirectWithError(returnTo, "Missing enrollment status information.");
  }

  const user = await requireAdmin();
  await requirePermission(
    canManageEnrollmentStatus(user, parsed.data.enrollmentId),
  );

  try {
    await adminUpdateEnrollmentStatus(
      user.id,
      parsed.data.enrollmentId,
      parsed.data.status,
    );
  } catch (error) {
    redirectWithError(returnTo, errorMessage(error));
  }

  revalidatePath("/dashboard/admin/enrollments");
  revalidatePath("/dashboard/tutor/enrollments");
  redirect(returnTo);
}
