import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { EnrollmentStatus } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { AdminEnrollmentTable } from "@/components/enrollments/admin-enrollment-table";
import { EnrollmentEmptyState } from "@/components/enrollments/enrollment-empty-state";
import { requireAdmin } from "@/lib/guards";
import {
  getAdminEnrollmentFilterOptions,
  getAdminEnrollments,
  parseEnrollmentFilters,
} from "@/services/enrollment.service";
import { updateAdminEnrollmentStatusAction } from "@/app/dashboard/admin/enrollments/actions";

export const dynamic = "force-dynamic";

type AdminEnrollmentsPageProps = {
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
    ? `/dashboard/admin/enrollments?${query}`
    : "/dashboard/admin/enrollments";
}

function hasFilters(params: Record<string, string | string[] | undefined>) {
  return ["search", "courseId", "tutorId", "studentId", "status"].some(
    (key) => Boolean(firstValue(params[key])),
  );
}

export default async function AdminEnrollmentsPage({
  searchParams,
}: AdminEnrollmentsPageProps) {
  await requireAdmin();
  const params = searchParams ? await searchParams : {};
  const filters = parseEnrollmentFilters(params);
  const [options, enrollments] = await Promise.all([
    getAdminEnrollmentFilterOptions(),
    getAdminEnrollments(filters),
  ]);
  const returnTo = buildReturnPath(params);
  const errorMessage = firstValue(params.error);
  const filtered = hasFilters(params);

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/admin">
              <ArrowLeft aria-hidden="true" />
              Dashboard
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Admin dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">Enrollment management</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Admin เห็น enrollment ทั้งหมดและจัดการ status lifecycle ได้จากฝั่ง server
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
          action="/dashboard/admin/enrollments"
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
                  placeholder="Course, tutor, student, or email"
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
                {options.courses.map((course) => (
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
                defaultValue={filters.tutorId ?? ""}
                id="tutorId"
                name="tutorId"
              >
                <option value="">All tutors</option>
                {options.tutors.map((tutor) => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="tt-label" htmlFor="studentId">
                Student
              </label>
              <select
                className="tt-input"
                defaultValue={filters.studentId ?? ""}
                id="studentId"
                name="studentId"
              >
                <option value="">All students</option>
                {options.students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
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
                <option value={EnrollmentStatus.PENDING}>Pending</option>
                <option value={EnrollmentStatus.ACTIVE}>Active</option>
                <option value={EnrollmentStatus.COMPLETED}>Completed</option>
                <option value={EnrollmentStatus.CANCELLED}>Cancelled</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button asChild type="button" variant="outline">
              <Link href="/dashboard/admin/enrollments">Reset</Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        <div className="mt-6">
          {enrollments.length === 0 ? (
            <EnrollmentEmptyState
              actionHref="/dashboard/admin/enrollments"
              actionLabel={filtered ? "Clear filters" : undefined}
              description={
                filtered
                  ? "No enrollment matches the current filters."
                  : "Enrollment records will appear here after students or parents submit requests."
              }
              title={filtered ? "No matching enrollments" : "No enrollments yet"}
            />
          ) : (
            <AdminEnrollmentTable
              enrollments={enrollments}
              returnTo={returnTo}
              updateAction={updateAdminEnrollmentStatusAction}
            />
          )}
        </div>
      </section>
    </main>
  );
}
