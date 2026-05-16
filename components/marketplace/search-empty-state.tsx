import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyStateIllustration } from "@/components/visual/empty-state-illustration";

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
      <EmptyStateIllustration className="mx-auto h-auto w-full max-w-64" />
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
