"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission, requireTutor } from "@/lib/guards";
import { canManageSkillProgress } from "@/lib/permissions";
import {
  SkillProgressManagementError,
  bulkUpdateStudentSkillProgress,
} from "@/services/skill-progress.service";
import { bulkSkillProgressUpdateSchema } from "@/lib/validators/skill-progress";

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

  return "Unable to save skill progress.";
}

function redirectWithError(path: string, message: string): never {
  const [pathname, queryString] = path.split("?", 2);
  const params = new URLSearchParams(queryString);
  params.set("error", message);

  redirect(`${pathname}?${params.toString()}`);
}

function skillProgressErrorMessage(error: unknown): string {
  if (error instanceof SkillProgressManagementError) {
    if (error.code === "FORBIDDEN") {
      return "You do not have permission to update this skill progress.";
    }

    if (error.code === "ACTIVE_ENROLLMENT_REQUIRED") {
      return "Skill progress can be updated only for ACTIVE enrolled students.";
    }

    if (error.code === "SKILL_COURSE_MISMATCH") {
      return "Skill does not belong to this course.";
    }
  }

  return "Unable to save skill progress.";
}

export async function bulkUpdateTutorSkillProgressAction(
  formData: FormData,
): Promise<void> {
  const courseId = readString(formData, "courseId");
  const fallback = courseId
    ? `/dashboard/tutor/courses/${courseId}/skills`
    : "/dashboard/tutor/courses";
  const keys = formData
    .getAll("recordKey")
    .filter((value): value is string => typeof value === "string");

  const parsed = bulkSkillProgressUpdateSchema.safeParse({
    courseId,
    records: keys.map((key) => ({
      studentId: readString(formData, `studentId:${key}`),
      skillId: readString(formData, `skillId:${key}`),
      level: readString(formData, `level:${key}`),
      note: readString(formData, `note:${key}`),
    })),
  });

  if (!parsed.success) {
    redirectWithError(fallback, firstValidationMessage(parsed.error));
  }

  const user = await requireTutor();
  await requirePermission(canManageSkillProgress(user, parsed.data.courseId));

  try {
    await bulkUpdateStudentSkillProgress(user.id, parsed.data.courseId, {
      records: parsed.data.records,
    });
  } catch (error) {
    redirectWithError(fallback, skillProgressErrorMessage(error));
  }

  revalidatePath(`/dashboard/tutor/courses/${parsed.data.courseId}/skills`);
  revalidatePath("/dashboard/tutor/assessments");
  redirect(`${fallback}?saved=1`);
}
