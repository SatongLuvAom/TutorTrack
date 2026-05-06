import Link from "next/link";
import { FilePenLine } from "lucide-react";
import { AssessmentTypeBadge } from "@/components/assessments/assessment-type-badge";
import { Button } from "@/components/ui/button";
import type { AssessmentListItem } from "@/services/assessment.service";

type AssessmentTableProps = {
  assessments: AssessmentListItem[];
  viewPathPrefix: string;
  editPathPrefix?: string;
  showTutor?: boolean;
  showCourse?: boolean;
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

export function AssessmentTable({
  assessments,
  viewPathPrefix,
  editPathPrefix,
  showTutor = false,
  showCourse = true,
}: AssessmentTableProps) {
  return (
    <div className="tt-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead className="bg-secondary/65 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Assessment</th>
              {showCourse ? (
                <th className="px-4 py-3 font-medium">Course</th>
              ) : null}
              {showTutor ? (
                <th className="px-4 py-3 font-medium">Tutor</th>
              ) : null}
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Scores</th>
              <th className="px-4 py-3 font-medium">Average</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {assessments.map((assessment) => (
              <tr
                className="align-top transition-colors hover:bg-secondary/35"
                key={assessment.id}
              >
                <td className="px-4 py-4">
                  <Link
                    className="font-semibold text-primary hover:underline"
                    href={`${viewPathPrefix}/${assessment.id}`}
                  >
                    {assessment.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Max {assessment.maxScore}
                  </p>
                </td>
                {showCourse ? (
                  <td className="px-4 py-4">
                    <p className="font-medium">{assessment.course.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {assessment.course.subject.name}
                    </p>
                  </td>
                ) : null}
                {showTutor ? (
                  <td className="px-4 py-4">
                    <p className="font-medium">{assessment.course.tutor.name}</p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">
                      {assessment.course.tutor.email}
                    </p>
                  </td>
                ) : null}
                <td className="px-4 py-4">
                  <AssessmentTypeBadge type={assessment.type} />
                </td>
                <td className="px-4 py-4">{formatDate(assessment.takenAt)}</td>
                <td className="px-4 py-4">
                  {assessment.stats.scoredCount} /{" "}
                  {assessment.stats.activeEnrollmentCount}
                </td>
                <td className="px-4 py-4">
                  {assessment.stats.averageScore === null
                    ? "-"
                    : `${assessment.stats.averageScore} (${assessment.stats.averagePercentage}%)`}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`${viewPathPrefix}/${assessment.id}`}>
                        View
                      </Link>
                    </Button>
                    {editPathPrefix ? (
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`${editPathPrefix}/${assessment.id}/edit`}>
                          <FilePenLine aria-hidden="true" />
                          Edit
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
