import { CourseForm } from "@/components/courses/course-form";
import { requireTutor } from "@/lib/guards";
import { getCourseSubjectOptions } from "@/services/course.service";
import { createTutorCourseAction } from "@/app/dashboard/tutor/courses/actions";

export const dynamic = "force-dynamic";

type NewCoursePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewCoursePage({
  searchParams,
}: NewCoursePageProps) {
  await requireTutor();
  const params = searchParams ? await searchParams : {};
  const subjects = await getCourseSubjectOptions();

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="mx-auto max-w-3xl px-6 py-8 sm:px-10">
          <p className="tt-kicker">
            Tutor dashboard
          </p>
          <h1 className="tt-heading mt-2 text-3xl">
            Create course
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            New courses start as drafts and stay hidden from public pages until
            you publish them.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-8 sm:px-10">
        <CourseForm
          action={createTutorCourseAction}
          cancelHref="/dashboard/tutor/courses"
          errorMessage={firstValue(params.error)}
          subjects={subjects}
        />
      </section>
    </main>
  );
}
