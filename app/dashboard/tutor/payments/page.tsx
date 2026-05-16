import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { PaymentStatus } from "@/lib/generated/prisma/enums";
import { PaymentEmptyState } from "@/components/payments/payment-empty-state";
import { PaymentTable } from "@/components/payments/payment-table";
import { Button } from "@/components/ui/button";
import { requireTutor } from "@/lib/guards";
import {
  getTutorPaymentSummaries,
  parsePaymentFilters,
} from "@/services/payment.service";

export const dynamic = "force-dynamic";

type TutorPaymentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TutorPaymentsPage({
  searchParams,
}: TutorPaymentsPageProps) {
  const user = await requireTutor();
  const params = searchParams ? await searchParams : {};
  const filters = parsePaymentFilters(params);
  const payments = await getTutorPaymentSummaries(user.id, filters);

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/tutor">
              <ArrowLeft aria-hidden="true" />
              Dashboard
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Tutor dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">Payment status</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Limited payment status for your own course enrollments. Proof URLs
            and payment notes are visible only to admins and authorized payers.
          </p>
        </div>
      </section>

      <section className="tt-shell space-y-6 py-8">
        <form
          action="/dashboard/tutor/payments"
          className="tt-filter-panel"
          method="get"
        >
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="space-y-2">
              <label className="tt-label" htmlFor="search">
                Search
              </label>
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary"
                />
                <input
                  className="tt-input pl-9"
                  defaultValue={filters.search}
                  id="search"
                  name="search"
                  placeholder="Course, student, or email"
                  type="search"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="tt-label" htmlFor="status">
                Status
              </label>
              <select
                className="tt-input"
                defaultValue={filters.status ?? ""}
                id="status"
                name="status"
              >
                <option value="">All statuses</option>
                <option value={PaymentStatus.PENDING}>Pending</option>
                <option value={PaymentStatus.PAID}>Paid</option>
                <option value={PaymentStatus.FAILED}>Failed</option>
                <option value={PaymentStatus.REFUNDED}>Refunded</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button asChild type="button" variant="outline">
              <Link href="/dashboard/tutor/payments">Reset</Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        {payments.length === 0 ? (
          <PaymentEmptyState
            description="No payment records are linked to your course enrollments yet."
            title="No payment status records"
          />
        ) : (
          <PaymentTable payments={payments} />
        )}
      </section>
    </main>
  );
}
