import { ClipboardCheck, Clock, UserCheck, UserX } from "lucide-react";
import type { AttendanceSummary } from "@/services/attendance.service";

type AttendanceSummaryCardsProps = {
  summary: AttendanceSummary;
};

export function AttendanceSummaryCards({ summary }: AttendanceSummaryCardsProps) {
  const items = [
    {
      label: "Attendance rate",
      value: `${summary.attendanceRate}%`,
      icon: ClipboardCheck,
    },
    {
      label: "Present",
      value: summary.present,
      icon: UserCheck,
    },
    {
      label: "Late",
      value: summary.late,
      icon: Clock,
    },
    {
      label: "Absent",
      value: summary.absent,
      icon: UserX,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div className="tt-card p-5" key={item.label}>
            <Icon aria-hidden="true" className="size-5 text-primary" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-semibold">{item.value}</p>
          </div>
        );
      })}
    </div>
  );
}
