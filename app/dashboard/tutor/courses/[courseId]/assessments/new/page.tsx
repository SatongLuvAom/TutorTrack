import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AssessmentForm } from "@/components/assessments/assessment-form";
import { Button } from "@/components/ui/button";
import { requirePermission, requireTutor } from "@/lib/guards";
import { canCreateAssessment } from "@/lib/permissions";
import { createTutorAssessmentAction } from "@/app/dashboard/tutor/assessments/actions";
import { getTutorCourseById } from "@/services/course.service";

export const dynamic = "force-dynamic";

type NewTutorAssessmentPageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function NewTutorAssessmentPage({
  params,
}: NewTutorAssessmentPageProps) {
  const user = await requireTutor();
  const { courseId } = await params;
  await requirePermission(canCreateAssessment(user, courseId));
  const course = await getTutorCourseById(user.id, courseId);

  if (!course) {
    notFound();
  }

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href={`/dashboard/tutor/courses/${courseId}/assessments`}>
              <ArrowLeft aria-hidden="true" />
              Assessments
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Tutor dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">Create assessment</h1>
          <p className="mt-3 text-sm text-muted-foreground">{course.title}</p>
        </div>
      </section>

      <section className="tt-shell py-8">
        <AssessmentForm
          action={createTutorAssessmentAction}
          courseId={courseId}
          returnTo={`/dashboard/tutor/courses/${courseId}/assessments`}
        />
      </section>
    </main>
  );
}
