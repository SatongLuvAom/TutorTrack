import { AssessmentTypeBadge } from "@/components/assessments/assessment-type-badge";
import type { AssessmentScoreListItem } from "@/services/assessment.service";

type AssessmentScoreTableProps = {
  assessments: AssessmentScoreListItem[];
  showStudent?: boolean;
  showTutor?: boolean;
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

export function AssessmentScoreTable({
  assessments,
  showStudent = false,
  showTutor = false,
}: AssessmentScoreTableProps) {
  return (
    <div className="tt-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="bg-secondary/65 text-xs uppercase text-muted-foreground">
            <tr>
              {showStudent ? (
                <th className="px-4 py-3 font-medium">Student</th>
              ) : null}
              <th className="px-4 py-3 font-medium">Assessment</th>
              <th className="px-4 py-3 font-medium">Course</th>
              {showTutor ? (
                <th className="px-4 py-3 font-medium">Tutor</th>
              ) : null}
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {assessments.map((assessment) => (
              <tr
                className="align-top transition-colors hover:bg-secondary/35"
                key={assessment.id}
              >
                {showStudent ? (
                  <td className="px-4 py-4">
                    <p className="font-semibold">
                      {assessment.student.displayName ?? assessment.student.name}
                    </p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">
                      {assessment.student.email}
                    </p>
                  </td>
                ) : null}
                <td className="px-4 py-4 font-semibold">{assessment.title}</td>
                <td className="px-4 py-4">
                  <p className="font-medium">{assessment.course.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {assessment.course.subject.name}
                  </p>
                </td>
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
                <td className="px-4 py-4">
                  {assessment.score === null
                    ? "-"
                    : `${assessment.score} / ${assessment.maxScore} (${assessment.percentage}%)`}
                </td>
                <td className="px-4 py-4">{formatDate(assessment.takenAt)}</td>
                <td className="px-4 py-4">
                  <p className="max-w-xs text-xs leading-5 text-muted-foreground">
                    {assessment.note ?? "-"}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
