import {
  BookOpenCheck,
  CalendarCheck,
  ClipboardCheck,
  MessageSquareText,
  Sparkles,
  Target,
} from "lucide-react";
import type { ProgressReport } from "@/services/progress.service";
import { ProgressMetricCard } from "./progress-metric-card";

type ProgressMetricGridProps = {
  report: ProgressReport;
};

export function ProgressMetricGrid({ report }: ProgressMetricGridProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <ProgressMetricCard
        helperText={`${report.attendance.totalAttendanceRecords} attendance records`}
        icon={CalendarCheck}
        label="Attendance Rate"
        value={report.attendanceRate}
      />
      <ProgressMetricCard
        helperText={`${report.homework.submittedAssignments}/${report.homework.totalAssignments} submitted`}
        icon={BookOpenCheck}
        label="Homework Completion"
        value={report.homeworkCompletionRate}
      />
      <ProgressMetricCard
        helperText={`${report.assessments.scoredAssessments}/${report.assessments.totalAssessments} scored`}
        icon={ClipboardCheck}
        label="Assessment Average"
        value={report.assessmentAverage}
      />
      <ProgressMetricCard
        helperText={`${report.skillMatrix.length} tracked skills`}
        icon={Target}
        label="Skill Average"
        value={report.skillAverage}
      />
      <ProgressMetricCard
        helperText="Deterministic placeholder from latest tutor note."
        icon={MessageSquareText}
        label="Behavior / Tutor Note"
        value={report.behaviorScore}
      />
      <ProgressMetricCard
        helperText="Attendance, homework, assessments, and skill data."
        icon={Sparkles}
        label="Data Completeness"
        value={report.dataCompleteness.completenessScore}
      />
    </section>
  );
}
