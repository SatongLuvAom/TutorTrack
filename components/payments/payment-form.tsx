import { PaymentMethod } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/services/marketplace-utils";
import type { PaymentEnrollmentSummary } from "@/services/payment.service";

type PaymentAction = (formData: FormData) => Promise<void>;

type PaymentFormProps = {
  action: PaymentAction;
  enrollment: PaymentEnrollmentSummary;
  error?: string;
  studentId?: string;
};

export function PaymentForm({
  action,
  enrollment,
  error,
  studentId,
}: PaymentFormProps) {
  return (
    <form action={action} className="tt-card space-y-5 p-5">
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Course</p>
          <p className="mt-1 font-semibold">{enrollment.course.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tutor: {enrollment.course.tutor.name}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Student</p>
          <p className="mt-1 font-semibold">
            {enrollment.student.displayName ?? enrollment.student.name}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Enrollment: {enrollment.status}
          </p>
        </div>
      </div>

      <input name="enrollmentId" type="hidden" value={enrollment.id} />
      {studentId ? <input name="studentId" type="hidden" value={studentId} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Amount (THB)
          <input
            className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            defaultValue={(enrollment.amountDueCents / 100).toFixed(2)}
            min="0.01"
            name="amount"
            required
            step="0.01"
            type="number"
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            Course price: {formatPrice(enrollment.amountDueCents)}
          </span>
        </label>

        <label className="block text-sm font-medium">
          Method
          <select
            className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            defaultValue={PaymentMethod.MANUAL_TRANSFER}
            name="method"
            required
          >
            <option value={PaymentMethod.MANUAL_TRANSFER}>Manual transfer</option>
            <option value={PaymentMethod.PROMPTPAY}>PromptPay manual record</option>
            <option disabled value={PaymentMethod.CARD}>
              Card not available in MVP
            </option>
          </select>
        </label>
      </div>

      <label className="block text-sm font-medium">
        Proof URL
        <input
          className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          name="proofUrl"
          placeholder="https://..."
          type="url"
        />
      </label>

      <label className="block text-sm font-medium">
        Payment note
        <textarea
          className="mt-2 min-h-28 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          name="note"
          placeholder="Transfer date, bank, reference, or other note"
        />
        <span className="mt-1 block text-xs text-muted-foreground">
          Provide proof URL or note. Admin will verify manually.
        </span>
      </label>

      <Button type="submit">Submit pending payment</Button>
    </form>
  );
}
