import { Lightbulb } from "lucide-react";
import { toParentProgressMessage } from "./progress-utils";

type RecommendationCardProps = {
  recommendations: string[];
  parentFriendly?: boolean;
};

export function RecommendationCard({
  recommendations,
  parentFriendly = false,
}: RecommendationCardProps) {
  return (
    <section className="tt-card p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-accent p-2 text-accent-foreground">
          <Lightbulb aria-hidden="true" className="size-5" />
        </div>
        <div>
          <p className="tt-kicker">Recommended next steps</p>
          <h2 className="tt-heading mt-1 text-xl">Rule-based guidance</h2>
        </div>
      </div>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
        {recommendations.map((item) => (
          <li key={item} className="rounded-lg bg-muted px-3 py-2">
            {parentFriendly ? toParentProgressMessage(item) : item}
          </li>
        ))}
      </ul>
    </section>
  );
}
