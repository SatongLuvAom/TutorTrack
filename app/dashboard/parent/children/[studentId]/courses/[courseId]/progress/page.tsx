import { notFound } from "next/navigation";
import { ProgressReportHeader } from "@/components/progress/progress-report-header";
import { ProgressReportView } from "@/components/progress/progress-report-view";
import { requireParent, requirePermission } from "@/lib/guards";
import { canViewProgressReport } from "@/lib/permissions";
import { progressReportRouteParamsSchema } from "@/lib/validators/progress";
import { calculateProgressReport } from "@/services/progress.service";

export const dynamic = "force-dynamic";

type ParentChildCourseProgressPageProps = {
  params: Promise<{ studentId: string; courseId: string }>;
};

export default async function ParentChildCourseProgressPage({
  params,
}: ParentChildCourseProgressPageProps) {
  const user = await requireParent();
  const routeParams = progressReportRouteParamsSchema.safeParse(await params);

  if (!routeParams.success) {
    notFound();
  }

  await requirePermission(
    canViewProgressReport(
      user,
      routeParams.data.studentId,
      routeParams.data.courseId,
    ),
  );

  const report = await calculateProgressReport(
    routeParams.data.studentId,
    routeParams.data.courseId,
    user.id,
  );

  if (!report) {
    notFound();
  }

  return (
    <main className="tt-page">
      <ProgressReportHeader
        backHref={`/dashboard/parent/children/${routeParams.data.studentId}/progress`}
        backLabel="Child progress"
        eyebrow="Parent progress report"
        report={report}
      />
      <section className="tt-shell py-8">
        <ProgressReportView
          parentFriendly
          parentSummary={report.latestTutorNote}
          report={report}
        />
      </section>
    </main>
  );
}
