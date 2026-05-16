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
    <div className="space-y-4">
      <div className="grid gap-4 md:hidden">
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
            <article className="tt-card p-5" key={`${row.studentId}:${row.courseId}`}>
              {showStudent ? (
                <div className="mb-3 rounded-lg bg-secondary/65 p-3">
                  <p className="text-sm font-semibold">{row.studentName}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.studentEmail}
                  </p>
                </div>
              ) : null}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{row.courseTitle}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {row.subjectName}
                  </p>
                  {showTutor ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tutor: {row.tutorName}
                    </p>
                  ) : null}
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                  {getProgressScoreLabel(status)}
                </span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    Progress {Math.round(row.progressScore)}
                  </span>
                  <span className="text-muted-foreground">
                    Completeness{" "}
                    {formatMetricPercent(row.dataCompleteness.completenessScore)}
                  </span>
                </div>
                <ProgressScoreBar
                  className="mt-2"
                  completenessScore={row.dataCompleteness.completenessScore}
                  score={row.progressScore}
                />
              </div>
              <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm leading-6 text-muted-foreground">
                {recommendation}
              </p>
              <Button asChild className="mt-4 w-full" size="sm" variant="outline">
                <Link href={getDetailHref(row)}>
                  <Eye aria-hidden="true" />
                  View report
                </Link>
              </Button>
            </article>
          );
        })}
      </div>

      <div className="tt-card hidden overflow-hidden md:block">
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
    </div>
  );
}
