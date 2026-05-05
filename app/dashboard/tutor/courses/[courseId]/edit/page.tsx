import { notFound } from "next/navigation";
import { CourseForm } from "@/components/courses/course-form";
import { requirePermission, requireTutor } from "@/lib/guards";
import { canEditCourse } from "@/lib/permissions";
import {
  getCourseSubjectOptions,
  getTutorCourseById,
} from "@/services/course.service";
import { updateTutorCourseAction } from "@/app/dashboard/tutor/courses/actions";

export const dynamic = "force-dynamic";

type EditCoursePageProps = {
  params: Promise<{ courseId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EditCoursePage({
  params,
  searchParams,
}: EditCoursePageProps) {
  const user = await requireTutor();
  const { courseId } = await params;
  await requirePermission(canEditCourse(user, courseId));
  const query = searchParams ? await searchParams : {};
  const [subjects, course] = await Promise.all([
    getCourseSubjectOptions(),
    getTutorCourseById(user.id, courseId),
  ]);

  if (!course) {
    notFound();
  }

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="mx-auto max-w-3xl px-6 py-8 sm:px-10">
          <p className="tt-kicker">
            Tutor dashboard
          </p>
          <h1 className="tt-heading mt-2 text-3xl">
            Edit course
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Status is managed by explicit publish, archive, and restore actions.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-8 sm:px-10">
        <CourseForm
          action={updateTutorCourseAction}
          cancelHref={`/dashboard/tutor/courses/${course.id}`}
          course={course}
          errorMessage={firstValue(query.error)}
          subjects={subjects}
        />
      </section>
    </main>
  );
}
