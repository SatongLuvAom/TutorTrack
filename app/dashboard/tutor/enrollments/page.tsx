import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { EnrollmentStatus } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { EnrollmentEmptyState } from "@/components/enrollments/enrollment-empty-state";
import { TutorEnrollmentsTable } from "@/components/enrollments/tutor-course-students-table";
import { requireTutor } from "@/lib/guards";
import {
  getTutorEnrollments,
  parseEnrollmentFilters,
} from "@/services/enrollment.service";

export const dynamic = "force-dynamic";

type TutorEnrollmentsPageProps = {
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
    ? `/dashboard/tutor/enrollments?${query}`
    : "/dashboard/tutor/enrollments";
}

export default async function TutorEnrollmentsPage({
  searchParams,
}: TutorEnrollmentsPageProps) {
  const user = await requireTutor();
  const params = searchParams ? await searchParams : {};
  const filters = parseEnrollmentFilters(params);
  const enrollments = await getTutorEnrollments(user.id, filters);
  const returnTo = buildReturnPath(params);

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/tutor">
              <ArrowLeft aria-hidden="true" />
              Dashboard
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Tutor dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">Enrollment overview</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            รวมรายการสมัครเรียนจากคอร์สของคุณเท่านั้น ไม่รวมคอร์สของติวเตอร์คนอื่น
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
        <form
          action="/dashboard/tutor/enrollments"
          className="tt-filter-panel"
          method="get"
        >
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
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
                  placeholder="Course, student, or email"
                  type="search"
                />
              </div>
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
              <Link href="/dashboard/tutor/enrollments">Reset</Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        <div className="mt-6">
          {enrollments.length === 0 ? (
            <EnrollmentEmptyState
              actionHref={returnTo}
              actionLabel="Refresh"
              description="ยังไม่มี enrollment สำหรับคอร์สของคุณ หรือไม่มีรายการตรงกับ filter"
              title="No enrollments"
            />
          ) : (
            <TutorEnrollmentsTable enrollments={enrollments} />
          )}
        </div>
      </section>
    </main>
  );
}
