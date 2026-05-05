import { CourseStatus } from "@/lib/generated/prisma/enums";
import { StatusBadge } from "@/components/marketplace/status-badge";

type CourseStatusBadgeProps = {
  status: CourseStatus;
};

const statusLabels: Record<CourseStatus, string> = {
  [CourseStatus.DRAFT]: "Draft",
  [CourseStatus.PUBLISHED]: "Published",
  [CourseStatus.ARCHIVED]: "Archived",
};

const statusTones: Record<
  CourseStatus,
  "neutral" | "success" | "warning" | "accent"
> = {
  [CourseStatus.DRAFT]: "neutral",
  [CourseStatus.PUBLISHED]: "success",
  [CourseStatus.ARCHIVED]: "warning",
};

export function CourseStatusBadge({ status }: CourseStatusBadgeProps) {
  return <StatusBadge tone={statusTones[status]}>{statusLabels[status]}</StatusBadge>;
}
