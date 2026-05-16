import { PaymentStatus } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

const statusStyles: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
  [PaymentStatus.PAID]:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
  [PaymentStatus.FAILED]:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
  [PaymentStatus.REFUNDED]:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}
