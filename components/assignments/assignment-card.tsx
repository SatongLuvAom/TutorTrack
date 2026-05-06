import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { AssignmentStatusBadge } from "@/components/assignments/assignment-status-badge";
import type { StudentAssignmentItem } from "@/services/assignment.service";

type AssignmentCardProps = {
  assignment: StudentAssignmentItem;
  href: string;
};

function formatDate(value: Date | null): string {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function AssignmentCard({ assignment, href }: AssignmentCardProps) {
  return (
    <article className="tt-card tt-card-hover p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-primary">
            {assignment.course.title}
          </p>
          <h2 className="tt-heading mt-1 text-lg">
            <Link href={href}>{assignment.title}</Link>
          </h2>
        </div>
        <AssignmentStatusBadge status={assignment.status} />
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarDays aria-hidden="true" className="size-4 text-primary" />
        {formatDate(assignment.dueDate)}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        Score:{" "}
        {assignment.submission?.score !== null &&
        assignment.submission?.score !== undefined
          ? `${assignment.submission.score} / ${assignment.maxScore ?? "-"}`
          : "Not graded"}
      </p>
    </article>
  );
}
