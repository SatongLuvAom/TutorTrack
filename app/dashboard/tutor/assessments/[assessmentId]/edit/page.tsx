import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AssessmentForm } from "@/components/assessments/assessment-form";
import { Button } from "@/components/ui/button";
import { requirePermission, requireTutor } from "@/lib/guards";
import { canEditAssessment } from "@/lib/permissions";
import { updateTutorAssessmentAction } from "@/app/dashboard/tutor/assessments/actions";
import { getAssessmentForEdit } from "@/services/assessment.service";

export const dynamic = "force-dynamic";

type EditTutorAssessmentPageProps = {
  params: Promise<{ assessmentId: string }>;
};

export default async function EditTutorAssessmentPage({
  params,
}: EditTutorAssessmentPageProps) {
  const user = await requireTutor();
  const { assessmentId } = await params;
  await requirePermission(canEditAssessment(user, assessmentId));
  const assessment = await getAssessmentForEdit(user.id, assessmentId);

  if (!assessment) {
    notFound();
  }

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href={`/dashboard/tutor/assessments/${assessmentId}`}>
              <ArrowLeft aria-hidden="true" />
              Assessment
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Tutor dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">Edit assessment</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Existing scores must be less than or equal to the new max score.
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
        <AssessmentForm
          action={updateTutorAssessmentAction}
          assessment={assessment}
          courseId={assessment.courseId}
          returnTo={`/dashboard/tutor/assessments/${assessment.id}`}
        />
      </section>
    </main>
  );
}
