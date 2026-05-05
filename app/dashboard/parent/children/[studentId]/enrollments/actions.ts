"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireParent, requirePermission } from "@/lib/guards";
import {
  canCancelEnrollment,
  canCreateParentChildEnrollment,
  canViewParentChild,
} from "@/lib/permissions";
import {
  cancelParentChildEnrollment,
  createParentChildEnrollment,
  EnrollmentManagementError,
} from "@/services/enrollment.service";
import {
  enrollmentCancelSchema,
  parentEnrollmentCreateSchema,
} from "@/lib/validators/enrollment";

function readString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function safeReturnPath(value: string | undefined, studentId: string): string {
  const fallback = `/dashboard/parent/children/${studentId}/enrollments`;

  if (value === fallback || value?.startsWith(`${fallback}?`)) {
    return value;
  }

  return fallback;
}

function redirectWithError(path: string, message: string): never {
  const [pathname, queryString] = path.split("?", 2);
  const params = new URLSearchParams(queryString);
  params.set("error", message);

  redirect(`${pathname}?${params.toString()}`);
}

function createErrorMessage(error: unknown): string {
  if (error instanceof EnrollmentManagementError) {
    if (error.code === "DUPLICATE_ENROLLMENT") {
      return "Child already has a pending or active enrollment for this course.";
    }

    if (error.code === "COURSE_FULL") {
      return "Course capacity has been reached.";
    }

    if (error.code === "COURSE_NOT_PUBLISHED") {
      return "Only published courses can accept enrollments.";
    }
  }

  return "Unable to create child enrollment.";
}

function cancelErrorMessage(error: unknown): string {
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

export async function createParentChildEnrollmentAction(
  formData: FormData,
): Promise<void> {
  const parsed = parentEnrollmentCreateSchema.safeParse({
    courseId: readString(formData, "courseId"),
    studentId: readString(formData, "studentId"),
    returnTo: readString(formData, "returnTo"),
  });

  const returnTo = safeReturnPath(
    parsed.success ? parsed.data.returnTo : undefined,
    parsed.success ? parsed.data.studentId : "",
  );

  if (!parsed.success) {
    redirectWithError(
      "/dashboard/parent",
      "Missing course or student information.",
    );
  }

  const user = await requireParent();
  await requirePermission(canViewParentChild(user, parsed.data.studentId));
  await requirePermission(
    canCreateParentChildEnrollment(
      user,
      parsed.data.studentId,
      parsed.data.courseId,
    ),
  );

  try {
    await createParentChildEnrollment(
      user.id,
      parsed.data.studentId,
      parsed.data.courseId,
    );
  } catch (error) {
    redirectWithError(returnTo, createErrorMessage(error));
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function cancelParentChildEnrollmentAction(
  formData: FormData,
): Promise<void> {
  const parsed = enrollmentCancelSchema.safeParse({
    enrollmentId: readString(formData, "enrollmentId"),
    studentId: readString(formData, "studentId"),
    returnTo: readString(formData, "returnTo"),
  });

  if (!parsed.success || !parsed.data.studentId) {
    redirectWithError("/dashboard/parent", "Missing enrollment information.");
  }

  const returnTo = safeReturnPath(parsed.data.returnTo, parsed.data.studentId);
  const user = await requireParent();
  await requirePermission(canViewParentChild(user, parsed.data.studentId));
  await requirePermission(canCancelEnrollment(user, parsed.data.enrollmentId));

  try {
    await cancelParentChildEnrollment(
      user.id,
      parsed.data.studentId,
      parsed.data.enrollmentId,
    );
  } catch (error) {
    redirectWithError(returnTo, cancelErrorMessage(error));
  }

  revalidatePath(returnTo);
  redirect(returnTo);
}
