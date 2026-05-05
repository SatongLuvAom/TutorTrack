"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CourseStatus } from "@/lib/generated/prisma/enums";
import { requireAdmin, requirePermission } from "@/lib/guards";
import { canManageAnyCourse } from "@/lib/permissions";
import { adminUpdateCourseStatus } from "@/services/course.service";

function readString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function safeReturnPath(value: string | undefined): string {
  if (
    value === "/dashboard/admin/courses" ||
    value?.startsWith("/dashboard/admin/courses?") ||
    value?.startsWith("/dashboard/admin/courses/")
  ) {
    return value;
  }

  return "/dashboard/admin/courses";
}

function redirectWithError(path: string, message: string): never {
  const [pathname, queryString] = path.split("?", 2);
  const params = new URLSearchParams(queryString);
  params.set("error", message);

  redirect(`${pathname}?${params.toString()}`);
}

async function updateAdminStatus(
  formData: FormData,
  status: CourseStatus,
): Promise<void> {
  const courseId = readString(formData, "courseId");
  const returnTo = safeReturnPath(readString(formData, "returnTo"));

  if (!courseId) {
    redirectWithError(returnTo, "Missing course id.");
  }

  const user = await requireAdmin();
  await requirePermission(canManageAnyCourse(user));

  try {
    await adminUpdateCourseStatus(courseId, status);
  } catch {
    redirectWithError(returnTo, "Unable to update course status.");
  }

  revalidatePath("/dashboard/admin/courses");
  revalidatePath(`/dashboard/admin/courses/${courseId}`);
  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
  redirect(returnTo);
}

export async function publishAdminCourseAction(
  formData: FormData,
): Promise<void> {
  await updateAdminStatus(formData, CourseStatus.PUBLISHED);
}

export async function archiveAdminCourseAction(
  formData: FormData,
): Promise<void> {
  await updateAdminStatus(formData, CourseStatus.ARCHIVED);
}

export async function restoreAdminCourseToDraftAction(
  formData: FormData,
): Promise<void> {
  await updateAdminStatus(formData, CourseStatus.DRAFT);
}
