import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Sparkles, Star, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/marketplace/status-badge";
import {
  getLocalImageOrFallback,
  TUTOR_PLACEHOLDER_IMAGE,
} from "@/components/visual/image-utils";
import { formatPrice, formatRating } from "@/services/marketplace-utils";
import type { PublicTutorCard } from "@/types/marketplace";

type TutorCardProps = {
  tutor: PublicTutorCard;
};

export function TutorCard({ tutor }: TutorCardProps) {
  const imageSrc = getLocalImageOrFallback(
    tutor.imageUrl,
    TUTOR_PLACEHOLDER_IMAGE,
  );

  return (
    <article className="tt-card tt-card-hover flex h-full flex-col overflow-hidden">
      <div className="relative">
        <Image
          alt={`รูปโปรไฟล์ของ ${tutor.name}`}
          className="aspect-[16/9] w-full object-cover"
          height={360}
          src={imageSrc}
          width={640}
        />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <StatusBadge tone="success">Approved</StatusBadge>
          <StatusBadge tone="neutral">{tutor.levelLabel}</StatusBadge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="min-w-0">
          <h2 className="tt-heading truncate text-lg">{tutor.name}</h2>
          <p className="mt-1 line-clamp-2 text-sm leading-7 text-muted-foreground">
            {tutor.headline ?? "TutorTrack approved tutor"}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {tutor.subjects.slice(0, 3).map((subject) => (
            <StatusBadge key={subject.slug} tone="accent">
              {subject.name}
            </StatusBadge>
          ))}
        </div>

        <p className="mt-4 line-clamp-2 rounded-lg bg-secondary/55 p-3 text-sm leading-7 text-muted-foreground">
          {tutor.teachingStyleSummary}
        </p>

        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-background/70 p-3">
            <p className="flex items-center gap-1 text-muted-foreground">
              <Timer aria-hidden="true" className="size-4" />
              ประสบการณ์
            </p>
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
            <Star
              aria-hidden="true"
              className="size-4 fill-amber-400 text-amber-400"
            />
            <span className="font-medium">{formatRating(tutor.rating)}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <BookOpen aria-hidden="true" className="size-4" />
            {tutor.publishedCourseCount} คอร์ส
          </div>
        </div>

        <StatusBadge className="mt-4 w-fit" tone="neutral">
          <Sparkles aria-hidden="true" className="mr-1 inline size-3" />
          Teaching style
        </StatusBadge>

        <Button asChild className="mt-5 w-full" variant="outline">
          <Link href={`/tutors/${tutor.id}`}>
            ดูโปรไฟล์
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
