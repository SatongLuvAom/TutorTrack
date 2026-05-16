import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentForm } from "@/components/payments/payment-form";
import { requireParent, requirePermission } from "@/lib/guards";
import { canViewParentChildPayments } from "@/lib/permissions";
import { getPaymentEnrollmentForParentChild } from "@/services/payment.service";
import { createParentChildPaymentAction } from "@/app/dashboard/parent/children/[studentId]/payments/actions";

export const dynamic = "force-dynamic";

type ParentCreatePaymentPageProps = {
  params: Promise<{ studentId: string; enrollmentId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ParentCreatePaymentPage({
  params,
  searchParams,
}: ParentCreatePaymentPageProps) {
  const user = await requireParent();
  const { studentId, enrollmentId } = await params;
  await requirePermission(canViewParentChildPayments(user, studentId));
  const query = searchParams ? await searchParams : {};
  const enrollment = await getPaymentEnrollmentForParentChild(
    user.id,
    studentId,
    enrollmentId,
  );

  if (!enrollment) {
    notFound();
  }

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href={`/dashboard/parent/children/${studentId}/enrollments`}>
              <ArrowLeft aria-hidden="true" />
              Child enrollments
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Manual child payment</p>
          <h1 className="tt-heading mt-2 text-3xl">Submit payment record</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            This creates a pending manual payment record for an active linked
            child. Admin verification is required.
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
        <PaymentForm
          action={createParentChildPaymentAction}
          enrollment={enrollment}
          error={firstValue(query.error)}
          studentId={studentId}
        />
      </section>
    </main>
  );
}
