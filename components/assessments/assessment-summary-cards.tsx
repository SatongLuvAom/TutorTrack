import { BarChart3, ClipboardPenLine, Percent, Users } from "lucide-react";
import type { AssessmentListItem } from "@/services/assessment.service";

type AssessmentSummaryCardsProps = {
  assessment: AssessmentListItem;
};

export function AssessmentSummaryCards({
  assessment,
}: AssessmentSummaryCardsProps) {
  const cards = [
    {
      label: "Max score",
      value: assessment.maxScore,
      icon: ClipboardPenLine,
    },
    {
      label: "Scored students",
      value: `${assessment.stats.scoredCount} / ${assessment.stats.activeEnrollmentCount}`,
      icon: Users,
    },
    {
      label: "Average score",
      value: assessment.stats.averageScore ?? "-",
      icon: BarChart3,
    },
    {
      label: "Average percent",
      value:
        assessment.stats.averagePercentage === null
          ? "-"
          : `${assessment.stats.averagePercentage}%`,
      icon: Percent,
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
            <p className="mt-1 text-2xl font-semibold">{card.value}</p>
          </div>
        );
      })}
    </div>
  );
}
