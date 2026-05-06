import Link from "next/link";
import { Search } from "lucide-react";
import { AttendanceStatus, SessionStatus } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { AttendanceTable } from "@/components/attendance/attendance-table";
import { CourseEmptyState } from "@/components/courses/course-empty-state";
import { SessionTable } from "@/components/sessions/session-table";
import { requireAdmin } from "@/lib/guards";
import {
  getAdminSessionFilterOptions,
  getAdminSessions,
  parseSessionFilters,
} from "@/services/session.service";
import {
  getAdminAttendance,
  parseAttendanceFilters,
} from "@/services/attendance.service";
import {
  cancelAdminSessionAction,
  completeAdminSessionAction,
} from "@/app/dashboard/admin/sessions/actions";

export const dynamic = "force-dynamic";

type AdminSessionsPageProps = {
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
    ? `/dashboard/admin/sessions?${query}`
    : "/dashboard/admin/sessions";
}

function hasFilters(params: Record<string, string | string[] | undefined>) {
  return ["search", "courseId", "tutorId", "status"].some((key) =>
    Boolean(firstValue(params[key])),
  );
}

export default async function AdminSessionsPage({
  searchParams,
}: AdminSessionsPageProps) {
  await requireAdmin();
  const params = searchParams ? await searchParams : {};
  const sessionFilters = parseSessionFilters(params);
  const attendanceFilters = parseAttendanceFilters({
    ...params,
    status: firstValue(params.attendanceStatus),
  });
  const returnTo = buildReturnPath(params);
  const [filterOptions, sessions, attendance] = await Promise.all([
    getAdminSessionFilterOptions(),
    getAdminSessions(sessionFilters),
    getAdminAttendance(attendanceFilters),
  ]);
  const errorMessage = firstValue(params.error);
  const filtered = hasFilters(params);

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <p className="tt-kicker">Admin dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">Sessions and attendance</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Admins can view all sessions and attendance records across courses.
          </p>
        </div>
      </section>

      <section className="tt-shell space-y-8 py-8">
        {errorMessage ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <form
          action="/dashboard/admin/sessions"
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
                  defaultValue={sessionFilters.search}
                  id="search"
                  name="search"
                  placeholder="Session, course, tutor, or student"
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
                defaultValue={sessionFilters.courseId ?? ""}
                id="courseId"
                name="courseId"
              >
                <option value="">All courses</option>
                {filterOptions.courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="tt-label" htmlFor="tutorId">
                Tutor
              </label>
              <select
                className="tt-input"
                defaultValue={sessionFilters.tutorId ?? ""}
                id="tutorId"
                name="tutorId"
              >
                <option value="">All tutors</option>
                {filterOptions.tutors.map((tutor) => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="tt-label" htmlFor="status">
                Session status
              </label>
              <select
                className="tt-input"
                defaultValue={sessionFilters.status ?? ""}
                id="status"
                name="status"
              >
                <option value="">All statuses</option>
                <option value={SessionStatus.SCHEDULED}>Scheduled</option>
                <option value={SessionStatus.COMPLETED}>Completed</option>
                <option value={SessionStatus.CANCELLED}>Cancelled</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="tt-label" htmlFor="attendanceStatus">
                Attendance status
              </label>
              <select
                className="tt-input"
                defaultValue={attendanceFilters.status ?? ""}
                id="attendanceStatus"
                name="attendanceStatus"
              >
                <option value="">All attendance</option>
                <option value={AttendanceStatus.PRESENT}>Present</option>
                <option value={AttendanceStatus.LATE}>Late</option>
                <option value={AttendanceStatus.ABSENT}>Absent</option>
                <option value={AttendanceStatus.EXCUSED}>Excused</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button asChild type="button" variant="outline">
              <Link href="/dashboard/admin/sessions">Reset</Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        <section>
          <h2 className="tt-heading mb-4 text-xl">All sessions</h2>
          {sessions.length === 0 ? (
            <CourseEmptyState
              actionHref="/dashboard/admin/sessions"
              actionLabel={filtered ? "Clear filters" : undefined}
              description={
                filtered
                  ? "No session matches the current filters."
                  : "Sessions created by tutors will appear here."
              }
              title={filtered ? "No matching sessions" : "No sessions found"}
            />
          ) : (
            <SessionTable
              cancelAction={cancelAdminSessionAction}
              completeAction={completeAdminSessionAction}
              returnTo={returnTo}
              sessions={sessions}
              showActions
              showTutor
              viewHrefFor="course"
              viewPathPrefix="/dashboard/admin/sessions"
            />
          )}
        </section>

        <section>
          <h2 className="tt-heading mb-4 text-xl">Attendance records</h2>
          {attendance.length === 0 ? (
            <CourseEmptyState
              actionHref="/dashboard/admin/sessions"
              description="Attendance records will appear after tutors mark active students."
              title="No attendance records"
            />
          ) : (
            <AttendanceTable records={attendance} showStudent showTutor />
          )}
        </section>
      </section>
    </main>
  );
}
