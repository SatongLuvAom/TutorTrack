import { PaymentStatus } from "@/lib/generated/prisma/enums";
import { formatPrice } from "@/services/marketplace-utils";
import type { PaymentListItem } from "@/services/payment.service";

type PaymentSummaryCardsProps = {
  payments: PaymentListItem[];
};

export function PaymentSummaryCards({ payments }: PaymentSummaryCardsProps) {
  const totalPending = payments
    .filter((payment) => payment.status === PaymentStatus.PENDING)
    .reduce((sum, payment) => sum + payment.amountCents, 0);
  const totalPaid = payments
    .filter((payment) => payment.status === PaymentStatus.PAID)
    .reduce((sum, payment) => sum + payment.amountCents, 0);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="tt-card p-5">
        <p className="text-sm font-medium text-muted-foreground">Records</p>
        <p className="mt-2 text-2xl font-semibold">{payments.length}</p>
      </div>
      <div className="tt-card p-5">
        <p className="text-sm font-medium text-muted-foreground">Pending</p>
        <p className="mt-2 text-2xl font-semibold text-amber-700">
          {formatPrice(totalPending)}
        </p>
      </div>
      <div className="tt-card p-5">
        <p className="text-sm font-medium text-muted-foreground">Paid</p>
        <p className="mt-2 text-2xl font-semibold text-emerald-700">
          {formatPrice(totalPaid)}
        </p>
      </div>
    </div>
  );
}
