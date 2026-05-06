import { SessionStatus } from "@/lib/generated/prisma/enums";

type SessionStatusBadgeProps = {
  status: SessionStatus;
};

const badgeStyles: Record<SessionStatus, string> = {
  [SessionStatus.SCHEDULED]:
    "border-sky-200 bg-sky-50 text-sky-700",
  [SessionStatus.COMPLETED]:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  [SessionStatus.CANCELLED]:
    "border-slate-200 bg-slate-50 text-slate-700",
};

export function SessionStatusBadge({ status }: SessionStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${badgeStyles[status]}`}
    >
      {status}
    </span>
  );
}
