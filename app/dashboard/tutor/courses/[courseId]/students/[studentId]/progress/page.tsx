import { notFound } from "next/navigation";
import { ProgressNoteForm } from "@/components/progress/progress-note-form";
import { ProgressReportHeader } from "@/components/progress/progress-report-header";
import { ProgressReportView } from "@/components/progress/progress-report-view";
import { requirePermission, requireTutor } from "@/lib/guards";
import {
  canCreateProgressNote,
  canViewProgressReport,
} from "@/lib/permissions";
import { progressReportRouteParamsSchema } from "@/lib/validators/progress";
import { getTutorProgressNotes } from "@/services/progress-note.service";
import { calculateProgressReport } from "@/services/progress.service";
import { createTutorProgressNoteAction } from "@/app/dashboard/tutor/progress/actions";

export const dynamic = "force-dynamic";

type TutorCourseStudentProgressPageProps = {
  params: Promise<{ courseId: string; studentId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TutorCourseStudentProgressPage({
  params,
  searchParams,
}: TutorCourseStudentProgressPageProps) {
  const user = await requireTutor();
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

  const [report, notes, canCreateNote] = await Promise.all([
    calculateProgressReport(
      routeParams.data.studentId,
      routeParams.data.courseId,
      user.id,
    ),
    getTutorProgressNotes(
      user.id,
      routeParams.data.studentId,
      routeParams.data.courseId,
    ),
    canCreateProgressNote(
      user,
      routeParams.data.studentId,
      routeParams.data.courseId,
    ),
  ]);
  const query = searchParams ? await searchParams : {};

  if (!report) {
    notFound();
  }

  return (
    <main className="tt-page">
      <ProgressReportHeader
        backHref={`/dashboard/tutor/students/${routeParams.data.studentId}/progress`}
        backLabel="Student progress"
        eyebrow="Tutor progress report"
        report={report}
      />
      <section className="tt-shell py-8">
        <ProgressReportView
          noteForm={
            canCreateNote ? (
              <ProgressNoteForm
                action={createTutorProgressNoteAction}
                courseId={routeParams.data.courseId}
                error={firstValue(query.error)}
                studentId={routeParams.data.studentId}
              />
            ) : null
          }
          noteHistory={notes}
          report={report}
        />
      </section>
    </main>
  );
}
