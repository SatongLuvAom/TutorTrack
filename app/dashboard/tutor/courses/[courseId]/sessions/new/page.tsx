import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionForm } from "@/components/sessions/session-form";
import { requirePermission, requireTutor } from "@/lib/guards";
import { canCreateSession } from "@/lib/permissions";
import { getTutorCourseById } from "@/services/course.service";
import { getTutorSessionCourseOptions } from "@/services/session.service";
import { createTutorSessionAction } from "@/app/dashboard/tutor/sessions/actions";

export const dynamic = "force-dynamic";

type NewTutorSessionPageProps = {
  params: Promise<{ courseId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewTutorSessionPage({
  params,
  searchParams,
}: NewTutorSessionPageProps) {
  const user = await requireTutor();
  const { courseId } = await params;
  await requirePermission(canCreateSession(user, courseId));
  const query = searchParams ? await searchParams : {};
  const [course, courses] = await Promise.all([
    getTutorCourseById(user.id, courseId),
    getTutorSessionCourseOptions(user.id, true),
  ]);

  if (!course) {
    notFound();
  }

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href={`/dashboard/tutor/courses/${courseId}/sessions`}>
              <ArrowLeft aria-hidden="true" />
              Sessions
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Tutor dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">New session</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Create a scheduled session for {course.title}.
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
        <SessionForm
          action={createTutorSessionAction}
          cancelHref={`/dashboard/tutor/courses/${courseId}/sessions`}
          courses={courses}
          errorMessage={firstValue(query.error)}
          fixedCourseId={courseId}
        />
      </section>
    </main>
  );
}
