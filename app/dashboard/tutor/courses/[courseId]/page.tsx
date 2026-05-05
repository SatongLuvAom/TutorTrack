import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, Users } from "lucide-react";
import { CourseStatus } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { CourseActions } from "@/components/courses/course-actions";
import { CourseStatusBadge } from "@/components/courses/course-status-badge";
import { requirePermission, requireTutor } from "@/lib/guards";
import { canEditCourse } from "@/lib/permissions";
import { formatPrice, getLevelLabel } from "@/services/marketplace-utils";
import { getTutorCourseById } from "@/services/course.service";
import {
  archiveTutorCourseAction,
  publishTutorCourseAction,
  restoreTutorCourseToDraftAction,
} from "@/app/dashboard/tutor/courses/actions";

export const dynamic = "force-dynamic";

type TutorCourseDetailPageProps = {
  params: Promise<{ courseId: string }>;
};

function formatDate(value: Date | null): string {
  if (!value) {
    return "Not published";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function TutorCourseDetailPage({
  params,
}: TutorCourseDetailPageProps) {
  const user = await requireTutor();
  const { courseId } = await params;
  await requirePermission(canEditCourse(user, courseId));
  const course = await getTutorCourseById(user.id, courseId);

  if (!course) {
    notFound();
  }

  const returnTo = `/dashboard/tutor/courses/${course.id}`;

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/tutor/courses">
              <ArrowLeft aria-hidden="true" />
              Courses
            </Link>
          </Button>
          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <CourseStatusBadge status={course.status} />
                <span className="inline-flex rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700">
                  {course.subject.name}
                </span>
              </div>
              <h1 className="tt-heading mt-4 text-3xl">
                {course.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                {course.description}
              </p>
            </div>
            <CourseActions
              archiveAction={archiveTutorCourseAction}
              courseId={course.id}
              editHref={`/dashboard/tutor/courses/${course.id}/edit`}
              publishAction={publishTutorCourseAction}
              restoreAction={restoreTutorCourseToDraftAction}
              returnTo={returnTo}
              status={course.status}
              viewHref={`/dashboard/tutor/courses/${course.id}`}
            />
          </div>
        </div>
      </section>

      <section className="tt-shell grid gap-6 py-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="tt-card p-5">
            <h2 className="tt-heading text-xl">Course details</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Level</dt>
                <dd className="mt-1 font-medium">{getLevelLabel([course.level])}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Course type</dt>
                <dd className="mt-1 font-medium">{course.type}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Price</dt>
                <dd className="mt-1 font-medium">{formatPrice(course.priceCents)}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Max students</dt>
                <dd className="mt-1 font-medium">
                  {course.maxStudents ?? "Flexible"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Total sessions</dt>
                <dd className="mt-1 font-medium">{course.totalSessions}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Published at</dt>
                <dd className="mt-1 font-medium">
                  {formatDate(course.publishedAt)}
                </dd>
              </div>
            </dl>
          </section>

          {course.status === CourseStatus.PUBLISHED ? (
            <section className="tt-card p-5">
              <h2 className="tt-heading text-xl">Public page</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Published courses are visible on the public marketplace while
                this course remains published.
              </p>
              <Button asChild className="mt-4" variant="outline">
                <Link href={`/courses/${course.id}`}>Open public course</Link>
              </Button>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="tt-card p-5">
            <p className="text-sm text-muted-foreground">Enrollments</p>
            <p className="mt-2 flex items-center gap-2 text-3xl font-semibold">
              <Users aria-hidden="true" className="size-6 text-muted-foreground" />
              {course.stats.enrollmentCount}
            </p>
            <Button asChild className="mt-4 w-full" variant="outline">
              <Link href={`/dashboard/tutor/courses/${course.id}/students`}>
                View students
              </Link>
            </Button>
          </div>
          <div className="tt-card p-5">
            <p className="text-sm text-muted-foreground">Scheduled sessions</p>
            <p className="mt-2 flex items-center gap-2 text-3xl font-semibold">
              <ClipboardList
                aria-hidden="true"
                className="size-6 text-muted-foreground"
              />
              {course.stats.scheduledSessionCount}
            </p>
          </div>
          <div className="tt-card p-5">
            <p className="text-sm text-muted-foreground">Assignments</p>
            <p className="mt-2 text-3xl font-semibold">
              {course.stats.assignmentCount}
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
