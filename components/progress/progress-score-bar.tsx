import { cn } from "@/lib/utils";
import {
  clampProgressScore,
  getProgressBarClasses,
  getProgressScoreStatus,
} from "./progress-utils";

type ProgressScoreBarProps = {
  score: number | null | undefined;
  completenessScore?: number;
  className?: string;
};

export function ProgressScoreBar({
  score,
  completenessScore = 100,
  className,
}: ProgressScoreBarProps) {
  const status = getProgressScoreStatus(score, completenessScore);
  const width = clampProgressScore(score);

  return (
    <div
      aria-label="Progress score"
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(width)}
      className={cn("h-2.5 overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
    >
      <div
        className={cn("h-full rounded-full", getProgressBarClasses(status))}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
