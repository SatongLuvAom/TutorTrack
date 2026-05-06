import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradeSubmissionForm } from "@/components/submissions/grade-submission-form";
import { requirePermission, requireTutor } from "@/lib/guards";
import { canGradeSubmission } from "@/lib/permissions";
import { getTutorSubmissionById } from "@/services/submission.service";
import { gradeTutorSubmissionAction } from "@/app/dashboard/tutor/submissions/actions";

export const dynamic = "force-dynamic";

type GradeSubmissionPageProps = {
  params: Promise<{ submissionId: string }>;
};

export default async function GradeSubmissionPage({
  params,
}: GradeSubmissionPageProps) {
  const user = await requireTutor();
  const { submissionId } = await params;
  await requirePermission(canGradeSubmission(user, submissionId));
  const submission = await getTutorSubmissionById(user.id, submissionId);

  if (!submission) {
    notFound();
  }

  const returnTo = `/dashboard/tutor/assignments/${submission.assignment.id}`;

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href={returnTo}>
              <ArrowLeft aria-hidden="true" />
              Assignment
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Tutor dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">
            Grade {submission.student.displayName ?? submission.student.name}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {submission.assignment.title}
          </p>
        </div>
      </section>

      <section className="tt-shell grid gap-6 py-8 lg:grid-cols-[1fr_360px]">
        <GradeSubmissionForm
          action={gradeTutorSubmissionAction}
          returnTo={returnTo}
          submission={submission}
        />
        <aside className="tt-card p-5">
          <h2 className="tt-heading text-xl">Submitted work</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
            {submission.content ?? "No text answer"}
          </p>
          {submission.fileUrl ? (
            <Button asChild className="mt-4" variant="outline">
              <a href={submission.fileUrl} rel="noreferrer" target="_blank">
                Open file
              </a>
            </Button>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
