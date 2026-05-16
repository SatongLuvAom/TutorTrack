import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { PaymentMethod, PaymentStatus } from "@/lib/generated/prisma/enums";
import { AdminPaymentTable } from "@/components/payments/admin-payment-table";
import { PaymentEmptyState } from "@/components/payments/payment-empty-state";
import { PaymentSummaryCards } from "@/components/payments/payment-summary-cards";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/guards";
import {
  getAdminPaymentFilterOptions,
  getAdminPayments,
  parsePaymentFilters,
} from "@/services/payment.service";

export const dynamic = "force-dynamic";

type AdminPaymentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function hasFilters(params: Record<string, string | string[] | undefined>) {
  return [
    "search",
    "status",
    "method",
    "studentId",
    "payerId",
    "courseId",
    "tutorId",
  ].some((key) => Boolean(firstValue(params[key])));
}

export default async function AdminPaymentsPage({
  searchParams,
}: AdminPaymentsPageProps) {
  await requireAdmin();
  const params = searchParams ? await searchParams : {};
  const filters = parsePaymentFilters(params);
  const [options, payments] = await Promise.all([
    getAdminPaymentFilterOptions(),
    getAdminPayments(filters),
  ]);
  const filtered = hasFilters(params);

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/admin">
              <ArrowLeft aria-hidden="true" />
              Dashboard
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Admin dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">Manual payments</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Review manual payment records and verify pending payments. No
            payment gateway is used in this MVP.
          </p>
        </div>
      </section>

      <section className="tt-shell space-y-6 py-8">
        <form
          action="/dashboard/admin/payments"
          className="tt-filter-panel"
          method="get"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
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
                  placeholder="Course, payer, student, or email"
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

            <div className="space-y-2">
              <label className="tt-label" htmlFor="method">
                Method
              </label>
              <select
                className="tt-input"
                defaultValue={filters.method ?? ""}
                id="method"
                name="method"
              >
                <option value="">All methods</option>
                <option value={PaymentMethod.MANUAL_TRANSFER}>Transfer</option>
                <option value={PaymentMethod.PROMPTPAY}>PromptPay</option>
                <option value={PaymentMethod.CARD}>Card records</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="tt-label" htmlFor="courseId">
                Course
              </label>
              <select
                className="tt-input"
                defaultValue={filters.courseId ?? ""}
                id="courseId"
                name="courseId"
              >
                <option value="">All courses</option>
                {options.courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="tt-label" htmlFor="tutorId">
                Tutor
              </label>
              <select
                className="tt-input"
                defaultValue={filters.tutorId ?? ""}
                id="tutorId"
                name="tutorId"
              >
                <option value="">All tutors</option>
                {options.tutors.map((tutor) => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="tt-label" htmlFor="studentId">
                Student
              </label>
              <select
                className="tt-input"
                defaultValue={filters.studentId ?? ""}
                id="studentId"
                name="studentId"
              >
                <option value="">All students</option>
                {options.students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="tt-label" htmlFor="payerId">
                Payer
              </label>
              <select
                className="tt-input"
                defaultValue={filters.payerId ?? ""}
                id="payerId"
                name="payerId"
              >
                <option value="">All payers</option>
                {options.payers.map((payer) => (
                  <option key={payer.id} value={payer.id}>
                    {payer.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button asChild type="button" variant="outline">
              <Link href="/dashboard/admin/payments">Reset</Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        {payments.length === 0 ? (
          <PaymentEmptyState
            actionHref={filtered ? "/dashboard/admin/payments" : undefined}
            actionLabel={filtered ? "Clear filters" : undefined}
            description={
              filtered
                ? "No payment matches the current filters."
                : "Payment records will appear after students or parents submit manual payments."
            }
            title={filtered ? "No matching payments" : "No payments yet"}
          />
        ) : (
          <>
            <PaymentSummaryCards payments={payments} />
            <AdminPaymentTable payments={payments} />
          </>
        )}
      </section>
    </main>
  );
}
