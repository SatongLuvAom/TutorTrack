import { PaymentProvider, PaymentStatus } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import type { PaymentListItem } from "@/services/payment.service";
import {
  markPaymentFailedAction,
  markPaymentPaidAction,
  markPaymentRefundedAction,
} from "@/app/dashboard/admin/payments/actions";

type AdminPaymentActionsProps = {
  payment: PaymentListItem;
  returnTo: string;
};

function StatusActionForm({
  action,
  label,
  paymentId,
  returnTo,
  variant = "outline",
}: {
  action: (formData: FormData) => Promise<void>;
  label: string;
  paymentId: string;
  returnTo: string;
  variant?: "default" | "outline" | "destructive";
}) {
  return (
    <form action={action}>
      <input name="paymentId" type="hidden" value={paymentId} />
      <input name="returnTo" type="hidden" value={returnTo} />
      <Button size="sm" type="submit" variant={variant}>
        {label}
      </Button>
    </form>
  );
}

export function AdminPaymentActions({
  payment,
  returnTo,
}: AdminPaymentActionsProps) {
  if (payment.provider === PaymentProvider.OMISE) {
    return (
      <p className="text-sm leading-7 text-muted-foreground">
        Gateway payments are confirmed by Omise webhook. Manual admin override
        is disabled for this payment.
      </p>
    );
  }

  if (payment.status === PaymentStatus.PENDING) {
    return (
      <div className="flex flex-wrap gap-2">
        <StatusActionForm
          action={markPaymentPaidAction}
          label="Mark paid"
          paymentId={payment.id}
          returnTo={returnTo}
        />
        <StatusActionForm
          action={markPaymentFailedAction}
          label="Mark failed"
          paymentId={payment.id}
          returnTo={returnTo}
          variant="destructive"
        />
      </div>
    );
  }

  if (payment.status === PaymentStatus.PAID) {
    return (
      <StatusActionForm
        action={markPaymentRefundedAction}
        label="Mark refunded"
        paymentId={payment.id}
        returnTo={returnTo}
      />
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      {payment.status === PaymentStatus.FAILED
        ? "Failed payments are final in this MVP."
        : "Refunded payments are final in this MVP."}
    </p>
  );
}
