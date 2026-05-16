import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  GraduationCap,
  Star,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/courses/course-card";
import { StatusBadge } from "@/components/marketplace/status-badge";
import {
  getLocalImageOrFallback,
  TUTOR_PLACEHOLDER_IMAGE,
} from "@/components/visual/image-utils";
import { formatPrice, formatRating } from "@/services/marketplace-utils";
import { getPublicTutorDetail } from "@/services/tutor.service";

export const dynamic = "force-dynamic";

type TutorDetailPageProps = {
  params: Promise<{
    tutorId: string;
  }>;
};

export default async function TutorDetailPage({ params }: TutorDetailPageProps) {
  const { tutorId } = await params;
  const tutor = await getPublicTutorDetail(tutorId);

  if (!tutor) {
    notFound();
  }

  const imageSrc = getLocalImageOrFallback(
    tutor.imageUrl,
    TUTOR_PLACEHOLDER_IMAGE,
  );

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-gradient-to-br from-sky-50 via-white to-emerald-50">
        <div className="tt-shell grid gap-8 py-12 lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-6 sm:flex-row">
            <Image
              alt={`รูปโปรไฟล์ของ ${tutor.name}`}
              className="size-28 rounded-lg border border-white object-cover shadow-sm"
              height={224}
              priority
              src={imageSrc}
              width={224}
            />
            <div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone="success">Approved tutor</StatusBadge>
                <StatusBadge tone="neutral">{tutor.levelLabel}</StatusBadge>
              </div>
              <h1 className="tt-heading mt-4 text-4xl leading-[1.2]">
                {tutor.name}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-8 text-muted-foreground">
                {tutor.headline ?? "TutorTrack approved tutor"}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {tutor.subjects.map((subject) => (
                  <StatusBadge key={subject.slug} tone="accent">
                    {subject.name}
                  </StatusBadge>
                ))}
              </div>
            </div>
          </div>

          <aside className="tt-card p-5">
            <div className="grid gap-3">
              <div className="rounded-lg bg-amber-50 p-4 text-amber-800">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Star
                    aria-hidden="true"
                    className="size-4 fill-amber-400 text-amber-400"
                  />
                  Rating
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {formatRating(tutor.rating)}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-lg bg-secondary/70 p-4">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Timer aria-hidden="true" className="size-4" />
                    ประสบการณ์
                  </p>
                  <p className="mt-1 font-semibold">
                    {tutor.experienceYears ? `${tutor.experienceYears} ปี` : "ไม่ระบุ"}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/70 p-4">
                  <p className="text-sm text-muted-foreground">ราคา</p>
                  <p className="mt-1 font-semibold text-primary">
                    {formatPrice(tutor.hourlyRateCents)} / ชม.
                  </p>
                </div>
              </div>
            </div>
            <Button asChild className="mt-5 w-full">
              <Link href="#courses">
                ดูคอร์สของครู
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button className="mt-2 w-full" disabled variant="outline">
              Request booking (coming soon)
            </Button>
          </aside>
        </div>
      </section>

      <section className="tt-shell grid gap-8 py-12 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <section className="tt-card p-5">
            <h2 className="tt-heading text-2xl">About</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              {tutor.bio ?? "ยังไม่มีประวัติสาธารณะ"}
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <article className="tt-card p-5">
              <div className="flex items-center gap-2">
                <BarChart3 aria-hidden="true" className="size-5 text-primary" />
                <h2 className="tt-heading text-xl">Teaching style</h2>
              </div>
              <p className="mt-3 leading-7 text-muted-foreground">
                {tutor.teachingStyleSummary}
              </p>
            </article>
            <article className="tt-card p-5">
              <div className="flex items-center gap-2">
                <GraduationCap aria-hidden="true" className="size-5 text-primary" />
                <h2 className="tt-heading text-xl">Education</h2>
              </div>
              <p className="mt-3 leading-7 text-muted-foreground">
                {tutor.educationSummary}
              </p>
            </article>
          </section>

          <section id="courses">
            <div className="flex items-center gap-2">
              <BookOpen aria-hidden="true" className="size-5 text-primary" />
              <h2 className="tt-heading text-2xl">Published courses</h2>
            </div>
            {tutor.courses.length === 0 ? (
              <p className="mt-3 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                ยังไม่มีคอร์สที่เผยแพร่ใน marketplace
              </p>
            ) : (
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {tutor.courses.map((course) => (
                  <CourseCard course={course} key={course.id} />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="tt-card p-5">
            <h2 className="text-lg font-semibold">Subjects taught</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {tutor.subjects.map((subject) => (
                <StatusBadge key={subject.slug} tone="accent">
                  {subject.name}
                </StatusBadge>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{tutor.levelLabel}</p>
          </section>

          <section className="tt-card p-5">
            <h2 className="text-lg font-semibold">Reviews</h2>
            {tutor.reviews.length === 0 ? (
              <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                ยังไม่มีรีวิว
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {tutor.reviews.map((review) => (
                  <article className="rounded-lg border border-border p-4" key={review.id}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{review.authorName}</p>
                      <p className="text-sm font-semibold text-amber-600">
                        {review.rating}/5
                      </p>
                    </div>
                    {review.comment ? (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {review.comment}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </aside>
      </section>
    </main>
  );
}
