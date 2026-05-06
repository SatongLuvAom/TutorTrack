import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttendanceSummaryCards } from "@/components/attendance/attendance-summary-cards";
import { AttendanceTable } from "@/components/attendance/attendance-table";
import { CourseEmptyState } from "@/components/courses/course-empty-state";
import { requireStudent } from "@/lib/guards";
import {
  getAttendanceSummaryForStudent,
  getStudentAttendance,
} from "@/services/attendance.service";

export const dynamic = "force-dynamic";

export default async function StudentAttendancePage() {
  const user = await requireStudent();
  const [records, summary] = await Promise.all([
    getStudentAttendance(user.id),
    user.studentProfileId
      ? getAttendanceSummaryForStudent(user.studentProfileId)
      : Promise.resolve({
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          attendanceRate: 0,
        }),
  ]);

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/student">
              <ArrowLeft aria-hidden="true" />
              Dashboard
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Student dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">My attendance</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Attendance history is visible only to the student, linked parents,
            tutors for owned courses, and admins.
          </p>
        </div>
      </section>

      <section className="tt-shell space-y-6 py-8">
        <AttendanceSummaryCards summary={summary} />
        {records.length === 0 ? (
          <CourseEmptyState
            actionHref="/dashboard/student/schedule"
            actionLabel="Open schedule"
            description="Marked attendance records will appear after tutors save attendance."
            title="No attendance records"
          />
        ) : (
          <AttendanceTable records={records} showStudent={false} />
        )}
      </section>
    </main>
  );
}
