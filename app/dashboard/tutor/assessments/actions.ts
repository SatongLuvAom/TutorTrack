"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission, requireTutor } from "@/lib/guards";
import {
  canCreateAssessment,
  canEditAssessment,
  canRecordAssessmentScore,
} from "@/lib/permissions";
import {
  AssessmentManagementError,
  bulkRecordAssessmentScores,
  createAssessment,
  updateAssessment,
} from "@/services/assessment.service";
import {
  assessmentCreateSchema,
  assessmentUpdateSchema,
  bulkAssessmentScoreSchema,
} from "@/lib/validators/assessment";

function readString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function readAssessmentInput(formData: FormData) {
  return {
    title: readString(formData, "title"),
    type: readString(formData, "type"),
    maxScore: readString(formData, "maxScore"),
    takenAt: readString(formData, "takenAt"),
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

  return "Unable to save assessment.";
}

function redirectWithError(path: string, message: string): never {
  const [pathname, queryString] = path.split("?", 2);
  const params = new URLSearchParams(queryString);
  params.set("error", message);

  redirect(`${pathname}?${params.toString()}`);
}

function assessmentErrorMessage(error: unknown): string {
  if (error instanceof AssessmentManagementError) {
    if (error.code === "FORBIDDEN") {
      return "You do not have permission to manage this assessment.";
    }

    if (error.code === "ACTIVE_ENROLLMENT_REQUIRED") {
      return "Assessment scoring requires ACTIVE enrolled students.";
    }

    if (error.code === "DUPLICATE_ASSESSMENT") {
      return "An assessment with the same title, type, date, and max score already exists.";
    }

    if (error.code === "SCORE_EXCEEDS_MAX_SCORE") {
      return "Score cannot exceed assessment max score.";
    }
  }

  return "Unable to save assessment.";
}

export async function createTutorAssessmentAction(
  formData: FormData,
): Promise<void> {
  const courseId = readString(formData, "courseId");
  const fallback = courseId
    ? `/dashboard/tutor/courses/${courseId}/assessments/new`
    : "/dashboard/tutor/assessments";

  if (!courseId) {
    redirectWithError(fallback, "Missing course id.");
  }

  const parsed = assessmentCreateSchema.safeParse(readAssessmentInput(formData));

  if (!parsed.success) {
    redirectWithError(fallback, firstValidationMessage(parsed.error));
  }

  const user = await requireTutor();
  await requirePermission(canCreateAssessment(user, courseId));
  let assessmentId: string;

  try {
    assessmentId = await createAssessment(user.id, courseId, parsed.data);
  } catch (error) {
    redirectWithError(fallback, assessmentErrorMessage(error));
  }

  revalidatePath("/dashboard/tutor/assessments");
  revalidatePath(`/dashboard/tutor/courses/${courseId}/assessments`);
  redirect(`/dashboard/tutor/assessments/${assessmentId}?created=1`);
}

export async function updateTutorAssessmentAction(
  formData: FormData,
): Promise<void> {
  const assessmentId = readString(formData, "assessmentId");
  const courseId = readString(formData, "courseId");
  const fallback = assessmentId
    ? `/dashboard/tutor/assessments/${assessmentId}/edit`
    : "/dashboard/tutor/assessments";

  if (!assessmentId) {
    redirectWithError(fallback, "Missing assessment id.");
  }

  const parsed = assessmentUpdateSchema.safeParse(readAssessmentInput(formData));

  if (!parsed.success) {
    redirectWithError(fallback, firstValidationMessage(parsed.error));
  }

  const user = await requireTutor();
  await requirePermission(canEditAssessment(user, assessmentId));

  try {
    await updateAssessment(user.id, assessmentId, parsed.data);
  } catch (error) {
    redirectWithError(fallback, assessmentErrorMessage(error));
  }

  revalidatePath("/dashboard/tutor/assessments");
  revalidatePath(`/dashboard/tutor/assessments/${assessmentId}`);
  if (courseId) {
    revalidatePath(`/dashboard/tutor/courses/${courseId}/assessments`);
  }
  redirect(`/dashboard/tutor/assessments/${assessmentId}?updated=1`);
}

export async function bulkRecordTutorAssessmentScoresAction(
  formData: FormData,
): Promise<void> {
  const assessmentId = readString(formData, "assessmentId");
  const fallback = assessmentId
    ? `/dashboard/tutor/assessments/${assessmentId}`
    : "/dashboard/tutor/assessments";
  const studentIds = formData
    .getAll("studentId")
    .filter((value): value is string => typeof value === "string");

  const parsed = bulkAssessmentScoreSchema.safeParse({
    assessmentId,
    scores: studentIds.map((studentId) => ({
      studentId,
      score: readString(formData, `score:${studentId}`),
      note: readString(formData, `note:${studentId}`),
    })),
  });

  if (!parsed.success) {
    redirectWithError(fallback, firstValidationMessage(parsed.error));
  }

  const user = await requireTutor();
  await requirePermission(
    canRecordAssessmentScore(user, parsed.data.assessmentId),
  );

  try {
    await bulkRecordAssessmentScores(user.id, parsed.data.assessmentId, {
      scores: parsed.data.scores,
    });
  } catch (error) {
    redirectWithError(fallback, assessmentErrorMessage(error));
  }

  revalidatePath("/dashboard/tutor/assessments");
  revalidatePath(fallback);
  redirect(`${fallback}?scores=1`);
}
