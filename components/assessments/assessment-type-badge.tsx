import { AssessmentType } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

type AssessmentTypeBadgeProps = {
  type: AssessmentType;
};

const labels: Record<AssessmentType, string> = {
  [AssessmentType.PRE_TEST]: "Pre-test",
  [AssessmentType.QUIZ]: "Quiz",
  [AssessmentType.MOCK_EXAM]: "Mock exam",
  [AssessmentType.POST_TEST]: "Post-test",
};

export function AssessmentTypeBadge({ type }: AssessmentTypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        "border-primary/20 bg-primary/10 text-primary",
      )}
    >
      {labels[type]}
    </span>
  );
}
