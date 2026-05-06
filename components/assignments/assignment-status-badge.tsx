import type { AssignmentSubmissionStatus } from "@/services/assignment.service";

type AssignmentStatusBadgeProps = {
  status: AssignmentSubmissionStatus;
};

const styles: Record<AssignmentSubmissionStatus, string> = {
  NOT_SUBMITTED: "border-slate-200 bg-slate-50 text-slate-700",
  SUBMITTED: "border-sky-200 bg-sky-50 text-sky-700",
  GRADED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  LATE: "border-amber-200 bg-amber-50 text-amber-800",
  OVERDUE: "border-rose-200 bg-rose-50 text-rose-700",
};

const labels: Record<AssignmentSubmissionStatus, string> = {
  NOT_SUBMITTED: "Not submitted",
  SUBMITTED: "Submitted",
  GRADED: "Graded",
  LATE: "Late",
  OVERDUE: "Overdue",
};

export function AssignmentStatusBadge({ status }: AssignmentStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
