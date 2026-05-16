import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressScoreBar } from "./progress-score-bar";
import { formatMetricPercent } from "./progress-utils";

type ProgressMetricCardProps = {
  label: string;
  value: number | null | undefined;
  helperText?: string;
  icon?: LucideIcon;
  className?: string;
};

export function ProgressMetricCard({
  label,
  value,
  helperText,
  icon: Icon,
  className,
}: ProgressMetricCardProps) {
  return (
    <article className={cn("tt-card p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatMetricPercent(value)}
          </p>
        </div>
        {Icon ? (
          <div className="rounded-lg bg-secondary p-2 text-primary">
            <Icon aria-hidden="true" className="size-4" />
          </div>
        ) : null}
      </div>
      {helperText ? (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          {helperText}
        </p>
      ) : null}
      <ProgressScoreBar className="mt-4" score={value} />
    </article>
  );
}
