import { EnrollmentStatus } from "@/lib/generated/prisma/enums";

type EnrollmentStatusBadgeProps = {
  status: EnrollmentStatus;
};

const statusStyles: Record<EnrollmentStatus, string> = {
  [EnrollmentStatus.PENDING]: "border-amber-200 bg-amber-50 text-amber-700",
  [EnrollmentStatus.ACTIVE]: "border-emerald-200 bg-emerald-50 text-emerald-700",
  [EnrollmentStatus.COMPLETED]: "border-sky-200 bg-sky-50 text-sky-700",
  [EnrollmentStatus.CANCELLED]: "border-slate-200 bg-slate-50 text-slate-600",
};

const statusLabels: Record<EnrollmentStatus, string> = {
  [EnrollmentStatus.PENDING]: "รออนุมัติ",
  [EnrollmentStatus.ACTIVE]: "กำลังเรียน",
  [EnrollmentStatus.COMPLETED]: "เรียนจบแล้ว",
  [EnrollmentStatus.CANCELLED]: "ยกเลิกแล้ว",
};

export function EnrollmentStatusBadge({ status }: EnrollmentStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
