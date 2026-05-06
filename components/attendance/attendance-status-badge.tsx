import { AttendanceStatus } from "@/lib/generated/prisma/enums";

type AttendanceStatusBadgeProps = {
  status: AttendanceStatus;
};

const badgeStyles: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  [AttendanceStatus.LATE]:
    "border-amber-200 bg-amber-50 text-amber-700",
  [AttendanceStatus.EXCUSED]:
    "border-sky-200 bg-sky-50 text-sky-700",
  [AttendanceStatus.ABSENT]:
    "border-rose-200 bg-rose-50 text-rose-700",
};

export function AttendanceStatusBadge({ status }: AttendanceStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${badgeStyles[status]}`}
    >
      {status}
    </span>
  );
}
