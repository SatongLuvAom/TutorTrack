import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProgressReportErrorProps = {
  title?: string;
  description?: string;
  retryHref?: string;
};

export function ProgressReportError({
  title = "Progress report unavailable",
  description = "The report could not be loaded. Check permissions or try again.",
  retryHref,
}: ProgressReportErrorProps) {
  return (
    <section className="tt-card p-8 text-center">
      <AlertTriangle
        aria-hidden="true"
        className="mx-auto size-8 text-amber-600"
      />
      <h2 className="tt-heading mt-4 text-xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {retryHref ? (
        <Button asChild className="mt-5" variant="outline">
          <Link href={retryHref}>Back</Link>
        </Button>
      ) : null}
    </section>
  );
}
