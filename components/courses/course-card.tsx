import Link from "next/link";
import { ArrowRight, CalendarDays, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/marketplace/status-badge";
import { formatPrice, formatRating } from "@/services/marketplace-utils";
import type { PublicCourseCard } from "@/types/marketplace";

type CourseCardProps = {
  course: PublicCourseCard;
};

export function CourseCard({ course }: CourseCardProps) {
  return (
    <article className="tt-card tt-card-hover flex h-full flex-col p-5">
      <div className="flex flex-wrap gap-2">
        <StatusBadge tone="success">Published</StatusBadge>
        <StatusBadge tone="accent">{course.subject.name}</StatusBadge>
        <StatusBadge tone="neutral">
          {course.type === "PRIVATE" ? "Private" : "Group"}
        </StatusBadge>
      </div>

      <h2 className="tt-heading mt-4 line-clamp-2 text-xl leading-8">
        {course.title}
      </h2>
      <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">
        {course.description ?? "คอร์สเรียน TutorTrack"}
      </p>

      <div className="mt-4 rounded-lg border border-border/70 bg-secondary/55 p-3">
        <p className="text-sm font-semibold">{course.tutor.name}</p>
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
          {course.tutor.headline ?? "Approved TutorTrack tutor"}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Rating {formatRating(course.tutor.rating)}
        </p>
      </div>

      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-lg bg-background/70 p-3">
          <p className="text-muted-foreground">ระดับ</p>
          <p className="mt-1 font-semibold">{course.levelLabel}</p>
        </div>
        <div className="rounded-lg bg-background/70 p-3">
          <p className="text-muted-foreground">ราคา</p>
          <p className="mt-1 font-semibold text-primary">{formatPrice(course.priceCents)}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarDays aria-hidden="true" className="size-4" />
          {course.totalSessions} sessions
        </span>
        <span className="flex items-center gap-1">
          <Users aria-hidden="true" className="size-4" />
          {course.maxStudents ? `${course.maxStudents} seats` : "Flexible"}
        </span>
      </div>

      <Button asChild className="mt-5 w-full" variant="outline">
        <Link href={`/courses/${course.id}`}>
          ดูรายละเอียด
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </article>
  );
}
