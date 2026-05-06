"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission, requireTutor } from "@/lib/guards";
import {
  canCancelSession,
  canCompleteSession,
  canCreateSession,
  canEditSession,
  canMarkAttendance,
} from "@/lib/permissions";
import {
  SessionManagementError,
  cancelSession,
  completeSession,
  createSession,
  updateSession,
} from "@/services/session.service";
import {
  AttendanceManagementError,
  bulkMarkAttendance,
} from "@/services/attendance.service";
import {
  sessionCreateSchema,
  sessionUpdateSchema,
} from "@/lib/validators/session";
import { bulkAttendanceMarkSchema } from "@/lib/validators/attendance";

function readString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function readSessionInput(formData: FormData) {
  return {
    courseId: readString(formData, "courseId"),
    title: readString(formData, "title"),
    description: readString(formData, "description"),
    scheduledStart: readString(formData, "scheduledStart"),
    scheduledEnd: readString(formData, "scheduledEnd"),
    meetingLink: readString(formData, "meetingLink"),
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

  return "Unable to save session.";
}

function safeReturnPath(value: string | undefined, fallback: string): string {
  if (
    value === "/dashboard/tutor/sessions" ||
    value?.startsWith("/dashboard/tutor/sessions?") ||
    value?.startsWith("/dashboard/tutor/sessions/") ||
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

function sessionErrorMessage(error: unknown): string {
  if (error instanceof SessionManagementError) {
    if (error.code === "COURSE_NOT_PUBLISHED") {
      return "Sessions can be created only for published courses.";
    }

    if (error.code === "ONLY_SCHEDULED_CAN_BE_EDITED") {
      return "Only scheduled sessions can be edited.";
    }

    if (error.code === "INVALID_STATUS_TRANSITION") {
      return "Invalid session status transition.";
    }

    if (error.code === "FORBIDDEN") {
      return "You do not have permission to manage this session.";
    }
  }

  return "Unable to update session.";
}

function attendanceErrorMessage(error: unknown): string {
  if (error instanceof AttendanceManagementError) {
    if (error.code === "ACTIVE_ENROLLMENT_REQUIRED") {
      return "Attendance can be marked only for ACTIVE enrolled students.";
    }

    if (error.code === "SESSION_CANCELLED") {
      return "Attendance cannot be marked for a cancelled session.";
    }
  }

  return "Unable to save attendance.";
}

export async function createTutorSessionAction(
  formData: FormData,
): Promise<void> {
  const parsed = sessionCreateSchema.safeParse(readSessionInput(formData));
  const fallbackCourseId = readString(formData, "courseId");
  const fallback = fallbackCourseId
    ? `/dashboard/tutor/courses/${fallbackCourseId}/sessions/new`
    : "/dashboard/tutor/sessions";

  if (!parsed.success) {
    redirectWithError(fallback, firstValidationMessage(parsed.error));
  }

  const user = await requireTutor();
  await requirePermission(canCreateSession(user, parsed.data.courseId));
  let sessionId: string;

  try {
    const session = await createSession(user.id, parsed.data);
    sessionId = session.id;
  } catch (error) {
    redirectWithError(fallback, sessionErrorMessage(error));
  }

  revalidatePath("/dashboard/tutor/sessions");
  revalidatePath(`/dashboard/tutor/courses/${parsed.data.courseId}/sessions`);
  redirect(`/dashboard/tutor/sessions/${sessionId}?created=1`);
}

export async function updateTutorSessionAction(
  formData: FormData,
): Promise<void> {
  const sessionId = readString(formData, "sessionId");

  if (!sessionId) {
    redirectWithError("/dashboard/tutor/sessions", "Missing session id.");
  }

  const parsed = sessionUpdateSchema.safeParse(readSessionInput(formData));
  const fallback = `/dashboard/tutor/sessions/${sessionId}/edit`;

  if (!parsed.success) {
    redirectWithError(fallback, firstValidationMessage(parsed.error));
  }

  const user = await requireTutor();
  await requirePermission(canEditSession(user, sessionId));

  try {
    await updateSession(user.id, sessionId, parsed.data);
  } catch (error) {
    redirectWithError(fallback, sessionErrorMessage(error));
  }

  revalidatePath("/dashboard/tutor/sessions");
  revalidatePath(`/dashboard/tutor/sessions/${sessionId}`);
  redirect(`/dashboard/tutor/sessions/${sessionId}?updated=1`);
}

async function updateTutorSessionStatus(
  formData: FormData,
  intent: "cancel" | "complete",
): Promise<void> {
  const sessionId = readString(formData, "sessionId");
  const returnTo = safeReturnPath(
    readString(formData, "returnTo"),
    "/dashboard/tutor/sessions",
  );

  if (!sessionId) {
    redirectWithError(returnTo, "Missing session id.");
  }

  const user = await requireTutor();
  if (intent === "cancel") {
    await requirePermission(canCancelSession(user, sessionId));
  } else {
    await requirePermission(canCompleteSession(user, sessionId));
  }

  try {
    if (intent === "cancel") {
      await cancelSession(user.id, sessionId);
    } else {
      await completeSession(user.id, sessionId);
    }
  } catch (error) {
    redirectWithError(returnTo, sessionErrorMessage(error));
  }

  revalidatePath("/dashboard/tutor/sessions");
  revalidatePath(`/dashboard/tutor/sessions/${sessionId}`);
  redirect(returnTo);
}

export async function cancelTutorSessionAction(
  formData: FormData,
): Promise<void> {
  await updateTutorSessionStatus(formData, "cancel");
}

export async function completeTutorSessionAction(
  formData: FormData,
): Promise<void> {
  await updateTutorSessionStatus(formData, "complete");
}

export async function bulkMarkAttendanceAction(
  formData: FormData,
): Promise<void> {
  const sessionId = readString(formData, "sessionId");
  const returnTo = safeReturnPath(
    readString(formData, "returnTo"),
    sessionId ? `/dashboard/tutor/sessions/${sessionId}` : "/dashboard/tutor/sessions",
  );
  const studentIds = formData
    .getAll("studentId")
    .filter((value): value is string => typeof value === "string");

  const parsed = bulkAttendanceMarkSchema.safeParse({
    sessionId,
    returnTo,
    records: studentIds.map((studentId) => ({
      studentId,
      status: readString(formData, `status:${studentId}`),
      note: readString(formData, `note:${studentId}`),
    })),
  });

  if (!parsed.success) {
    redirectWithError(returnTo, firstValidationMessage(parsed.error));
  }

  const user = await requireTutor();
  await requirePermission(canMarkAttendance(user, parsed.data.sessionId));

  try {
    await bulkMarkAttendance(parsed.data);
  } catch (error) {
    redirectWithError(returnTo, attendanceErrorMessage(error));
  }

  revalidatePath(`/dashboard/tutor/sessions/${parsed.data.sessionId}`);
  revalidatePath("/dashboard/tutor/sessions");
  revalidatePath("/dashboard/student/attendance");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}attendance=1`);
}
