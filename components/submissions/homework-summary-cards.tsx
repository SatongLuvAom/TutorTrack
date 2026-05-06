import { CheckCircle2, Clock3, FileText, Timer } from "lucide-react";
import type { HomeworkSummary } from "@/services/submission.service";

type HomeworkSummaryCardsProps = {
  summary: HomeworkSummary;
};

export function HomeworkSummaryCards({ summary }: HomeworkSummaryCardsProps) {
  const cards = [
    {
      label: "Assignments",
      value: summary.totalAssignments,
      icon: FileText,
    },
    {
      label: "Submitted",
      value: summary.submittedCount,
      icon: CheckCircle2,
    },
    {
      label: "Pending",
      value: summary.pendingCount,
      icon: Clock3,
    },
    {
      label: "Late",
      value: summary.lateCount,
      icon: Timer,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div className="tt-card p-5" key={card.label}>
            <Icon aria-hidden="true" className="size-5 text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-3xl font-semibold">{card.value}</p>
          </div>
        );
      })}
      <div className="tt-card p-5 sm:col-span-2 lg:col-span-4">
        <p className="text-sm text-muted-foreground">Homework completion</p>
        <div className="mt-3 h-3 rounded-full bg-secondary">
          <div
            className="h-3 rounded-full bg-primary"
            style={{ width: `${summary.completionRate}%` }}
          />
        </div>
        <p className="mt-2 text-sm font-semibold">{summary.completionRate}%</p>
      </div>
    </div>
  );
}
