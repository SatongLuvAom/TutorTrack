import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { SessionStatus } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { CourseEmptyState } from "@/components/courses/course-empty-state";
import { SessionTable } from "@/components/sessions/session-table";
import { requireTutor } from "@/lib/guards";
import {
  getTutorSessionCourseOptions,
  getTutorSessions,
  parseSessionFilters,
} from "@/services/session.service";
import {
  cancelTutorSessionAction,
  completeTutorSessionAction,
} from "@/app/dashboard/tutor/sessions/actions";

export const dynamic = "force-dynamic";

type TutorSessionsPageProps = {
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

  return query
    ? `/dashboard/tutor/sessions?${query}`
    : "/dashboard/tutor/sessions";
}

function hasFilters(params: Record<string, string | string[] | undefined>) {
  return ["search", "courseId", "status"].some((key) =>
    Boolean(firstValue(params[key])),
  );
}

export default async function TutorSessionsPage({
  searchParams,
}: TutorSessionsPageProps) {
  const user = await requireTutor();
  const params = searchParams ? await searchParams : {};
  const filters = parseSessionFilters(params);
  const returnTo = buildReturnPath(params);
  const [courses, sessions] = await Promise.all([
    getTutorSessionCourseOptions(user.id),
    getTutorSessions(user.id, filters),
  ]);
  const errorMessage = firstValue(params.error);
  const filtered = hasFilters(params);

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell flex flex-col gap-5 py-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="tt-kicker">Tutor dashboard</p>
            <h1 className="tt-heading mt-2 text-3xl">Session schedule</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Create and manage lesson sessions for your own published courses.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/tutor/courses">
              <Plus aria-hidden="true" />
              Choose course
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
          action="/dashboard/tutor/sessions"
          className="tt-filter-panel"
          method="get"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
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
                  placeholder="Session or course"
                  type="search"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="tt-label" htmlFor="courseId">
                Course
              </label>
              <select
                className="tt-input"
                defaultValue={filters.courseId ?? ""}
                id="courseId"
                name="courseId"
              >
                <option value="">All courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
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
                <option value={SessionStatus.SCHEDULED}>Scheduled</option>
                <option value={SessionStatus.COMPLETED}>Completed</option>
                <option value={SessionStatus.CANCELLED}>Cancelled</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button asChild type="button" variant="outline">
              <Link href="/dashboard/tutor/sessions">Reset</Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        <div className="mt-6">
          {sessions.length === 0 ? (
            <CourseEmptyState
              actionHref={filtered ? "/dashboard/tutor/sessions" : "/dashboard/tutor/courses"}
              actionLabel={filtered ? "Clear filters" : "Open courses"}
              description={
                filtered
                  ? "No session matches the current filters."
                  : "Create sessions from a published course detail page."
              }
              title={filtered ? "No matching sessions" : "No sessions yet"}
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
        </div>
      </section>
    </main>
  );
}
