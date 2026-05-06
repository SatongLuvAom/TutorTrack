import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmissionTable } from "@/components/submissions/submission-table";
import { requireAdmin } from "@/lib/guards";
import { getAdminAssignmentById } from "@/services/assignment.service";

export const dynamic = "force-dynamic";

type AdminAssignmentDetailPageProps = {
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

export default async function AdminAssignmentDetailPage({
  params,
}: AdminAssignmentDetailPageProps) {
  await requireAdmin();
  const { assignmentId } = await params;
  const assignment = await getAdminAssignmentById(assignmentId);

  if (!assignment) {
    notFound();
  }

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/admin/assignments">
              <ArrowLeft aria-hidden="true" />
              Assignments
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Admin dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">{assignment.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Read-only assignment inspection for admin users.
          </p>
        </div>
      </section>

      <section className="tt-shell grid gap-6 py-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="tt-card p-5">
            <h2 className="tt-heading text-xl">Assignment details</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {assignment.description}
            </p>
          </section>
          <SubmissionTable roster={assignment.roster} />
        </div>

        <aside className="space-y-4">
          <div className="tt-card p-5">
            <p className="text-sm text-muted-foreground">Course</p>
            <p className="mt-2 font-semibold">{assignment.course.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {assignment.course.tutor.name}
            </p>
          </div>
          <div className="tt-card p-5">
            <p className="text-sm text-muted-foreground">Due</p>
            <p className="mt-2 font-semibold">{formatDate(assignment.dueDate)}</p>
          </div>
          <div className="tt-card p-5">
            <p className="text-sm text-muted-foreground">Submissions</p>
            <p className="mt-2 text-3xl font-semibold">
              {assignment.stats.submissionCount} /{" "}
              {assignment.stats.activeEnrollmentCount}
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
