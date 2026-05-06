"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission, requireTutor } from "@/lib/guards";
import { canGradeSubmission } from "@/lib/permissions";
import {
  SubmissionManagementError,
  gradeSubmission,
} from "@/services/submission.service";
import { submissionGradeSchema } from "@/lib/validators/submission";

function readString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function safeReturnPath(value: string | undefined): string {
  if (
    value === "/dashboard/tutor/assignments" ||
    value?.startsWith("/dashboard/tutor/assignments?") ||
    value?.startsWith("/dashboard/tutor/assignments/") ||
    value?.startsWith("/dashboard/tutor/submissions/")
  ) {
    return value;
  }

  return "/dashboard/tutor/assignments";
}

function redirectWithError(path: string, message: string): never {
  const [pathname, queryString] = path.split("?", 2);
  const params = new URLSearchParams(queryString);
  params.set("error", message);

  redirect(`${pathname}?${params.toString()}`);
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

  return "Unable to grade submission.";
}

function gradeErrorMessage(error: unknown): string {
  if (error instanceof SubmissionManagementError) {
    if (error.code === "SCORE_EXCEEDS_MAX_SCORE") {
      return "Score cannot exceed assignment max score.";
    }

    if (error.code === "FORBIDDEN") {
      return "You do not have permission to grade this submission.";
    }
  }

  return "Unable to grade submission.";
}

export async function gradeTutorSubmissionAction(
  formData: FormData,
): Promise<void> {
  const returnTo = safeReturnPath(readString(formData, "returnTo"));
  const parsed = submissionGradeSchema.safeParse({
    submissionId: readString(formData, "submissionId"),
    score: readString(formData, "score"),
    feedback: readString(formData, "feedback"),
  });

  if (!parsed.success) {
    redirectWithError(returnTo, firstValidationMessage(parsed.error));
  }

  const user = await requireTutor();
  await requirePermission(canGradeSubmission(user, parsed.data.submissionId));

  try {
    await gradeSubmission(user.id, parsed.data.submissionId, parsed.data);
  } catch (error) {
    redirectWithError(returnTo, gradeErrorMessage(error));
  }

  revalidatePath("/dashboard/tutor/assignments");
  revalidatePath(returnTo);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}graded=1`);
}
