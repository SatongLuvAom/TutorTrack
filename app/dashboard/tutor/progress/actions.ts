"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission, requireTutor } from "@/lib/guards";
import { canCreateProgressNote } from "@/lib/permissions";
import {
  progressNoteCreateSchema,
  progressReportQuerySchema,
} from "@/lib/validators/progress";
import {
  createProgressNote,
  ProgressNoteManagementError,
} from "@/services/progress-note.service";

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

  return "Unable to save progress note.";
}

function redirectWithError(path: string, message: string): never {
  const [pathname, queryString] = path.split("?", 2);
  const params = new URLSearchParams(queryString);
  params.set("error", message);

  redirect(`${pathname}?${params.toString()}`);
}

function progressNoteErrorMessage(error: unknown): string {
  if (error instanceof ProgressNoteManagementError) {
    if (error.code === "FORBIDDEN") {
      return "You do not have permission to create this progress note.";
    }

    if (error.code === "ACTIVE_ENROLLMENT_REQUIRED") {
      return "Progress notes require an ACTIVE enrollment.";
    }
  }

  return "Unable to save progress note.";
}

export async function createTutorProgressNoteAction(
  formData: FormData,
): Promise<void> {
  const routeParams = progressReportQuerySchema.safeParse({
    studentId: readString(formData, "studentId"),
    courseId: readString(formData, "courseId"),
  });
  const fallback = routeParams.success
    ? `/dashboard/tutor/courses/${routeParams.data.courseId}/students/${routeParams.data.studentId}/progress`
    : "/dashboard/tutor";

  if (!routeParams.success) {
    redirectWithError(fallback, firstValidationMessage(routeParams.error));
  }

  const parsed = progressNoteCreateSchema.safeParse({
    strengths: readString(formData, "strengths"),
    weaknesses: readString(formData, "weaknesses"),
    behaviorNote: readString(formData, "behaviorNote"),
    nextPlan: readString(formData, "nextPlan"),
    parentSummary: readString(formData, "parentSummary"),
  });

  if (!parsed.success) {
    redirectWithError(fallback, firstValidationMessage(parsed.error));
  }

  const user = await requireTutor();
  await requirePermission(
    canCreateProgressNote(
      user,
      routeParams.data.studentId,
      routeParams.data.courseId,
    ),
  );

  try {
    await createProgressNote(
      user.id,
      routeParams.data.studentId,
      routeParams.data.courseId,
      parsed.data,
    );
  } catch (error) {
    redirectWithError(fallback, progressNoteErrorMessage(error));
  }

  revalidatePath(fallback);
  revalidatePath(`/dashboard/tutor/students/${routeParams.data.studentId}/progress`);
  revalidatePath(`/dashboard/student/progress/${routeParams.data.courseId}`);
  revalidatePath(
    `/dashboard/parent/children/${routeParams.data.studentId}/courses/${routeParams.data.courseId}/progress`,
  );
  redirect(`${fallback}?note=created`);
}
