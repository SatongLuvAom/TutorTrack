import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { EnrollmentStatus } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { EnrollmentEmptyState } from "@/components/enrollments/enrollment-empty-state";
import { TutorCourseStudentsTable } from "@/components/enrollments/tutor-course-students-table";
import { requirePermission, requireTutor } from "@/lib/guards";
import { canViewTutorCourseEnrollments } from "@/lib/permissions";
import { getTutorCourseById } from "@/services/course.service";
import {
  getTutorCourseEnrollments,
  parseEnrollmentFilters,
} from "@/services/enrollment.service";

export const dynamic = "force-dynamic";

type TutorCourseStudentsPageProps = {
  params: Promise<{ courseId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function buildReturnPath(
  courseId: string,
  params: Record<string, string | string[] | undefined>,
) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    const selected = firstValue(value);

    if (selected && key !== "error") {
      search.set(key, selected);
    }
  }

  const query = search.toString();

  return query
    ? `/dashboard/tutor/courses/${courseId}/students?${query}`
    : `/dashboard/tutor/courses/${courseId}/students`;
}

export default async function TutorCourseStudentsPage({
  params,
  searchParams,
}: TutorCourseStudentsPageProps) {
  const user = await requireTutor();
  const { courseId } = await params;
  await requirePermission(canViewTutorCourseEnrollments(user, courseId));
  const query = searchParams ? await searchParams : {};
  const filters = parseEnrollmentFilters(query);
  const [course, enrollments] = await Promise.all([
    getTutorCourseById(user.id, courseId),
    getTutorCourseEnrollments(user.id, courseId, filters),
  ]);
  const returnTo = buildReturnPath(courseId, query);

  if (!course) {
    notFound();
  }

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href={`/dashboard/tutor/courses/${courseId}`}>
              <ArrowLeft aria-hidden="true" />
              Course
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Tutor dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">
            Students in {course.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            ติวเตอร์ดูรายชื่อนักเรียนได้เฉพาะคอร์สของตัวเอง และยังไม่แก้สถานะ enrollment ใน phase นี้
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
        <form
          action={`/dashboard/tutor/courses/${courseId}/students`}
          className="tt-filter-panel"
          method="get"
        >
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="space-y-2">
              <label className="tt-label" htmlFor="search">
                Search student
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
                  placeholder="Student name or email"
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
              <Link href={`/dashboard/tutor/courses/${courseId}/students`}>
                Reset
              </Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        <div className="mt-6">
          {enrollments.length === 0 ? (
            <EnrollmentEmptyState
              actionHref={returnTo}
              actionLabel="Refresh"
              description="ยังไม่มีนักเรียนที่ตรงกับเงื่อนไข หรือยังไม่มีคนสมัครคอร์สนี้"
              title="No enrolled students"
            />
          ) : (
            <TutorCourseStudentsTable enrollments={enrollments} />
          )}
        </div>
      </section>
    </main>
  );
}
