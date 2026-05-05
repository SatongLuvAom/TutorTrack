"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CourseStatus } from "@/lib/generated/prisma/enums";
import { requirePermission, requireTutor } from "@/lib/guards";
import {
  canArchiveCourse,
  canEditCourse,
  canPublishCourse,
} from "@/lib/permissions";
import {
  archiveCourse,
  createCourse,
  publishCourse,
  restoreCourseToDraft,
  updateCourse,
} from "@/services/course.service";
import { courseCreateSchema, courseUpdateSchema } from "@/lib/validators/course";

function readString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function readCourseInput(formData: FormData) {
  return {
    title: readString(formData, "title"),
    description: readString(formData, "description"),
    subjectId: readString(formData, "subjectId"),
    level: readString(formData, "level"),
    courseType: readString(formData, "courseType"),
    price: readString(formData, "price"),
    maxStudents: readString(formData, "maxStudents"),
    totalSessions: readString(formData, "totalSessions"),
  };
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

  return "Unable to save course.";
}

function safeReturnPath(value: string | undefined, fallback: string): string {
  if (
    value === "/dashboard/tutor/courses" ||
    value?.startsWith("/dashboard/tutor/courses?") ||
    value?.startsWith("/dashboard/tutor/courses/")
  ) {
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

export async function createTutorCourseAction(
  formData: FormData,
): Promise<void> {
  const parsed = courseCreateSchema.safeParse(readCourseInput(formData));

  if (!parsed.success) {
    redirectWithError(
      "/dashboard/tutor/courses/new",
      firstValidationMessage(parsed.error),
    );
  }

  const user = await requireTutor();
  let courseId: string;

  try {
    const course = await createCourse(user.id, parsed.data);
    courseId = course.id;
  } catch {
    redirectWithError("/dashboard/tutor/courses/new", "Unable to create course.");
  }

  revalidatePath("/dashboard/tutor/courses");
  redirect(`/dashboard/tutor/courses/${courseId}?created=1`);
}

export async function updateTutorCourseAction(
  formData: FormData,
): Promise<void> {
  const courseId = readString(formData, "courseId");

  if (!courseId) {
    redirectWithError("/dashboard/tutor/courses", "Missing course id.");
  }

  const parsed = courseUpdateSchema.safeParse(readCourseInput(formData));

  if (!parsed.success) {
    redirectWithError(
      `/dashboard/tutor/courses/${courseId}/edit`,
      firstValidationMessage(parsed.error),
    );
  }

  const user = await requireTutor();
  await requirePermission(canEditCourse(user, courseId));

  try {
    await updateCourse(user.id, courseId, parsed.data);
  } catch {
    redirectWithError(
      `/dashboard/tutor/courses/${courseId}/edit`,
      "Unable to update course.",
    );
  }

  revalidatePath("/dashboard/tutor/courses");
  revalidatePath(`/dashboard/tutor/courses/${courseId}`);
  redirect(`/dashboard/tutor/courses/${courseId}?updated=1`);
}

async function updateTutorStatus(
  formData: FormData,
  status: CourseStatus,
): Promise<void> {
  const courseId = readString(formData, "courseId");
  const returnTo = safeReturnPath(
    readString(formData, "returnTo"),
    "/dashboard/tutor/courses",
  );

  if (!courseId) {
    redirectWithError(returnTo, "Missing course id.");
  }

  const user = await requireTutor();

  if (status === CourseStatus.PUBLISHED) {
    await requirePermission(canPublishCourse(user, courseId));
    try {
      await publishCourse(user.id, courseId);
    } catch {
      redirectWithError(returnTo, "Unable to update course status.");
    }
  } else if (status === CourseStatus.ARCHIVED) {
    await requirePermission(canArchiveCourse(user, courseId));
    try {
      await archiveCourse(user.id, courseId);
    } catch {
      redirectWithError(returnTo, "Unable to update course status.");
    }
  } else {
    await requirePermission(canEditCourse(user, courseId));
    try {
      await restoreCourseToDraft(user.id, courseId);
    } catch {
      redirectWithError(returnTo, "Unable to update course status.");
    }
  }

  revalidatePath("/dashboard/tutor/courses");
  revalidatePath(`/dashboard/tutor/courses/${courseId}`);
  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
  redirect(returnTo);
}

export async function publishTutorCourseAction(
  formData: FormData,
): Promise<void> {
  await updateTutorStatus(formData, CourseStatus.PUBLISHED);
}

export async function archiveTutorCourseAction(
  formData: FormData,
): Promise<void> {
  await updateTutorStatus(formData, CourseStatus.ARCHIVED);
}

export async function restoreTutorCourseToDraftAction(
  formData: FormData,
): Promise<void> {
  await updateTutorStatus(formData, CourseStatus.DRAFT);
}
