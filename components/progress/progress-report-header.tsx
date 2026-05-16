import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProgressReport } from "@/services/progress.service";
import { ProgressScoreBar } from "./progress-score-bar";
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
    <section className="border-b border-border bg-gradient-to-br from-sky-50 via-white to-emerald-50">
      <div className="tt-shell py-8">
        <Button asChild size="sm" variant="ghost">
          <Link href={backHref}>
            <ArrowLeft aria-hidden="true" />
            {backLabel}
          </Link>
        </Button>
        <p className="tt-kicker mt-5">{eyebrow}</p>
        <div className="mt-2 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div>
            <h1 className="tt-heading text-3xl">{title ?? report.courseTitle}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
              {report.subjectName} with {report.tutorName}. Generated{" "}
              {formatProgressDate(report.generatedAt)}.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-white/80 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <BarChart3 aria-hidden="true" className="size-5 text-primary" />
              <span className="text-sm font-semibold">Overall score</span>
            </div>
            <p className="mt-2 text-3xl font-semibold">
              {Math.round(report.progressScore)} / 100
            </p>
            <ProgressScoreBar
              className="mt-3"
              completenessScore={report.dataCompleteness.completenessScore}
              score={report.progressScore}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
