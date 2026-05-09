import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProgressReportEmptyState } from "@/components/progress/progress-report-empty-state";
import { ProgressReportTable } from "@/components/progress/progress-report-table";
import { Button } from "@/components/ui/button";
import { requireStudent } from "@/lib/guards";
import { getStudentProgressOverview } from "@/services/progress.service";

export const dynamic = "force-dynamic";

export default async function StudentProgressPage() {
  const user = await requireStudent();
  const reports = await getStudentProgressOverview(user.id);

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
          <h1 className="tt-heading mt-2 text-3xl">My progress reports</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            Progress summaries are calculated from your ACTIVE courses only.
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
        {reports.length === 0 ? (
          <ProgressReportEmptyState
            actionHref="/courses"
            actionLabel="Browse courses"
            description="Progress reports appear after you have an ACTIVE enrollment with learning records."
            title="No progress reports yet"
          />
        ) : (
          <ProgressReportTable
            getDetailHref={(row) => `/dashboard/student/progress/${row.courseId}`}
            rows={reports}
          />
        )}
      </section>
    </main>
  );
}
