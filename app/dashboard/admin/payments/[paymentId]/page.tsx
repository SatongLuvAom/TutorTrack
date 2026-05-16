import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminPaymentActions } from "@/components/payments/admin-payment-actions";
import { PaymentMethodBadge } from "@/components/payments/payment-method-badge";
import { PaymentStatusBadge } from "@/components/payments/payment-status-badge";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/guards";
import { formatPrice } from "@/services/marketplace-utils";
import { getAdminPaymentById } from "@/services/payment.service";

export const dynamic = "force-dynamic";

type AdminPaymentDetailPageProps = {
  params: Promise<{ paymentId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(value: Date | null): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPaymentDetailPage({
  params,
  searchParams,
}: AdminPaymentDetailPageProps) {
  await requireAdmin();
  const { paymentId } = await params;
  const query = searchParams ? await searchParams : {};
  const payment = await getAdminPaymentById(paymentId);

  if (!payment) {
    notFound();
  }

  const returnTo = `/dashboard/admin/payments/${payment.id}`;

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/admin/payments">
              <ArrowLeft aria-hidden="true" />
              Payments
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Admin payment detail</p>
          <h1 className="tt-heading mt-2 text-3xl">
            {formatPrice(payment.amountCents)}
          </h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <PaymentStatusBadge status={payment.status} />
            <PaymentMethodBadge method={payment.method} />
          </div>
        </div>
      </section>

      <section className="tt-shell grid gap-6 py-8 lg:grid-cols-[1fr_320px]">
        <div className="tt-card space-y-5 p-5">
          {firstValue(query.error) ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {firstValue(query.error)}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailBlock label="Payer" value={payment.payer.name}>
              {payment.payer.email}
            </DetailBlock>
            <DetailBlock
              label="Student"
              value={
                payment.student
                  ? payment.student.displayName ?? payment.student.name
                  : "-"
              }
            >
              {payment.student?.email ?? "No linked enrollment student"}
            </DetailBlock>
            <DetailBlock label="Course" value={payment.course.title}>
              Tutor: {payment.course.tutor.name}
            </DetailBlock>
            <DetailBlock
              label="Enrollment"
              value={payment.enrollmentStatus ?? "-"}
            >
              {payment.enrollmentId ?? "No linked enrollment"}
            </DetailBlock>
            <DetailBlock label="Created" value={formatDate(payment.createdAt)} />
            <DetailBlock label="Paid" value={formatDate(payment.paidAt)} />
            <DetailBlock label="Provider" value={payment.provider}>
              {payment.providerStatus ?? "No provider status"}
            </DetailBlock>
            <DetailBlock
              label="Provider charge"
              value={payment.providerChargeId ?? "-"}
            >
              Source: {payment.providerSourceId ?? "-"}
            </DetailBlock>
            <DetailBlock label="Expires" value={formatDate(payment.expiresAt)} />
            <DetailBlock
              label="Last webhook"
              value={formatDate(payment.lastWebhookAt)}
            >
              Event: {payment.webhookEventId ?? "-"}
            </DetailBlock>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Proof</p>
            {payment.proofUrl ? (
              <Link
                className="mt-2 inline-flex items-center gap-1 text-primary hover:underline"
                href={payment.proofUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                Open proof URL
                <ExternalLink aria-hidden="true" className="size-4" />
              </Link>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No proof URL.</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Note</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7">
              {payment.note || "No note provided."}
            </p>
          </div>
        </div>

        <aside className="tt-card h-fit space-y-4 p-5">
          <h2 className="text-lg font-semibold">Verification</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Marking a pending payment as paid sets `paidAt` and activates the
            linked enrollment when it is still pending.
          </p>
          <AdminPaymentActions payment={payment} returnTo={returnTo} />
        </aside>
      </section>
    </main>
  );
}

function DetailBlock({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: ReactNode;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
      {children ? (
        <p className="mt-1 break-all text-xs text-muted-foreground">
          {children}
        </p>
      ) : null}
    </div>
  );
}
