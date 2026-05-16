import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyStateIllustration } from "@/components/visual/empty-state-illustration";

type EnrollmentEmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EnrollmentEmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: EnrollmentEmptyStateProps) {
  return (
    <section className="tt-card flex flex-col items-center p-8 text-center">
      <EmptyStateIllustration className="h-auto w-full max-w-64" />
      <h2 className="tt-heading mt-4 text-xl">{title}</h2>
      <p className="mt-2 max-w-lg text-sm leading-7 text-muted-foreground">
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
