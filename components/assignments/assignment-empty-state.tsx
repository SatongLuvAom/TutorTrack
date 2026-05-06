import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

type AssignmentEmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function AssignmentEmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: AssignmentEmptyStateProps) {
  return (
    <section className="tt-card border-dashed p-8 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-secondary">
        <ClipboardList aria-hidden="true" className="size-6 text-primary" />
      </div>
      <h2 className="tt-heading mt-4 text-xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-muted-foreground">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Button asChild className="mt-5">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </section>
  );
}
