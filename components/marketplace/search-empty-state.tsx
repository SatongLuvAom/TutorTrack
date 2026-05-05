import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

type SearchEmptyStateProps = {
  title: string;
  description: string;
  resetHref: string;
};

export function SearchEmptyState({
  title,
  description,
  resetHref,
}: SearchEmptyStateProps) {
  return (
    <div className="tt-card border-dashed p-8 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-secondary text-primary">
        <SearchX aria-hidden="true" className="size-5" />
      </div>
      <h2 className="tt-heading mt-4 text-xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-muted-foreground">
        {description}
      </p>
      <Button asChild className="mt-5" variant="outline">
        <Link href={resetHref}>ล้างตัวกรอง</Link>
      </Button>
    </div>
  );
}
