import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmissionStatusBadge } from "@/components/submissions/submission-status-badge";
import type {
  AssignmentRosterItem,
} from "@/services/assignment.service";
import type { SubmissionListItem } from "@/services/submission.service";

type SubmissionTableProps = {
  roster?: AssignmentRosterItem[];
  submissions?: SubmissionListItem[];
  gradePathPrefix?: string;
  showCourse?: boolean;
  showStudent?: boolean;
};

function formatDate(value: Date | null): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function SubmissionTable({
  roster,
  submissions,
  gradePathPrefix,
  showCourse = true,
  showStudent = true,
}: SubmissionTableProps) {
  const rosterRows = roster ?? [];
  const submissionRows = submissions ?? [];

  if (rosterRows.length > 0) {
    return (
      <div className="tt-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-secondary/65 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Feedback</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rosterRows.map((row) => (
                <tr className="align-top hover:bg-secondary/35" key={row.student.id}>
                  <td className="px-4 py-4">
                    <p className="font-semibold">
                      {row.student.displayName ?? row.student.name}
                    </p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">
                      {row.student.email}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <SubmissionStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-4">
                    {formatDate(row.submission?.submittedAt ?? null)}
                  </td>
                  <td className="px-4 py-4">
                    {row.submission?.score ?? "-"}
                  </td>
                  <td className="px-4 py-4">
                    <p className="max-w-xs text-xs leading-5 text-muted-foreground">
                      {row.submission?.feedback ?? "-"}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    {row.submission && gradePathPrefix ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`${gradePathPrefix}/${row.submission.id}/grade`}>
                          <ClipboardCheck aria-hidden="true" />
                          Grade
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No submission
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="tt-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead className="bg-secondary/65 text-xs uppercase text-muted-foreground">
            <tr>
              {showStudent ? (
                <th className="px-4 py-3 font-medium">Student</th>
              ) : null}
              <th className="px-4 py-3 font-medium">Assignment</th>
              {showCourse ? (
                <th className="px-4 py-3 font-medium">Course</th>
              ) : null}
              <th className="px-4 py-3 font-medium">Submitted</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Feedback</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {submissionRows.map((submission) => (
              <tr className="align-top hover:bg-secondary/35" key={submission.id}>
                {showStudent ? (
                  <td className="px-4 py-4">
                    <p className="font-semibold">
                      {submission.student.displayName ?? submission.student.name}
                    </p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">
                      {submission.student.email}
                    </p>
                  </td>
                ) : null}
                <td className="px-4 py-4">
                  <p className="font-semibold">{submission.assignment.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Due {formatDate(submission.assignment.dueDate)}
                  </p>
                </td>
                {showCourse ? (
                  <td className="px-4 py-4">
                    <p className="font-medium">
                      {submission.assignment.course.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {submission.assignment.course.subject.name}
                    </p>
                  </td>
                ) : null}
                <td className="px-4 py-4">
                  {formatDate(submission.submittedAt)}
                </td>
                <td className="px-4 py-4">
                  <SubmissionStatusBadge status={submission.status} />
                </td>
                <td className="px-4 py-4">
                  {submission.score !== null
                    ? `${submission.score} / ${submission.assignment.maxScore ?? "-"}`
                    : "-"}
                </td>
                <td className="px-4 py-4">
                  <p className="max-w-xs text-xs leading-5 text-muted-foreground">
                    {submission.feedback ?? "-"}
                  </p>
                </td>
                <td className="px-4 py-4">
                  {gradePathPrefix ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`${gradePathPrefix}/${submission.id}/grade`}>
                        <ClipboardCheck aria-hidden="true" />
                        Grade
                      </Link>
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">View only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
