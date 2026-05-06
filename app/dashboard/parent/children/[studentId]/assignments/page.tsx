import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssignmentEmptyState } from "@/components/assignments/assignment-empty-state";
import { AssignmentTable } from "@/components/assignments/assignment-table";
import { HomeworkSummaryCards } from "@/components/submissions/homework-summary-cards";
import { requireParent, requirePermission } from "@/lib/guards";
import { canViewStudentAssignments } from "@/lib/permissions";
import {
  getParentChildAssignmentCourseOptions,
  getParentChildAssignments,
  parseAssignmentFilters,
} from "@/services/assignment.service";
import { getParentChildSummary } from "@/services/enrollment.service";
import { getHomeworkSummaryForStudent } from "@/services/submission.service";

export const dynamic = "force-dynamic";

type ParentChildAssignmentsPageProps = {
  params: Promise<{ studentId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ParentChildAssignmentsPage({
  params,
  searchParams,
}: ParentChildAssignmentsPageProps) {
  const user = await requireParent();
  const { studentId } = await params;
  await requirePermission(canViewStudentAssignments(user, studentId));
  const query = searchParams ? await searchParams : {};
  const filters = parseAssignmentFilters(query);
  const [child, assignments, courses, summary] = await Promise.all([
    getParentChildSummary(user.id, studentId),
    getParentChildAssignments(user.id, studentId, filters),
    getParentChildAssignmentCourseOptions(user.id, studentId),
    getHomeworkSummaryForStudent(studentId, filters.courseId),
  ]);

  if (!child) {
    notFound();
  }

  const viewPathPrefix = `/dashboard/parent/children/${studentId}/assignments`;

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/parent">
              <ArrowLeft aria-hidden="true" />
              Dashboard
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Parent dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">
            {child.name} assignments
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Parent view is read-only and limited to active linked children.
          </p>
        </div>
      </section>

      <section className="tt-shell space-y-6 py-8">
        <HomeworkSummaryCards summary={summary} />

        <form
          action={viewPathPrefix}
          className="tt-filter-panel"
          method="get"
        >
          <div className="grid gap-4 md:grid-cols-[1fr_220px_220px]">
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
                  placeholder="Assignment or course"
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
              <label className="tt-label" htmlFor="gradingStatus">
                Status
              </label>
              <select
                className="tt-input"
                defaultValue={filters.gradingStatus ?? ""}
                id="gradingStatus"
                name="gradingStatus"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="graded">Graded</option>
                <option value="late">Late</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button asChild type="button" variant="outline">
              <Link href={viewPathPrefix}>Reset</Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        {assignments.length === 0 ? (
          <AssignmentEmptyState
            description="Assignments appear when this child has ACTIVE enrollments."
            title="No assignments found"
          />
        ) : (
          <AssignmentTable
            assignments={assignments}
            showStudentStatus
            showTutor
            viewPathPrefix={viewPathPrefix}
          />
        )}
      </section>
    </main>
  );
}
