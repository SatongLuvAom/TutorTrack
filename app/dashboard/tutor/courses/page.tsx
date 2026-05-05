import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { CourseType, CourseStatus } from "@/lib/generated/prisma/enums";
import { requireTutor } from "@/lib/guards";
import { Button } from "@/components/ui/button";
import { CourseEmptyState } from "@/components/courses/course-empty-state";
import { TutorCourseTable } from "@/components/courses/tutor-course-table";
import {
  getCourseSubjectOptions,
  getTutorCourses,
  parseManagedCourseFilters,
} from "@/services/course.service";
import {
  archiveTutorCourseAction,
  publishTutorCourseAction,
  restoreTutorCourseToDraftAction,
} from "@/app/dashboard/tutor/courses/actions";

export const dynamic = "force-dynamic";

type TutorCoursesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function buildReturnPath(params: Record<string, string | string[] | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    const selected = firstValue(value);

    if (selected && key !== "error") {
      search.set(key, selected);
    }
  }

  const query = search.toString();

  return query ? `/dashboard/tutor/courses?${query}` : "/dashboard/tutor/courses";
}

function hasFilters(params: Record<string, string | string[] | undefined>) {
  return ["search", "subjectId", "status", "courseType"].some((key) =>
    Boolean(firstValue(params[key])),
  );
}

export default async function TutorCoursesPage({
  searchParams,
}: TutorCoursesPageProps) {
  const user = await requireTutor();
  const params = searchParams ? await searchParams : {};
  const filters = parseManagedCourseFilters(params);
  const returnTo = buildReturnPath(params);
  const [subjects, courses] = await Promise.all([
    getCourseSubjectOptions(),
    getTutorCourses(user.id, filters),
  ]);
  const errorMessage = firstValue(params.error);
  const filtered = hasFilters(params);

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell flex flex-col gap-5 py-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="tt-kicker">
              Tutor dashboard
            </p>
            <h1 className="tt-heading mt-2 text-3xl">
              Course management
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Create drafts, edit course details, and control whether your
              courses are published or archived.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/tutor/courses/new">
              <Plus aria-hidden="true" />
              New course
            </Link>
          </Button>
        </div>
      </section>

      <section className="tt-shell py-8">
        {errorMessage ? (
          <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <form
          action="/dashboard/tutor/courses"
          className="tt-filter-panel"
          method="get"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <label className="tt-label" htmlFor="search">
                Search
              </label>
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary"
                />
                <input
                  className="tt-input pl-9"
                  defaultValue={filters.search}
                  id="search"
                  name="search"
                  placeholder="Course title or description"
                  type="search"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="tt-label" htmlFor="subjectId">
                Subject
              </label>
              <select
                className="tt-input"
                defaultValue={filters.subjectId ?? ""}
                id="subjectId"
                name="subjectId"
              >
                <option value="">All subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="tt-label" htmlFor="status">
                Status
              </label>
              <select
                className="tt-input"
                defaultValue={filters.status ?? ""}
                id="status"
                name="status"
              >
                <option value="">All statuses</option>
                <option value={CourseStatus.DRAFT}>Draft</option>
                <option value={CourseStatus.PUBLISHED}>Published</option>
                <option value={CourseStatus.ARCHIVED}>Archived</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="tt-label" htmlFor="courseType">
                Course type
              </label>
              <select
                className="tt-input"
                defaultValue={filters.courseType ?? ""}
                id="courseType"
                name="courseType"
              >
                <option value="">All types</option>
                <option value={CourseType.PRIVATE}>Private</option>
                <option value={CourseType.GROUP}>Group</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button asChild type="button" variant="outline">
              <Link href="/dashboard/tutor/courses">Reset</Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        <div className="mt-6">
          {courses.length === 0 ? (
            <CourseEmptyState
              actionHref={filtered ? "/dashboard/tutor/courses" : "/dashboard/tutor/courses/new"}
              actionLabel={filtered ? "Clear filters" : "Create first course"}
              description={
                filtered
                  ? "No course matches the current filters."
                  : "Start with a draft course. You can publish it only when the details are ready."
              }
              title={filtered ? "No matching courses" : "No courses yet"}
            />
          ) : (
            <TutorCourseTable
              archiveAction={archiveTutorCourseAction}
              courses={courses}
              publishAction={publishTutorCourseAction}
              restoreAction={restoreTutorCourseToDraftAction}
              returnTo={returnTo}
            />
          )}
        </div>
      </section>
    </main>
  );
}
