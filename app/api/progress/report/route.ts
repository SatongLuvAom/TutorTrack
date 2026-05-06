import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { canViewProgressReport } from "@/lib/permissions";
import { progressReportQuerySchema } from "@/lib/validators/progress";
import {
  calculateProgressReport,
  ProgressReportError,
} from "@/services/progress.service";

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Authentication required.", 401);
  }

  const parsed = progressReportQuerySchema.safeParse({
    studentId: request.nextUrl.searchParams.get("studentId"),
    courseId: request.nextUrl.searchParams.get("courseId"),
  });

  if (!parsed.success) {
    return jsonError("Invalid progress report query.", 400);
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

  try {
    const report = await calculateProgressReport(
      parsed.data.studentId,
      parsed.data.courseId,
    );

    if (!report) {
      return jsonError("Progress report not found.", 404);
    }

    return NextResponse.json({ data: report });
  } catch (error) {
    if (error instanceof ProgressReportError && error.code === "FORBIDDEN") {
      return jsonError("Forbidden.", 403);
    }

    return jsonError("Unable to calculate progress report.", 500);
  }
}
