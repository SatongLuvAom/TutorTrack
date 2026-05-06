import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FilePenLine } from "lucide-react";
import { AssessmentSummaryCards } from "@/components/assessments/assessment-summary-cards";
import { AssessmentTypeBadge } from "@/components/assessments/assessment-type-badge";
import { BulkAssessmentScoreForm } from "@/components/assessments/bulk-assessment-score-form";
import { Button } from "@/components/ui/button";
import { requirePermission, requireTutor } from "@/lib/guards";
import { canRecordAssessmentScore } from "@/lib/permissions";
import { bulkRecordTutorAssessmentScoresAction } from "@/app/dashboard/tutor/assessments/actions";
import { getTutorAssessmentById } from "@/services/assessment.service";

export const dynamic = "force-dynamic";

type TutorAssessmentDetailPageProps = {
  params: Promise<{ assessmentId: string }>;
};

function formatDate(value: Date | null): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function TutorAssessmentDetailPage({
  params,
}: TutorAssessmentDetailPageProps) {
  const user = await requireTutor();
  const { assessmentId } = await params;
  await requirePermission(canRecordAssessmentScore(user, assessmentId));
  const assessment = await getTutorAssessmentById(user.id, assessmentId);

  if (!assessment) {
    notFound();
  }

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/tutor/assessments">
              <ArrowLeft aria-hidden="true" />
              Assessments
            </Link>
          </Button>
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="tt-kicker">Tutor dashboard</p>
              <h1 className="tt-heading mt-2 text-3xl">{assessment.title}</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                {assessment.course.title} · {formatDate(assessment.takenAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <AssessmentTypeBadge type={assessment.type} />
              <Button asChild variant="outline">
                <Link href={`/dashboard/tutor/assessments/${assessment.id}/edit`}>
                  <FilePenLine aria-hidden="true" />
                  Edit
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="tt-shell space-y-6 py-8">
        <AssessmentSummaryCards assessment={assessment} />
        {assessment.roster.length === 0 ? (
          <div className="tt-card border-dashed p-8 text-center">
            <h2 className="tt-heading text-xl">No active students</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Scores can be recorded only for ACTIVE enrolled students.
            </p>
          </div>
        ) : (
          <BulkAssessmentScoreForm
            action={bulkRecordTutorAssessmentScoresAction}
            assessment={assessment}
          />
        )}
      </section>
    </main>
  );
}
