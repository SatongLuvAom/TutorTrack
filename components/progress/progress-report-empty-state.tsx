import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-secondary text-primary">
        <FileText aria-hidden="true" className="size-6" />
      </div>
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
