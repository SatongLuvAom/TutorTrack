import { SkillLevel } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

type SkillLevelBadgeProps = {
  level?: SkillLevel | null;
};

const labels: Record<SkillLevel, string> = {
  [SkillLevel.NEEDS_WORK]: "Needs work",
  [SkillLevel.BASIC]: "Basic",
  [SkillLevel.GOOD]: "Good",
  [SkillLevel.EXCELLENT]: "Excellent",
};

const colors: Record<SkillLevel, string> = {
  [SkillLevel.NEEDS_WORK]: "border-rose-200 bg-rose-50 text-rose-700",
  [SkillLevel.BASIC]: "border-amber-200 bg-amber-50 text-amber-700",
  [SkillLevel.GOOD]: "border-sky-200 bg-sky-50 text-sky-700",
  [SkillLevel.EXCELLENT]: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function SkillLevelBadge({ level }: SkillLevelBadgeProps) {
  if (!level) {
    return (
      <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
        Not set
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        colors[level],
      )}
    >
      {labels[level]}
    </span>
  );
}
