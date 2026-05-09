import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProgressReportEmptyState } from "@/components/progress/progress-report-empty-state";
import { ProgressReportTable } from "@/components/progress/progress-report-table";
import { Button } from "@/components/ui/button";
import { requirePermission, requireTutor } from "@/lib/guards";
import { canViewStudentProgress } from "@/lib/permissions";
import { getTutorStudentProgressOverview } from "@/services/progress.service";

export const dynamic = "force-dynamic";

type TutorStudentProgressPageProps = {
  params: Promise<{ studentId: string }>;
};

export default async function TutorStudentProgressPage({
  params,
}: TutorStudentProgressPageProps) {
  const user = await requireTutor();
  const { studentId } = await params;
  await requirePermission(canViewStudentProgress(user, studentId));
  const reports = await getTutorStudentProgressOverview(user.id, studentId);

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/tutor">
              <ArrowLeft aria-hidden="true" />
              Dashboard
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Tutor dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">Student progress</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            Tutors can view progress only for ACTIVE enrolled students in their
            own courses.
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
        {reports.length === 0 ? (
          <ProgressReportEmptyState
            description="No ACTIVE course progress is available for this student in your courses."
            title="No progress reports found"
          />
        ) : (
          <ProgressReportTable
            getDetailHref={(row) =>
              `/dashboard/tutor/courses/${row.courseId}/students/${row.studentId}/progress`
            }
            rows={reports}
            showTutor={false}
          />
        )}
      </section>
    </main>
  );
}
