"use client";

import { useState } from "react";
import { Loader2, QrCode, RefreshCw } from "lucide-react";
import { PaymentStatus } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { PaymentStatusBadge } from "@/components/payments/payment-status-badge";
import { formatPrice } from "@/services/marketplace-utils";
import type { PaymentEnrollmentSummary } from "@/services/payment.service";

type PromptPayCreateResponse = {
  data?: {
    paymentId: string;
    status: PaymentStatus;
    providerStatus: string | null;
    providerChargeId: string;
    providerSourceId: string | null;
    authorizeUri: string | null;
    qrCodeImageUrl: string | null;
    expiresAt: string | null;
  };
  error?: string;
};

type PaymentStatusResponse = {
  data?: {
    status: PaymentStatus;
    providerStatus: string | null;
    paidAt: string | null;
    failedAt: string | null;
    expiresAt: string | null;
  };
  error?: string;
};

type PromptPayPaymentPanelProps = {
  enrollment: PaymentEnrollmentSummary;
};

function formatDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PromptPayPaymentPanel({
  enrollment,
}: PromptPayPaymentPanelProps) {
  const [payment, setPayment] =
    useState<PromptPayCreateResponse["data"]>(undefined);
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [providerStatus, setProviderStatus] = useState<string | null>(null);
  const [paidAt, setPaidAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function createPayment() {
    setError(null);
    setIsCreating(true);

    try {
      const response = await fetch("/api/payments/omise/promptpay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId: enrollment.id }),
      });
      const body = (await response.json()) as PromptPayCreateResponse;

      if (!response.ok || !body.data) {
        setError(body.error ?? "Unable to create PromptPay payment.");
        return;
      }

      setPayment(body.data);
      setStatus(body.data.status);
      setProviderStatus(body.data.providerStatus);
    } finally {
      setIsCreating(false);
    }
  }

  async function refreshStatus() {
    if (!payment) {
      return;
    }

    setError(null);
    setIsRefreshing(true);

    try {
      const response = await fetch(`/api/payments/${payment.paymentId}/status`);
      const body = (await response.json()) as PaymentStatusResponse;

      if (!response.ok || !body.data) {
        setError(body.error ?? "Unable to refresh payment status.");
        return;
      }

      setStatus(body.data.status);
      setProviderStatus(body.data.providerStatus);
      setPaidAt(body.data.paidAt);
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="tt-card space-y-5 p-5">
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
          <p className="text-sm font-medium text-muted-foreground">Amount</p>
          <p className="mt-1 font-semibold">
            {formatPrice(enrollment.amountDueCents)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Enrollment: {enrollment.status}
          </p>
        </div>
      </div>

      {!payment ? (
        <Button disabled={isCreating} onClick={createPayment} type="button">
          {isCreating ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <QrCode aria-hidden="true" />
          )}
          Create PromptPay QR
        </Button>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <div className="rounded-lg border border-border bg-white p-4">
            {payment.qrCodeImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt="PromptPay QR code"
                className="mx-auto aspect-square w-full max-w-64 object-contain"
                src={payment.qrCodeImageUrl}
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-secondary text-sm text-muted-foreground">
                QR image not returned by provider.
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {status ? <PaymentStatusBadge status={status} /> : null}
              {providerStatus ? (
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                  Omise: {providerStatus}
                </span>
              ) : null}
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="font-medium text-muted-foreground">Charge ID</p>
                <p className="mt-1 break-all">{payment.providerChargeId}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Expires</p>
                <p className="mt-1">{formatDateTime(payment.expiresAt)}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Paid</p>
                <p className="mt-1">{formatDateTime(paidAt)}</p>
              </div>
            </div>
            <p className="text-sm leading-7 text-muted-foreground">
              Scan this QR with your Thai mobile banking app. TutorTrack will
              activate the enrollment only after Omise confirms successful
              payment through webhook.
            </p>
            <Button
              disabled={isRefreshing}
              onClick={refreshStatus}
              type="button"
              variant="outline"
            >
              {isRefreshing ? (
                <Loader2 aria-hidden="true" className="animate-spin" />
              ) : (
                <RefreshCw aria-hidden="true" />
              )}
              Refresh status
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
