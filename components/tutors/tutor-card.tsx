import Link from "next/link";
import { ArrowRight, BookOpen, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/marketplace/status-badge";
import { formatPrice, formatRating } from "@/services/marketplace-utils";
import type { PublicTutorCard } from "@/types/marketplace";

type TutorCardProps = {
  tutor: PublicTutorCard;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function TutorCard({ tutor }: TutorCardProps) {
  return (
    <article className="tt-card tt-card-hover flex h-full flex-col p-5">
      <div className="flex items-start gap-4">
        {tutor.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={tutor.name}
            className="size-14 rounded-lg object-cover"
            src={tutor.imageUrl}
          />
        ) : (
          <div className="flex size-14 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            {initials(tutor.name)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="tt-heading truncate text-lg">{tutor.name}</h2>
          <p className="mt-1 line-clamp-2 text-sm leading-7 text-muted-foreground">
            {tutor.headline ?? "TutorTrack approved tutor"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tutor.subjects.slice(0, 3).map((subject) => (
          <StatusBadge key={subject.slug} tone="accent">
            {subject.name}
          </StatusBadge>
        ))}
        <StatusBadge tone="neutral">{tutor.levelLabel}</StatusBadge>
      </div>

      <p className="mt-4 line-clamp-2 rounded-lg bg-secondary/55 p-3 text-sm leading-7 text-muted-foreground">
        {tutor.teachingStyleSummary}
      </p>

      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-lg bg-background/70 p-3">
          <p className="text-muted-foreground">ประสบการณ์</p>
          <p className="mt-1 font-semibold">
            {tutor.experienceYears ? `${tutor.experienceYears} ปี` : "ไม่ระบุ"}
          </p>
        </div>
        <div className="rounded-lg bg-background/70 p-3">
          <p className="text-muted-foreground">ราคาเริ่มต้น</p>
          <p className="mt-1 font-semibold text-primary">
            {formatPrice(tutor.hourlyRateCents)} / ชม.
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-2 text-sm">
          <Star aria-hidden="true" className="size-4 fill-amber-400 text-amber-400" />
          <span className="font-medium">{formatRating(tutor.rating)}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <BookOpen aria-hidden="true" className="size-4" />
          {tutor.publishedCourseCount} คอร์ส
        </div>
      </div>

      <Button asChild className="mt-5 w-full" variant="outline">
        <Link href={`/tutors/${tutor.id}`}>
          ดูโปรไฟล์
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </article>
  );
}
