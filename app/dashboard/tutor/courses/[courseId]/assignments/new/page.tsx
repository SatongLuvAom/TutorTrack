import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssignmentForm } from "@/components/assignments/assignment-form";
import { requirePermission, requireTutor } from "@/lib/guards";
import { canCreateAssignment } from "@/lib/permissions";
import { getTutorCourseById } from "@/services/course.service";
import { createTutorAssignmentAction } from "@/app/dashboard/tutor/assignments/actions";

export const dynamic = "force-dynamic";

type NewAssignmentPageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function NewAssignmentPage({
  params,
}: NewAssignmentPageProps) {
  const user = await requireTutor();
  const { courseId } = await params;
  await requirePermission(canCreateAssignment(user, courseId));
  const course = await getTutorCourseById(user.id, courseId);

  if (!course) {
    notFound();
  }

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href={`/dashboard/tutor/courses/${courseId}/assignments`}>
              <ArrowLeft aria-hidden="true" />
              Assignments
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Tutor dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">
            New assignment for {course.title}
          </h1>
        </div>
      </section>

      <section className="tt-shell max-w-3xl py-8">
        <AssignmentForm
          action={createTutorAssignmentAction}
          courseId={courseId}
          returnTo={`/dashboard/tutor/courses/${courseId}/assignments`}
        />
      </section>
    </main>
  );
}
