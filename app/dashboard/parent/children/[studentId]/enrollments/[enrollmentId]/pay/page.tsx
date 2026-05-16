import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PromptPayPaymentPanel } from "@/components/payments/promptpay-payment-panel";
import { Button } from "@/components/ui/button";
import { requireParent, requirePermission } from "@/lib/guards";
import { canViewParentChildPayments } from "@/lib/permissions";
import { getPaymentEnrollmentForParentChild } from "@/services/payment.service";

export const dynamic = "force-dynamic";

type ParentPromptPayPageProps = {
  params: Promise<{ studentId: string; enrollmentId: string }>;
};

export default async function ParentPromptPayPage({
  params,
}: ParentPromptPayPageProps) {
  const user = await requireParent();
  const { studentId, enrollmentId } = await params;
  await requirePermission(canViewParentChildPayments(user, studentId));

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
          <p className="tt-kicker mt-5">PromptPay child payment</p>
          <h1 className="tt-heading mt-2 text-3xl">Pay online with PromptPay</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            This creates a real Omise/Opn PromptPay charge for an active linked
            child. Enrollment is activated only after provider confirmation.
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
        <PromptPayPaymentPanel enrollment={enrollment} />
      </section>
    </main>
  );
}
