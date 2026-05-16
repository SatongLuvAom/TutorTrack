import Link from "next/link";
import { WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";

type PaymentEmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function PaymentEmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: PaymentEmptyStateProps) {
  return (
    <div className="tt-card flex flex-col items-center justify-center p-8 text-center">
      <WalletCards aria-hidden="true" className="size-8 text-primary" />
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Button asChild className="mt-5" variant="outline">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
