"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission, requireStudent } from "@/lib/guards";
import { canEditSubmission, canSubmitAssignment } from "@/lib/permissions";
import {
  SubmissionManagementError,
  submitAssignment,
  updateSubmission,
} from "@/services/submission.service";
import {
  submissionCreateSchema,
  submissionUpdateSchema,
} from "@/lib/validators/submission";

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

  return "Unable to submit assignment.";
}

function safeReturnPath(value: string | undefined): string {
  if (
    value === "/dashboard/student/assignments" ||
    value?.startsWith("/dashboard/student/assignments?") ||
    value?.startsWith("/dashboard/student/assignments/")
  ) {
    return value;
  }

  return "/dashboard/student/assignments";
}

function redirectWithError(path: string, message: string): never {
  const [pathname, queryString] = path.split("?", 2);
  const params = new URLSearchParams(queryString);
  params.set("error", message);

  redirect(`${pathname}?${params.toString()}`);
}

function submissionErrorMessage(error: unknown): string {
  if (error instanceof SubmissionManagementError) {
    if (error.code === "SUBMISSION_ALREADY_GRADED") {
      return "Graded submissions cannot be modified.";
    }

    if (error.code === "ACTIVE_ENROLLMENT_REQUIRED") {
      return "You can submit only for ACTIVE enrolled courses.";
    }

    if (error.code === "FORBIDDEN") {
      return "You do not have permission to edit this submission.";
    }
  }

  return "Unable to submit assignment.";
}

export async function submitStudentAssignmentAction(
  formData: FormData,
): Promise<void> {
  const assignmentId = readString(formData, "assignmentId");
  const submissionId = readString(formData, "submissionId");
  const returnTo = safeReturnPath(readString(formData, "returnTo"));
  const contentInput = {
    textAnswer: readString(formData, "textAnswer"),
    fileUrl: readString(formData, "fileUrl"),
  };

  if (submissionId) {
    const parsed = submissionUpdateSchema.safeParse({
      submissionId,
      ...contentInput,
    });

    if (!parsed.success) {
      redirectWithError(returnTo, firstValidationMessage(parsed.error));
    }

    const user = await requireStudent();
    await requirePermission(canEditSubmission(user, submissionId));

    try {
      await updateSubmission(user.id, submissionId, parsed.data);
    } catch (error) {
      redirectWithError(returnTo, submissionErrorMessage(error));
    }

    revalidatePath("/dashboard/student/assignments");
    revalidatePath(`/dashboard/student/assignments/${assignmentId}`);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}submitted=1`);
  }

  const parsed = submissionCreateSchema.safeParse({
    assignmentId,
    ...contentInput,
  });

  if (!parsed.success) {
    redirectWithError(returnTo, firstValidationMessage(parsed.error));
  }

  const user = await requireStudent();
  await requirePermission(canSubmitAssignment(user, parsed.data.assignmentId));

  try {
    await submitAssignment(user.id, parsed.data.assignmentId, parsed.data);
  } catch (error) {
    redirectWithError(returnTo, submissionErrorMessage(error));
  }

  revalidatePath("/dashboard/student/assignments");
  revalidatePath(`/dashboard/student/assignments/${assignmentId}`);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}submitted=1`);
}
