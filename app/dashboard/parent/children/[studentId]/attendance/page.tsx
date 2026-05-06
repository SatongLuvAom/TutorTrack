import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttendanceSummaryCards } from "@/components/attendance/attendance-summary-cards";
import { AttendanceTable } from "@/components/attendance/attendance-table";
import { CourseEmptyState } from "@/components/courses/course-empty-state";
import { requireParent, requirePermission } from "@/lib/guards";
import { canViewStudentAttendance } from "@/lib/permissions";
import { getParentChildSummary } from "@/services/enrollment.service";
import {
  getAttendanceSummaryForStudent,
  getParentChildAttendance,
} from "@/services/attendance.service";

export const dynamic = "force-dynamic";

type ParentChildAttendancePageProps = {
  params: Promise<{ studentId: string }>;
};

export default async function ParentChildAttendancePage({
  params,
}: ParentChildAttendancePageProps) {
  const user = await requireParent();
  const { studentId } = await params;
  await requirePermission(canViewStudentAttendance(user, studentId));
  const [child, records, summary] = await Promise.all([
    getParentChildSummary(user.id, studentId),
    getParentChildAttendance(user.id, studentId),
    getAttendanceSummaryForStudent(studentId),
  ]);

  if (!child) {
    notFound();
  }

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/parent">
              <ArrowLeft aria-hidden="true" />
              Parent dashboard
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Parent dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">
            Attendance for {child.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Attendance history is visible only for active linked children.
          </p>
        </div>
      </section>

      <section className="tt-shell space-y-6 py-8">
        <AttendanceSummaryCards summary={summary} />
        {records.length === 0 ? (
          <CourseEmptyState
            actionHref={`/dashboard/parent/children/${studentId}/schedule`}
            actionLabel="Open schedule"
            description="Marked attendance records for this child will appear here."
            title="No attendance records"
          />
        ) : (
          <AttendanceTable records={records} showStudent={false} />
        )}
      </section>
    </main>
  );
}
