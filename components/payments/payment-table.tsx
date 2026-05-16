import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PaymentMethodBadge } from "@/components/payments/payment-method-badge";
import { PaymentStatusBadge } from "@/components/payments/payment-status-badge";
import { formatPrice } from "@/services/marketplace-utils";
import type { PaymentListItem, TutorPaymentSummary } from "@/services/payment.service";

type PaymentTableProps = {
  payments: Array<PaymentListItem | TutorPaymentSummary>;
  showPayer?: boolean;
  showProof?: boolean;
};

function formatDate(value: Date | null): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
  }).format(value);
}

function hasPayer(
  payment: PaymentListItem | TutorPaymentSummary,
): payment is PaymentListItem {
  return "payer" in payment;
}

export function PaymentTable({
  payments,
  showPayer = false,
  showProof = false,
}: PaymentTableProps) {
  return (
    <div className="tt-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-secondary/65 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Course</th>
              <th className="px-4 py-3 font-medium">Student</th>
              {showPayer ? <th className="px-4 py-3 font-medium">Payer</th> : null}
              <th className="px-4 py-3 font-medium">Enrollment</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium">Provider</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {showProof ? <th className="px-4 py-3 font-medium">Proof</th> : null}
              <th className="px-4 py-3 font-medium">Paid</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.map((payment) => (
              <tr
                className="align-top transition-colors hover:bg-secondary/35"
                key={payment.id}
              >
                <td className="px-4 py-4">
                  <p className="font-semibold">{payment.course.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tutor: {payment.course.tutor.name}
                  </p>
                </td>
                <td className="px-4 py-4">
                  {payment.student ? (
                    <>
                      <p className="font-medium">
                        {payment.student.displayName ?? payment.student.name}
                      </p>
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {payment.student.email}
                      </p>
                    </>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                {showPayer ? (
                  <td className="px-4 py-4">
                    {hasPayer(payment) ? (
                      <>
                        <p className="font-medium">{payment.payer.name}</p>
                        <p className="mt-1 break-all text-xs text-muted-foreground">
                          {payment.payer.email}
                        </p>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Hidden</span>
                    )}
                  </td>
                ) : null}
                <td className="px-4 py-4">{payment.enrollmentStatus ?? "-"}</td>
                <td className="px-4 py-4">{formatPrice(payment.amountCents)}</td>
                <td className="px-4 py-4">
                  <PaymentMethodBadge method={payment.method} />
                </td>
                <td className="px-4 py-4">{payment.provider}</td>
                <td className="px-4 py-4">
                  <PaymentStatusBadge status={payment.status} />
                </td>
                {showProof ? (
                  <td className="px-4 py-4">
                    {"proofUrl" in payment && payment.proofUrl ? (
                      <Link
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        href={payment.proofUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        View <ExternalLink aria-hidden="true" className="size-3" />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                ) : null}
                <td className="px-4 py-4">{formatDate(payment.paidAt)}</td>
                <td className="px-4 py-4">{formatDate(payment.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
