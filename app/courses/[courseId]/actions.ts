"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission, requireUser } from "@/lib/guards";
import {
  canCreateParentChildEnrollment,
  canCreateStudentEnrollment,
} from "@/lib/permissions";
import {
  createParentChildEnrollment,
  createStudentEnrollment,
  EnrollmentManagementError,
} from "@/services/enrollment.service";
import {
  enrollmentCreateSchema,
  parentEnrollmentCreateSchema,
} from "@/lib/validators/enrollment";

function readString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function safeCourseReturnPath(value: string | undefined, courseId: string): string {
  const fallback = `/courses/${courseId}`;

  if (value === fallback || value?.startsWith(`${fallback}?`)) {
    return value;
  }

  return fallback;
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

  return "Unable to create enrollment.";
}

function errorMessage(error: unknown): string {
  if (error instanceof EnrollmentManagementError) {
    if (error.code === "DUPLICATE_ENROLLMENT") {
      return "มีรายการสมัครคอร์สนี้อยู่แล้ว";
    }

    if (error.code === "COURSE_FULL") {
      return "คอร์สนี้เต็มแล้ว";
    }

    if (error.code === "COURSE_NOT_PUBLISHED") {
      return "คอร์สนี้ยังไม่เปิดรับสมัคร";
    }
  }

  return "Unable to create enrollment.";
}

function redirectWithMessage(
  path: string,
  key: "error" | "enrolled",
  message: string,
): never {
  const [pathname, queryString] = path.split("?", 2);
  const params = new URLSearchParams(queryString);
  params.set(key, message);

  redirect(`${pathname}?${params.toString()}`);
}

export async function createStudentEnrollmentAction(
  formData: FormData,
): Promise<void> {
  const parsed = enrollmentCreateSchema.safeParse({
    courseId: readString(formData, "courseId"),
    returnTo: readString(formData, "returnTo"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      "/courses",
      "error",
      firstValidationMessage(parsed.error),
    );
  }

  const returnTo = safeCourseReturnPath(parsed.data.returnTo, parsed.data.courseId);
  const user = await requireUser();
  await requirePermission(canCreateStudentEnrollment(user, parsed.data.courseId));

  try {
    await createStudentEnrollment(user.id, parsed.data.courseId);
  } catch (error) {
    redirectWithMessage(returnTo, "error", errorMessage(error));
  }

  revalidatePath(returnTo);
  revalidatePath("/dashboard/student/enrollments");
  redirectWithMessage(returnTo, "enrolled", "pending");
}

export async function createParentEnrollmentAction(
  formData: FormData,
): Promise<void> {
  const parsed = parentEnrollmentCreateSchema.safeParse({
    courseId: readString(formData, "courseId"),
    studentId: readString(formData, "studentId"),
    returnTo: readString(formData, "returnTo"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      "/courses",
      "error",
      firstValidationMessage(parsed.error),
    );
  }

  const returnTo = safeCourseReturnPath(parsed.data.returnTo, parsed.data.courseId);
  const user = await requireUser();
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
    redirectWithMessage(returnTo, "error", errorMessage(error));
  }

  revalidatePath(returnTo);
  revalidatePath(
    `/dashboard/parent/children/${parsed.data.studentId}/enrollments`,
  );
  redirectWithMessage(returnTo, "enrolled", "pending");
}
