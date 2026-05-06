import { BarChart3, BookOpenCheck, Target } from "lucide-react";
import type { SkillProgressMatrixItem } from "@/services/skill-progress.service";

type StudentSkillSummaryProps = {
  rows: SkillProgressMatrixItem[];
};

export function StudentSkillSummary({ rows }: StudentSkillSummaryProps) {
  const completed = rows.filter((row) => row.progress).length;
  const average =
    completed === 0
      ? null
      : Math.round(
          rows.reduce((sum, row) => sum + (row.progress?.score ?? 0), 0) /
            completed,
        );
  const courses = new Set(rows.map((row) => row.skill.course.id)).size;

  const cards = [
    { label: "Tracked skills", value: rows.length, icon: Target },
    { label: "Updated skills", value: completed, icon: BookOpenCheck },
    { label: "Skill average", value: average === null ? "-" : average, icon: BarChart3 },
    { label: "Courses", value: courses, icon: BookOpenCheck },
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
