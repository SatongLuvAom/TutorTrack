import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProgressReport } from "@/services/progress.service";
import { formatProgressDate } from "./progress-utils";

type ProgressReportHeaderProps = {
  report: ProgressReport;
  backHref: string;
  backLabel: string;
  eyebrow: string;
  title?: string;
};

export function ProgressReportHeader({
  report,
  backHref,
  backLabel,
  eyebrow,
  title,
}: ProgressReportHeaderProps) {
  return (
    <section className="border-b border-border bg-card/60">
      <div className="tt-shell py-8">
        <Button asChild size="sm" variant="ghost">
          <Link href={backHref}>
            <ArrowLeft aria-hidden="true" />
            {backLabel}
          </Link>
        </Button>
        <p className="tt-kicker mt-5">{eyebrow}</p>
        <h1 className="tt-heading mt-2 text-3xl">
          {title ?? report.courseTitle}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          {report.subjectName} with {report.tutorName}. Generated{" "}
          {formatProgressDate(report.generatedAt)}.
        </p>
      </div>
    </section>
  );
}
