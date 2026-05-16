import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  helper?: string;
  tone?: "sky" | "emerald" | "amber" | "rose" | "slate";
  className?: string;
};

const toneClasses = {
  sky: "bg-sky-50 text-sky-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
  slate: "bg-slate-100 text-slate-700",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = "sky",
  className,
}: StatCardProps) {
  return (
    <article className={cn("tt-card p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div className={cn("rounded-lg p-3", toneClasses[tone])}>
          <Icon aria-hidden="true" className="size-5" />
        </div>
      </div>
      {helper ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{helper}</p>
      ) : null}
    </article>
  );
}
