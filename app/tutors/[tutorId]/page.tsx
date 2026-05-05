import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/courses/course-card";
import { StatusBadge } from "@/components/marketplace/status-badge";
import { formatPrice, formatRating } from "@/services/marketplace-utils";
import { getPublicTutorDetail } from "@/services/tutor.service";

export const dynamic = "force-dynamic";

type TutorDetailPageProps = {
  params: Promise<{
    tutorId: string;
  }>;
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

export default async function TutorDetailPage({ params }: TutorDetailPageProps) {
  const { tutorId } = await params;
  const tutor = await getPublicTutorDetail(tutorId);

  if (!tutor) {
    notFound();
  }

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div>
              <div className="flex items-start gap-4">
                {tutor.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={tutor.name}
                    className="size-20 rounded-lg object-cover"
                    src={tutor.imageUrl}
                  />
                ) : (
                  <div className="flex size-20 items-center justify-center rounded-lg bg-primary text-xl font-semibold text-primary-foreground">
                    {initials(tutor.name)}
                  </div>
                )}
                <div>
                  <StatusBadge tone="success">Approved tutor</StatusBadge>
                  <h1 className="tt-heading mt-3 text-4xl leading-[1.2]">
                    {tutor.name}
                  </h1>
                  <p className="mt-3 max-w-2xl text-base leading-8 text-muted-foreground">
                    {tutor.headline ?? "TutorTrack approved tutor"}
                  </p>
                </div>
              </div>
            </div>

            <div className="tt-card p-5">
              <div className="flex items-center gap-2">
                <Star aria-hidden="true" className="size-5 fill-amber-400 text-amber-400" />
                <p className="text-lg font-semibold">{formatRating(tutor.rating)}</p>
              </div>
              <div className="mt-4 grid gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">ประสบการณ์</p>
                  <p className="font-medium">
                    {tutor.experienceYears ? `${tutor.experienceYears} ปี` : "ไม่ระบุ"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">ราคา</p>
                  <p className="font-medium">{formatPrice(tutor.hourlyRateCents)} / ชม.</p>
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
            </div>
          </div>
        </div>
      </section>

      <section className="tt-shell grid gap-8 py-12 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section>
            <h2 className="tt-heading text-2xl">About</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              {tutor.bio ?? "ยังไม่มีประวัติสาธารณะ"}
            </p>
          </section>

          <section>
            <h2 className="tt-heading text-2xl">Teaching style</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              {tutor.teachingStyleSummary}
            </p>
          </section>

          <section>
            <h2 className="tt-heading text-2xl">Education</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              {tutor.educationSummary}
            </p>
          </section>

          <section id="courses">
            <div className="flex items-center gap-2">
              <BookOpen aria-hidden="true" className="size-5 text-muted-foreground" />
              <h2 className="tt-heading text-2xl">Published courses</h2>
            </div>
            {tutor.courses.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
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
              <p className="mt-3 text-sm text-muted-foreground">ยังไม่มีรีวิว</p>
            ) : (
              <div className="mt-4 space-y-4">
                {tutor.reviews.map((review) => (
                  <article className="border-b border-border pb-4 last:border-0 last:pb-0" key={review.id}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{review.authorName}</p>
                      <p className="text-sm text-amber-600">{review.rating}/5</p>
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
