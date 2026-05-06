"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission, requireTutor } from "@/lib/guards";
import { canCreateAssignment, canEditAssignment } from "@/lib/permissions";
import {
  AssignmentManagementError,
  createAssignment,
  updateAssignment,
} from "@/services/assignment.service";
import {
  assignmentCreateSchema,
  assignmentUpdateSchema,
} from "@/lib/validators/assignment";

function readString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function readAssignmentInput(formData: FormData) {
  return {
    title: readString(formData, "title"),
    description: readString(formData, "description"),
    dueDate: readString(formData, "dueDate"),
    maxScore: readString(formData, "maxScore"),
    sessionId: readString(formData, "sessionId"),
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

  return "Unable to save assignment.";
}

function redirectWithError(path: string, message: string): never {
  const [pathname, queryString] = path.split("?", 2);
  const params = new URLSearchParams(queryString);
  params.set("error", message);

  redirect(`${pathname}?${params.toString()}`);
}

function assignmentErrorMessage(error: unknown): string {
  if (error instanceof AssignmentManagementError) {
    if (error.code === "FORBIDDEN") {
      return "You do not have permission to manage this assignment.";
    }

    if (error.code === "SESSION_LINK_UNSUPPORTED") {
      return "This database schema does not support session-linked assignments yet.";
    }
  }

  return "Unable to save assignment.";
}

export async function createTutorAssignmentAction(
  formData: FormData,
): Promise<void> {
  const courseId = readString(formData, "courseId");
  const fallback = courseId
    ? `/dashboard/tutor/courses/${courseId}/assignments/new`
    : "/dashboard/tutor/assignments";

  if (!courseId) {
    redirectWithError(fallback, "Missing course id.");
  }

  const parsed = assignmentCreateSchema.safeParse(readAssignmentInput(formData));

  if (!parsed.success) {
    redirectWithError(fallback, firstValidationMessage(parsed.error));
  }

  const user = await requireTutor();
  await requirePermission(canCreateAssignment(user, courseId));
  let assignmentId: string;

  try {
    const assignment = await createAssignment(user.id, courseId, parsed.data);
    assignmentId = assignment.id;
  } catch (error) {
    redirectWithError(fallback, assignmentErrorMessage(error));
  }

  revalidatePath("/dashboard/tutor/assignments");
  revalidatePath(`/dashboard/tutor/courses/${courseId}/assignments`);
  revalidatePath(`/dashboard/tutor/courses/${courseId}`);
  redirect(`/dashboard/tutor/assignments/${assignmentId}?created=1`);
}

export async function updateTutorAssignmentAction(
  formData: FormData,
): Promise<void> {
  const assignmentId = readString(formData, "assignmentId");
  const courseId = readString(formData, "courseId");
  const fallback = assignmentId
    ? `/dashboard/tutor/assignments/${assignmentId}/edit`
    : "/dashboard/tutor/assignments";

  if (!assignmentId) {
    redirectWithError(fallback, "Missing assignment id.");
  }

  const parsed = assignmentUpdateSchema.safeParse(readAssignmentInput(formData));

  if (!parsed.success) {
    redirectWithError(fallback, firstValidationMessage(parsed.error));
  }

  const user = await requireTutor();
  await requirePermission(canEditAssignment(user, assignmentId));

  try {
    await updateAssignment(user.id, assignmentId, parsed.data);
  } catch (error) {
    redirectWithError(fallback, assignmentErrorMessage(error));
  }

  revalidatePath("/dashboard/tutor/assignments");
  revalidatePath(`/dashboard/tutor/assignments/${assignmentId}`);
  if (courseId) {
    revalidatePath(`/dashboard/tutor/courses/${courseId}/assignments`);
  }
  redirect(`/dashboard/tutor/assignments/${assignmentId}?updated=1`);
}
