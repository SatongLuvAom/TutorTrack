import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { CourseStatus } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { CourseEmptyState } from "@/components/courses/course-empty-state";
import { SessionTable } from "@/components/sessions/session-table";
import { requirePermission, requireTutor } from "@/lib/guards";
import { canEditCourse } from "@/lib/permissions";
import { getTutorCourseById } from "@/services/course.service";
import { getTutorCourseSessions } from "@/services/session.service";
import {
  cancelTutorSessionAction,
  completeTutorSessionAction,
} from "@/app/dashboard/tutor/sessions/actions";

export const dynamic = "force-dynamic";

type TutorCourseSessionsPageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function TutorCourseSessionsPage({
  params,
}: TutorCourseSessionsPageProps) {
  const user = await requireTutor();
  const { courseId } = await params;
  await requirePermission(canEditCourse(user, courseId));
  const [course, sessions] = await Promise.all([
    getTutorCourseById(user.id, courseId),
    getTutorCourseSessions(user.id, courseId),
  ]);

  if (!course) {
    notFound();
  }

  const returnTo = `/dashboard/tutor/courses/${courseId}/sessions`;

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell flex flex-col gap-5 py-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Button asChild size="sm" variant="ghost">
              <Link href={`/dashboard/tutor/courses/${courseId}`}>
                <ArrowLeft aria-hidden="true" />
                Course
              </Link>
            </Button>
            <p className="tt-kicker mt-5">Tutor dashboard</p>
            <h1 className="tt-heading mt-2 text-3xl">
              Sessions for {course.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Sessions can be created only while the course is published.
            </p>
          </div>
          {course.status === CourseStatus.PUBLISHED ? (
            <Button asChild>
              <Link href={`/dashboard/tutor/courses/${courseId}/sessions/new`}>
                <Plus aria-hidden="true" />
                New session
              </Link>
            </Button>
          ) : null}
        </div>
      </section>

      <section className="tt-shell py-8">
        {sessions.length === 0 ? (
          <CourseEmptyState
            actionHref={
              course.status === CourseStatus.PUBLISHED
                ? `/dashboard/tutor/courses/${courseId}/sessions/new`
                : `/dashboard/tutor/courses/${courseId}`
            }
            actionLabel={
              course.status === CourseStatus.PUBLISHED ? "Create session" : "Back to course"
            }
            description="Create scheduled lesson sessions before tracking attendance."
            title="No sessions for this course"
          />
        ) : (
          <SessionTable
            cancelAction={cancelTutorSessionAction}
            completeAction={completeTutorSessionAction}
            editPathPrefix="/dashboard/tutor/sessions"
            returnTo={returnTo}
            sessions={sessions}
            showActions
            viewPathPrefix="/dashboard/tutor/sessions"
          />
        )}
      </section>
    </main>
  );
}
