import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PromptPayPaymentPanel } from "@/components/payments/promptpay-payment-panel";
import { Button } from "@/components/ui/button";
import { requireStudent } from "@/lib/guards";
import { getPaymentEnrollmentForStudent } from "@/services/payment.service";

export const dynamic = "force-dynamic";

type StudentPromptPayPageProps = {
  params: Promise<{ enrollmentId: string }>;
};

export default async function StudentPromptPayPage({
  params,
}: StudentPromptPayPageProps) {
  const user = await requireStudent();
  const { enrollmentId } = await params;
  const enrollment = await getPaymentEnrollmentForStudent(user.id, enrollmentId);

  if (!enrollment) {
    notFound();
  }

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/student/enrollments">
              <ArrowLeft aria-hidden="true" />
              Enrollments
            </Link>
          </Button>
          <p className="tt-kicker mt-5">PromptPay QR</p>
          <h1 className="tt-heading mt-2 text-3xl">Pay online with PromptPay</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            This creates a real Omise/Opn PromptPay charge. Enrollment is
            activated only after provider webhook confirms successful payment.
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
        <PromptPayPaymentPanel enrollment={enrollment} />
      </section>
    </main>
  );
}
