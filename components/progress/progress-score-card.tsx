import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressScoreBar } from "./progress-score-bar";
import {
  formatProgressScore,
  getProgressScoreLabel,
  getProgressScoreStatus,
  getProgressToneClasses,
} from "./progress-utils";

type ProgressScoreCardProps = {
  score: number | null | undefined;
  completenessScore: number;
  title?: string;
  description?: string;
};

export function ProgressScoreCard({
  score,
  completenessScore,
  title = "Overall progress",
  description = "Weighted from attendance, homework, assessments, skills, and tutor notes.",
}: ProgressScoreCardProps) {
  const status = getProgressScoreStatus(score, completenessScore);

  return (
    <section className="tt-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="tt-kicker">{title}</p>
          <div className="mt-2 flex items-end gap-3">
            <span className="text-5xl font-semibold leading-none text-foreground">
              {formatProgressScore(score)}
            </span>
            <span className="pb-1 text-sm font-semibold text-muted-foreground">
              / 100
            </span>
          </div>
        </div>
        <div className="rounded-lg bg-primary/10 p-3 text-primary">
          <Activity aria-hidden="true" className="size-5" />
        </div>
      </div>
      <div
        className={cn(
          "mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
          getProgressToneClasses(status),
        )}
      >
        {getProgressScoreLabel(status)}
      </div>
      <ProgressScoreBar
        className="mt-5"
        completenessScore={completenessScore}
        score={score}
      />
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </section>
  );
}
