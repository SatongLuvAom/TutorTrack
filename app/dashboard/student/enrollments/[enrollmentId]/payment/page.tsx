import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentForm } from "@/components/payments/payment-form";
import { requireStudent } from "@/lib/guards";
import { getPaymentEnrollmentForStudent } from "@/services/payment.service";
import { createStudentPaymentAction } from "@/app/dashboard/student/payments/actions";

export const dynamic = "force-dynamic";

type StudentCreatePaymentPageProps = {
  params: Promise<{ enrollmentId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function StudentCreatePaymentPage({
  params,
  searchParams,
}: StudentCreatePaymentPageProps) {
  const user = await requireStudent();
  const { enrollmentId } = await params;
  const query = searchParams ? await searchParams : {};
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
          <p className="tt-kicker mt-5">Manual payment</p>
          <h1 className="tt-heading mt-2 text-3xl">Submit payment record</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            This does not charge a card. It records your manual transfer or
            PromptPay payment for admin verification.
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
        <PaymentForm
          action={createStudentPaymentAction}
          enrollment={enrollment}
          error={firstValue(query.error)}
        />
      </section>
    </main>
  );
}
