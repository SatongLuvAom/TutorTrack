import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssignmentForm } from "@/components/assignments/assignment-form";
import { requirePermission, requireTutor } from "@/lib/guards";
import { canEditAssignment } from "@/lib/permissions";
import { getTutorAssignmentById } from "@/services/assignment.service";
import { updateTutorAssignmentAction } from "@/app/dashboard/tutor/assignments/actions";

export const dynamic = "force-dynamic";

type EditAssignmentPageProps = {
  params: Promise<{ assignmentId: string }>;
};

export default async function EditAssignmentPage({
  params,
}: EditAssignmentPageProps) {
  const user = await requireTutor();
  const { assignmentId } = await params;
  await requirePermission(canEditAssignment(user, assignmentId));
  const assignment = await getTutorAssignmentById(user.id, assignmentId);

  if (!assignment) {
    notFound();
  }

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href={`/dashboard/tutor/assignments/${assignmentId}`}>
              <ArrowLeft aria-hidden="true" />
              Assignment
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Tutor dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">
            Edit {assignment.title}
          </h1>
        </div>
      </section>

      <section className="tt-shell max-w-3xl py-8">
        <AssignmentForm
          action={updateTutorAssignmentAction}
          assignment={assignment}
          courseId={assignment.course.id}
          returnTo={`/dashboard/tutor/assignments/${assignment.id}`}
        />
      </section>
    </main>
  );
}
