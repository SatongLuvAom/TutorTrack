import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProgressReportEmptyState } from "@/components/progress/progress-report-empty-state";
import { ProgressReportTable } from "@/components/progress/progress-report-table";
import { Button } from "@/components/ui/button";
import { requireParent, requirePermission } from "@/lib/guards";
import { canViewParentChild } from "@/lib/permissions";
import { getParentChildProgressOverview } from "@/services/progress.service";

export const dynamic = "force-dynamic";

type ParentChildProgressPageProps = {
  params: Promise<{ studentId: string }>;
};

export default async function ParentChildProgressPage({
  params,
}: ParentChildProgressPageProps) {
  const user = await requireParent();
  const { studentId } = await params;
  await requirePermission(canViewParentChild(user, studentId));
  const reports = await getParentChildProgressOverview(user.id, studentId);

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/parent">
              <ArrowLeft aria-hidden="true" />
              Dashboard
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Parent dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">Child progress</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            Parent view shows only active linked children and read-only learning
            progress.
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
        {reports.length === 0 ? (
          <ProgressReportEmptyState
            description="No ACTIVE course progress is available for this child yet."
            title="No child progress reports yet"
          />
        ) : (
          <ProgressReportTable
            getDetailHref={(row) =>
              `/dashboard/parent/children/${studentId}/courses/${row.courseId}/progress`
            }
            parentFriendly
            rows={reports}
          />
        )}
      </section>
    </main>
  );
}
