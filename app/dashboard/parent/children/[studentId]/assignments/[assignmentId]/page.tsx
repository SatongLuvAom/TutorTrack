import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssignmentStatusBadge } from "@/components/assignments/assignment-status-badge";
import { requireParent, requirePermission } from "@/lib/guards";
import { canViewStudentAssignments } from "@/lib/permissions";
import { getParentChildAssignmentById } from "@/services/assignment.service";

export const dynamic = "force-dynamic";

type ParentChildAssignmentDetailPageProps = {
  params: Promise<{ studentId: string; assignmentId: string }>;
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

export default async function ParentChildAssignmentDetailPage({
  params,
}: ParentChildAssignmentDetailPageProps) {
  const user = await requireParent();
  const { studentId, assignmentId } = await params;
  await requirePermission(canViewStudentAssignments(user, studentId));
  const assignment = await getParentChildAssignmentById(
    user.id,
    studentId,
    assignmentId,
  );

  if (!assignment) {
    notFound();
  }

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href={`/dashboard/parent/children/${studentId}/assignments`}>
              <ArrowLeft aria-hidden="true" />
              Assignments
            </Link>
          </Button>
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="tt-kicker">Parent dashboard</p>
              <h1 className="tt-heading mt-2 text-3xl">{assignment.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {assignment.course.title}
              </p>
            </div>
            <AssignmentStatusBadge status={assignment.status} />
          </div>
        </div>
      </section>

      <section className="tt-shell grid gap-6 py-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="tt-card p-5">
            <h2 className="tt-heading text-xl">Assignment</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {assignment.description}
            </p>
          </section>

          <section className="tt-card p-5">
            <h2 className="tt-heading text-xl">Submission</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {assignment.submission?.content ?? "No text submission yet."}
            </p>
            {assignment.submission?.fileUrl ? (
              <Button asChild className="mt-4" variant="outline">
                <a
                  href={assignment.submission.fileUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open file
                </a>
              </Button>
            ) : null}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="tt-card p-5">
            <p className="text-sm text-muted-foreground">Due date</p>
            <p className="mt-2 font-semibold">{formatDate(assignment.dueDate)}</p>
          </div>
          <div className="tt-card p-5">
            <p className="text-sm text-muted-foreground">Score</p>
            <p className="mt-2 text-3xl font-semibold">
              {assignment.submission?.score !== null &&
              assignment.submission?.score !== undefined
                ? `${assignment.submission.score} / ${assignment.maxScore ?? "-"}`
                : "Not graded"}
            </p>
          </div>
          {assignment.submission?.feedback ? (
            <div className="tt-card p-5">
              <p className="text-sm text-muted-foreground">Feedback</p>
              <p className="mt-2 text-sm leading-7">
                {assignment.submission.feedback}
              </p>
            </div>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
