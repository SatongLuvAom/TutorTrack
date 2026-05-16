import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentEmptyState } from "@/components/payments/payment-empty-state";
import { PaymentSummaryCards } from "@/components/payments/payment-summary-cards";
import { PaymentTable } from "@/components/payments/payment-table";
import { requireParent, requirePermission } from "@/lib/guards";
import { canViewParentChildPayments } from "@/lib/permissions";
import { getParentChildSummary } from "@/services/enrollment.service";
import { getParentChildPayments } from "@/services/payment.service";

export const dynamic = "force-dynamic";

type ParentChildPaymentsPageProps = {
  params: Promise<{ studentId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ParentChildPaymentsPage({
  params,
  searchParams,
}: ParentChildPaymentsPageProps) {
  const user = await requireParent();
  const { studentId } = await params;
  await requirePermission(canViewParentChildPayments(user, studentId));
  const query = searchParams ? await searchParams : {};
  const [child, payments] = await Promise.all([
    getParentChildSummary(user.id, studentId),
    getParentChildPayments(user.id, studentId),
  ]);

  if (!child) {
    notFound();
  }

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/parent">
              <ArrowLeft aria-hidden="true" />
              Parent dashboard
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Parent dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">
            Payments for {child.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            View manual payment records for this active linked child only.
          </p>
        </div>
      </section>

      <section className="tt-shell space-y-6 py-8">
        {firstValue(query.created) ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            Payment submitted for admin review.
          </div>
        ) : null}

        {payments.length === 0 ? (
          <PaymentEmptyState
            actionHref={`/dashboard/parent/children/${studentId}/enrollments`}
            actionLabel="Open child enrollments"
            description="Create a payment from a pending or active child enrollment."
            title="No payment records yet"
          />
        ) : (
          <>
            <PaymentSummaryCards payments={payments} />
            <PaymentTable payments={payments} />
          </>
        )}
      </section>
    </main>
  );
}
