import Link from "next/link";
import { FilePenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssignmentStatusBadge } from "@/components/assignments/assignment-status-badge";
import type {
  AssignmentListItem,
  StudentAssignmentItem,
} from "@/services/assignment.service";

type AssignmentTableProps = {
  assignments: Array<AssignmentListItem | StudentAssignmentItem>;
  viewPathPrefix: string;
  editPathPrefix?: string;
  showTutor?: boolean;
  showCourse?: boolean;
  showStudentStatus?: boolean;
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

function isStudentAssignment(
  assignment: AssignmentListItem | StudentAssignmentItem,
): assignment is StudentAssignmentItem {
  return "submission" in assignment && "status" in assignment;
}

export function AssignmentTable({
  assignments,
  viewPathPrefix,
  editPathPrefix,
  showTutor = false,
  showCourse = true,
  showStudentStatus = false,
}: AssignmentTableProps) {
  return (
    <div className="tt-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead className="bg-secondary/65 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Assignment</th>
              {showCourse ? (
                <th className="px-4 py-3 font-medium">Course</th>
              ) : null}
              {showTutor ? (
                <th className="px-4 py-3 font-medium">Tutor</th>
              ) : null}
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3 font-medium">Max score</th>
              <th className="px-4 py-3 font-medium">
                {showStudentStatus ? "Status" : "Submissions"}
              </th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {assignments.map((assignment) => {
              const studentAssignment = isStudentAssignment(assignment)
                ? assignment
                : null;

              return (
                <tr
                  className="align-top transition-colors hover:bg-secondary/35"
                  key={assignment.id}
                >
                  <td className="px-4 py-4">
                    <Link
                      className="font-semibold text-primary hover:underline"
                      href={`${viewPathPrefix}/${assignment.id}`}
                    >
                      {assignment.title}
                    </Link>
                    {assignment.description ? (
                      <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                        {assignment.description}
                      </p>
                    ) : null}
                  </td>
                  {showCourse ? (
                    <td className="px-4 py-4">
                      <p className="font-medium">{assignment.course.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {assignment.course.subject.name}
                      </p>
                    </td>
                  ) : null}
                  {showTutor ? (
                    <td className="px-4 py-4">
                      <p className="font-medium">
                        {assignment.course.tutor.name}
                      </p>
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {assignment.course.tutor.email}
                      </p>
                    </td>
                  ) : null}
                  <td className="px-4 py-4">{formatDate(assignment.dueDate)}</td>
                  <td className="px-4 py-4">{assignment.maxScore ?? "-"}</td>
                  <td className="px-4 py-4">
                    {studentAssignment ? (
                      <div className="space-y-2">
                        <AssignmentStatusBadge
                          status={studentAssignment.status}
                        />
                        <p className="text-xs text-muted-foreground">
                          {studentAssignment.submission?.score !== null &&
                          studentAssignment.submission?.score !== undefined
                            ? `${studentAssignment.submission.score} / ${studentAssignment.maxScore ?? "-"}`
                            : "No score yet"}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">
                          {assignment.stats.submissionCount} /{" "}
                          {assignment.stats.activeEnrollmentCount}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {assignment.stats.gradedCount} graded,{" "}
                          {assignment.stats.pendingGradingCount} pending
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`${viewPathPrefix}/${assignment.id}`}>
                          View
                        </Link>
                      </Button>
                      {editPathPrefix ? (
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`${editPathPrefix}/${assignment.id}/edit`}>
                            <FilePenLine aria-hidden="true" />
                            Edit
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
