import type { LucideIcon } from "lucide-react";

type VisualStepCardProps = {
  icon: LucideIcon;
  step: string;
  title: string;
  description: string;
};

export function VisualStepCard({
  icon: Icon,
  step,
  title,
  description,
}: VisualStepCardProps) {
  return (
    <article className="tt-card tt-card-hover p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Icon aria-hidden="true" className="size-5" />
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          {step}
        </span>
      </div>
      <h3 className="tt-heading mt-4 text-lg">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </article>
  );
}
