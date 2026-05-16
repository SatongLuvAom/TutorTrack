import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyStateIllustration } from "@/components/visual/empty-state-illustration";

type ProgressReportEmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function ProgressReportEmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: ProgressReportEmptyStateProps) {
  return (
    <section className="tt-card p-8 text-center">
      <EmptyStateIllustration className="mx-auto h-auto w-full max-w-64" />
      <h2 className="tt-heading mt-4 text-xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Button asChild className="mt-5" variant="outline">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </section>
  );
}
