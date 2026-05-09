import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ProgressDataCompleteness } from "@/services/progress.service";
import { ProgressScoreBar } from "./progress-score-bar";
import {
  formatMetricPercent,
  getMissingDataLabels,
} from "./progress-utils";

type DataCompletenessCardProps = {
  data: ProgressDataCompleteness;
};

export function DataCompletenessCard({ data }: DataCompletenessCardProps) {
  const missing = getMissingDataLabels(data);

  return (
    <section className="tt-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="tt-kicker">Data completeness</p>
          <h2 className="tt-heading mt-1 text-xl">
            {formatMetricPercent(data.completenessScore)}
          </h2>
        </div>
        {missing.length === 0 ? (
          <CheckCircle2 aria-hidden="true" className="size-5 text-emerald-600" />
        ) : (
          <AlertCircle aria-hidden="true" className="size-5 text-amber-600" />
        )}
      </div>
      <ProgressScoreBar className="mt-4" score={data.completenessScore} />
      {data.completenessScore < 75 ? (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          ข้อมูลยังไม่ครบพอสำหรับสรุปผลอย่างมั่นใจ
        </p>
      ) : null}
      <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        {missing.length === 0 ? (
          <span>All required learning data is available.</span>
        ) : (
          missing.map((item) => (
            <span key={item} className="rounded-lg bg-muted px-3 py-2">
              Missing: {item}
            </span>
          ))
        )}
      </div>
    </section>
  );
}
