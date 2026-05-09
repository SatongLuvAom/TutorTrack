import { notFound } from "next/navigation";
import { ProgressReportHeader } from "@/components/progress/progress-report-header";
import { ProgressReportView } from "@/components/progress/progress-report-view";
import { requireAdmin, requirePermission } from "@/lib/guards";
import { canViewProgressReport } from "@/lib/permissions";
import { progressReportRouteParamsSchema } from "@/lib/validators/progress";
import { getProgressNotes } from "@/services/progress-note.service";
import { calculateProgressReport } from "@/services/progress.service";

export const dynamic = "force-dynamic";

type AdminProgressDetailPageProps = {
  params: Promise<{ studentId: string; courseId: string }>;
};

export default async function AdminProgressDetailPage({
  params,
}: AdminProgressDetailPageProps) {
  const user = await requireAdmin();
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

  const [report, notes] = await Promise.all([
    calculateProgressReport(
      routeParams.data.studentId,
      routeParams.data.courseId,
      user.id,
    ),
    getProgressNotes(routeParams.data.studentId, routeParams.data.courseId),
  ]);

  if (!report) {
    notFound();
  }

  return (
    <main className="tt-page">
      <ProgressReportHeader
        backHref="/dashboard/admin/progress"
        backLabel="Progress"
        eyebrow="Admin progress report"
        report={report}
      />
      <section className="tt-shell py-8">
        <ProgressReportView noteHistory={notes} report={report} />
      </section>
    </main>
  );
}
