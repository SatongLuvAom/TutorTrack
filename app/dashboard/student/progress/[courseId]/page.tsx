import { notFound } from "next/navigation";
import { ProgressReportHeader } from "@/components/progress/progress-report-header";
import { ProgressReportView } from "@/components/progress/progress-report-view";
import { requirePermission, requireStudent } from "@/lib/guards";
import { canViewProgressReport } from "@/lib/permissions";
import { progressReportQuerySchema } from "@/lib/validators/progress";
import { calculateProgressReport } from "@/services/progress.service";

export const dynamic = "force-dynamic";

type StudentCourseProgressPageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function StudentCourseProgressPage({
  params,
}: StudentCourseProgressPageProps) {
  const user = await requireStudent();
  const { courseId } = await params;

  if (!user.studentProfileId) {
    notFound();
  }

  const routeParams = progressReportQuerySchema.safeParse({
    studentId: user.studentProfileId,
    courseId,
  });

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
        backHref="/dashboard/student/progress"
        backLabel="Progress"
        eyebrow="Student progress report"
        report={report}
      />
      <section className="tt-shell py-8">
        <ProgressReportView report={report} />
      </section>
    </main>
  );
}
