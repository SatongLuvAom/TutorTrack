import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FilePenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmissionTable } from "@/components/submissions/submission-table";
import { requirePermission, requireTutor } from "@/lib/guards";
import { canViewAssignmentSubmissions } from "@/lib/permissions";
import { getTutorAssignmentById } from "@/services/assignment.service";

export const dynamic = "force-dynamic";

type TutorAssignmentDetailPageProps = {
  params: Promise<{ assignmentId: string }>;
};

function formatDate(value: Date | null): string {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function TutorAssignmentDetailPage({
  params,
}: TutorAssignmentDetailPageProps) {
  const user = await requireTutor();
  const { assignmentId } = await params;
  await requirePermission(canViewAssignmentSubmissions(user, assignmentId));
  const assignment = await getTutorAssignmentById(user.id, assignmentId);

  if (!assignment) {
    notFound();
  }

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/tutor/assignments">
              <ArrowLeft aria-hidden="true" />
              Assignments
            </Link>
          </Button>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="tt-kicker">Tutor dashboard</p>
              <h1 className="tt-heading mt-2 text-3xl">{assignment.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                {assignment.description}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={`/dashboard/tutor/assignments/${assignment.id}/edit`}>
                <FilePenLine aria-hidden="true" />
                Edit assignment
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="tt-shell grid gap-6 py-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="tt-card p-5">
            <h2 className="tt-heading text-xl">Assignment details</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Course</dt>
                <dd className="mt-1 font-medium">
                  {assignment.course.title}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Subject</dt>
                <dd className="mt-1 font-medium">
                  {assignment.course.subject.name}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Due date</dt>
                <dd className="mt-1 font-medium">
                  {formatDate(assignment.dueDate)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Max score</dt>
                <dd className="mt-1 font-medium">
                  {assignment.maxScore ?? "-"}
                </dd>
              </div>
            </dl>
          </section>

          <SubmissionTable
            gradePathPrefix="/dashboard/tutor/submissions"
            roster={assignment.roster}
          />
        </div>

        <aside className="space-y-4">
          <div className="tt-card p-5">
            <p className="text-sm text-muted-foreground">Submissions</p>
            <p className="mt-2 text-3xl font-semibold">
              {assignment.stats.submissionCount} /{" "}
              {assignment.stats.activeEnrollmentCount}
            </p>
          </div>
          <div className="tt-card p-5">
            <p className="text-sm text-muted-foreground">Pending grading</p>
            <p className="mt-2 text-3xl font-semibold">
              {assignment.stats.pendingGradingCount}
            </p>
          </div>
          <div className="tt-card p-5">
            <p className="text-sm text-muted-foreground">Late submissions</p>
            <p className="mt-2 text-3xl font-semibold">
              {assignment.stats.lateCount}
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
