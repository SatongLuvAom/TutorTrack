import { PaymentMethod } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

const methodStyles: Record<PaymentMethod, string> = {
  [PaymentMethod.MANUAL_TRANSFER]:
    "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200",
  [PaymentMethod.PROMPTPAY]:
    "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200",
  [PaymentMethod.CARD]:
    "border-muted bg-muted text-muted-foreground",
};

export function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
        methodStyles[method],
      )}
    >
      {method}
    </span>
  );
}
