import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/lib/generated/prisma/enums";
import { getCurrentUser, type CurrentUser } from "@/lib/current-user";
import {
  canCreateProgressNote,
  canViewProgressReport,
} from "@/lib/permissions";
import { isSameOriginRequest } from "@/lib/request-security";
import {
  progressNoteCreateSchema,
  progressNoteFilterSchema,
  progressReportQuerySchema,
} from "@/lib/validators/progress";
import {
  createProgressNote,
  getParentChildProgressNotes,
  getProgressNotes,
  getStudentProgressNotes,
  getTutorProgressNotes,
  ProgressNoteManagementError,
  type ProgressNoteSummary,
} from "@/services/progress-note.service";

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJsonRecord(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return isRecord(body) ? body : null;
  } catch {
    return null;
  }
}

async function getNotesForUser(
  user: CurrentUser,
  studentId: string,
  courseId: string,
): Promise<ProgressNoteSummary[]> {
  if (user.role === UserRole.ADMIN) {
    return getProgressNotes(studentId, courseId);
  }

  if (user.role === UserRole.TUTOR) {
    return getTutorProgressNotes(user.id, studentId, courseId);
  }

  if (user.role === UserRole.STUDENT) {
    return getStudentProgressNotes(user.id, courseId);
  }

  return getParentChildProgressNotes(user.id, studentId, courseId);
}

function progressNoteErrorMessage(error: unknown): string {
  if (error instanceof ProgressNoteManagementError) {
    if (error.code === "FORBIDDEN") {
      return "Forbidden.";
    }

    if (error.code === "ACTIVE_ENROLLMENT_REQUIRED") {
      return "Progress notes require an ACTIVE enrollment.";
    }
  }

  return "Unable to save progress note.";
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Authentication required.", 401);
  }

  const parsed = progressNoteFilterSchema.safeParse({
    studentId: request.nextUrl.searchParams.get("studentId"),
    courseId: request.nextUrl.searchParams.get("courseId"),
  });

  if (!parsed.success) {
    return jsonError("Invalid progress note query.", 400);
  }

  if (
    !(await canViewProgressReport(
      user,
      parsed.data.studentId,
      parsed.data.courseId,
    ))
  ) {
    return jsonError("Forbidden.", 403);
  }

  const notes = await getNotesForUser(
    user,
    parsed.data.studentId,
    parsed.data.courseId,
  );

  return NextResponse.json({ data: notes });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Authentication required.", 401);
  }

  const body = await readJsonRecord(request);

  if (!body) {
    return jsonError("Invalid JSON body.", 400);
  }

  const ids = progressReportQuerySchema.safeParse({
    studentId: body.studentId,
    courseId: body.courseId,
  });
  const note = progressNoteCreateSchema.safeParse(body);

  if (!ids.success || !note.success) {
    return jsonError("Invalid progress note input.", 400);
  }

  if (
    !(await canCreateProgressNote(
      user,
      ids.data.studentId,
      ids.data.courseId,
    ))
  ) {
    return jsonError("Forbidden.", 403);
  }

  try {
    const created = await createProgressNote(
      user.id,
      ids.data.studentId,
      ids.data.courseId,
      note.data,
    );

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const status =
      error instanceof ProgressNoteManagementError &&
      error.code === "FORBIDDEN"
        ? 403
        : 400;

    return jsonError(progressNoteErrorMessage(error), status);
  }
}
