import Link from "next/link";
import { Search } from "lucide-react";
import { CourseStatus, CourseType } from "@/lib/generated/prisma/enums";
import { requireAdmin } from "@/lib/guards";
import { Button } from "@/components/ui/button";
import { AdminCourseTable } from "@/components/courses/admin-course-table";
import { CourseEmptyState } from "@/components/courses/course-empty-state";
import {
  getAdminCourses,
  getAdminCourseTutorOptions,
  getCourseSubjectOptions,
  parseManagedCourseFilters,
} from "@/services/course.service";
import {
  archiveAdminCourseAction,
  publishAdminCourseAction,
  restoreAdminCourseToDraftAction,
} from "@/app/dashboard/admin/courses/actions";

export const dynamic = "force-dynamic";

type AdminCoursesPageProps = {
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

  return query ? `/dashboard/admin/courses?${query}` : "/dashboard/admin/courses";
}

function hasFilters(params: Record<string, string | string[] | undefined>) {
  return ["search", "subjectId", "tutorId", "status", "courseType"].some(
    (key) => Boolean(firstValue(params[key])),
  );
}

export default async function AdminCoursesPage({
  searchParams,
}: AdminCoursesPageProps) {
  await requireAdmin();
  const params = searchParams ? await searchParams : {};
  const filters = parseManagedCourseFilters(params);
  const returnTo = buildReturnPath(params);
  const [subjects, tutors, courses] = await Promise.all([
    getCourseSubjectOptions(),
    getAdminCourseTutorOptions(),
    getAdminCourses(filters),
  ]);
  const errorMessage = firstValue(params.error);
  const filtered = hasFilters(params);

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <p className="tt-kicker">
            Admin dashboard
          </p>
          <h1 className="tt-heading mt-2 text-3xl">
            All courses
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Review tutor-owned courses and manage status without exposing draft
            or archived courses publicly.
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
        {errorMessage ? (
          <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <form
          action="/dashboard/admin/courses"
          className="tt-filter-panel"
          method="get"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
                  placeholder="Course, tutor, or email"
                  type="search"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="tt-label" htmlFor="tutorId">
                Tutor
              </label>
              <select
                className="tt-input"
                defaultValue={filters.tutorId ?? ""}
                id="tutorId"
                name="tutorId"
              >
                <option value="">All tutors</option>
                {tutors.map((tutor) => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.name}
                  </option>
                ))}
              </select>
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
              <Link href="/dashboard/admin/courses">Reset</Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        <div className="mt-6">
          {courses.length === 0 ? (
            <CourseEmptyState
              actionHref="/dashboard/admin/courses"
              actionLabel={filtered ? "Clear filters" : undefined}
              description={
                filtered
                  ? "No course matches the current admin filters."
                  : "Courses created by tutors will appear here."
              }
              title={filtered ? "No matching courses" : "No courses found"}
            />
          ) : (
            <AdminCourseTable
              archiveAction={archiveAdminCourseAction}
              courses={courses}
              publishAction={publishAdminCourseAction}
              restoreAction={restoreAdminCourseToDraftAction}
              returnTo={returnTo}
            />
          )}
        </div>
      </section>
    </main>
  );
}
