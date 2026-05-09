import type React from "react";
import type {
  ProgressReport,
  ProgressReportNote,
} from "@/services/progress.service";
import type { ProgressNoteSummary } from "@/services/progress-note.service";
import { DataCompletenessCard } from "./data-completeness-card";
import { ProgressMetricGrid } from "./progress-metric-grid";
import { ProgressNoteCard } from "./progress-note-card";
import { ProgressScoreCard } from "./progress-score-card";
import { RecommendationCard } from "./recommendation-card";
import { SkillMatrix } from "./skill-matrix";
import { StrengthsWeaknessesCard } from "./strengths-weaknesses-card";

type ProgressReportViewProps = {
  report: ProgressReport;
  parentFriendly?: boolean;
  noteHistory?: ProgressNoteSummary[];
  noteForm?: React.ReactNode;
  parentSummary?: ProgressReportNote | null;
};

export function ProgressReportView({
  report,
  parentFriendly = false,
  noteHistory,
  noteForm,
  parentSummary,
}: ProgressReportViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <ProgressScoreCard
          completenessScore={report.dataCompleteness.completenessScore}
          score={report.progressScore}
        />
        <DataCompletenessCard data={report.dataCompleteness} />
      </div>
      <ProgressMetricGrid report={report} />
      <SkillMatrix skills={report.skillMatrix} />
      <StrengthsWeaknessesCard
        strengths={report.strengths}
        weaknesses={report.weaknesses}
      />
      <RecommendationCard
        parentFriendly={parentFriendly}
        recommendations={report.recommendedNextSteps}
      />
      {parentFriendly && parentSummary ? (
        <ProgressNoteCard note={parentSummary} title="Parent summary" />
      ) : (
        <ProgressNoteCard note={report.latestTutorNote} />
      )}
      {noteForm}
      {noteHistory ? (
        <section className="space-y-4">
          <div>
            <p className="tt-kicker">Progress note history</p>
            <h2 className="tt-heading mt-1 text-xl">Tutor notes</h2>
          </div>
          {noteHistory.length === 0 ? (
            <ProgressNoteCard note={null} title="Progress note history" />
          ) : (
            noteHistory.map((note) => (
              <ProgressNoteCard key={note.id} note={note} />
            ))
          )}
        </section>
      ) : null}
    </div>
  );
}
