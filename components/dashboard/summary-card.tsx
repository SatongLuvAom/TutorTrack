import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type SummaryCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  cta: string;
};

export function SummaryCard({
  icon: Icon,
  title,
  description,
  href,
  cta,
}: SummaryCardProps) {
  return (
    <article className="tt-card tt-card-hover flex h-full flex-col p-5">
      <div className="flex size-11 items-center justify-center rounded-lg bg-secondary text-primary">
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <h2 className="tt-heading mt-4 text-lg">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <Button asChild className="mt-5" variant="outline">
        <Link href={href}>
          {cta}
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </article>
  );
}
