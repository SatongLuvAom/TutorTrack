import { AssignmentStatusBadge } from "@/components/assignments/assignment-status-badge";
import type { AssignmentSubmissionStatus } from "@/services/assignment.service";

type SubmissionStatusBadgeProps = {
  status: AssignmentSubmissionStatus;
};

export function SubmissionStatusBadge({ status }: SubmissionStatusBadgeProps) {
  return <AssignmentStatusBadge status={status} />;
}
