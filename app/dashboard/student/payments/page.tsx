import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentEmptyState } from "@/components/payments/payment-empty-state";
import { PaymentSummaryCards } from "@/components/payments/payment-summary-cards";
import { PaymentTable } from "@/components/payments/payment-table";
import { requireStudent } from "@/lib/guards";
import { getStudentPayments } from "@/services/payment.service";

export const dynamic = "force-dynamic";

type StudentPaymentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function StudentPaymentsPage({
  searchParams,
}: StudentPaymentsPageProps) {
  const user = await requireStudent();
  const params = searchParams ? await searchParams : {};
  const payments = await getStudentPayments(user.id);
  const created = firstValue(params.created);

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/student">
              <ArrowLeft aria-hidden="true" />
              Dashboard
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Student dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">My payments</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Manual payment records for your own enrollments. New records stay
            pending until an admin verifies them.
          </p>
        </div>
      </section>

      <section className="tt-shell space-y-6 py-8">
        {created ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            Payment submitted for admin review.
          </div>
        ) : null}

        {payments.length === 0 ? (
          <PaymentEmptyState
            actionHref="/dashboard/student/enrollments"
            actionLabel="Open enrollments"
            description="Create a payment from a pending or active enrollment."
            title="No payment records yet"
          />
        ) : (
          <>
            <PaymentSummaryCards payments={payments} />
            <PaymentTable payments={payments} showProof />
          </>
        )}
      </section>
    </main>
  );
}
