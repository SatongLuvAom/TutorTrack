import Link from "next/link";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProgressOverviewItem } from "@/services/progress.service";
import { ProgressScoreBar } from "./progress-score-bar";
import {
  formatMetricPercent,
  formatProgressDate,
  getProgressScoreLabel,
  getProgressScoreStatus,
  toParentProgressMessage,
} from "./progress-utils";

type ProgressReportTableProps = {
  rows: ProgressOverviewItem[];
  getDetailHref: (row: ProgressOverviewItem) => string;
  showStudent?: boolean;
  showTutor?: boolean;
  parentFriendly?: boolean;
};

export function ProgressReportTable({
  rows,
  getDetailHref,
  showStudent = false,
  showTutor = true,
  parentFriendly = false,
}: ProgressReportTableProps) {
  return (
    <div className="tt-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {showStudent ? <th className="px-5 py-3">Student</th> : null}
              <th className="px-5 py-3">Course</th>
              {showTutor ? <th className="px-5 py-3">Tutor</th> : null}
              <th className="px-5 py-3">Progress</th>
              <th className="px-5 py-3">Metrics</th>
              <th className="px-5 py-3">Recommendation</th>
              <th className="px-5 py-3">Generated</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => {
              const status = getProgressScoreStatus(
                row.progressScore,
                row.dataCompleteness.completenessScore,
              );
              const recommendation = row.latestRecommendation
                ? parentFriendly
                  ? toParentProgressMessage(row.latestRecommendation)
                  : row.latestRecommendation
                : "No recommendation yet";

              return (
                <tr key={`${row.studentId}:${row.courseId}`}>
                  {showStudent ? (
                    <td className="px-5 py-4">
                      <div className="font-semibold">{row.studentName}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.studentEmail}
                      </div>
                    </td>
                  ) : null}
                  <td className="px-5 py-4">
                    <div className="font-semibold">{row.courseTitle}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.subjectName}
                    </div>
                  </td>
                  {showTutor ? (
                    <td className="px-5 py-4">
                      <div>{row.tutorName}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.tutorEmail}
                      </div>
                    </td>
                  ) : null}
                  <td className="px-5 py-4">
                    <div className="font-semibold">
                      {Math.round(row.progressScore)} -{" "}
                      {getProgressScoreLabel(status)}
                    </div>
                    <ProgressScoreBar
                      className="mt-2"
                      completenessScore={
                        row.dataCompleteness.completenessScore
                      }
                      score={row.progressScore}
                    />
                  </td>
                  <td className="px-5 py-4 text-xs leading-5 text-muted-foreground">
                    <div>Attendance {formatMetricPercent(row.attendanceRate)}</div>
                    <div>Homework {formatMetricPercent(row.homeworkCompletionRate)}</div>
                    <div>Assessment {formatMetricPercent(row.assessmentAverage)}</div>
                    <div>Skills {formatMetricPercent(row.skillAverage)}</div>
                    <div>
                      Completeness{" "}
                      {formatMetricPercent(
                        row.dataCompleteness.completenessScore,
                      )}
                    </div>
                  </td>
                  <td className="max-w-[240px] px-5 py-4 text-muted-foreground">
                    {recommendation}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {formatProgressDate(row.generatedAt)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={getDetailHref(row)}>
                        <Eye aria-hidden="true" />
                        View
                      </Link>
                    </Button>
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
