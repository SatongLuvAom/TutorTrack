import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssignmentEmptyState } from "@/components/assignments/assignment-empty-state";
import { AssignmentTable } from "@/components/assignments/assignment-table";
import { HomeworkSummaryCards } from "@/components/submissions/homework-summary-cards";
import { requireStudent } from "@/lib/guards";
import {
  getStudentAssignmentCourseOptions,
  getStudentAssignments,
  parseAssignmentFilters,
} from "@/services/assignment.service";
import { getHomeworkSummaryForStudent } from "@/services/submission.service";

export const dynamic = "force-dynamic";

type StudentAssignmentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StudentAssignmentsPage({
  searchParams,
}: StudentAssignmentsPageProps) {
  const user = await requireStudent();
  const query = searchParams ? await searchParams : {};
  const filters = parseAssignmentFilters(query);
  const [assignments, courses, summary] = await Promise.all([
    getStudentAssignments(user.id, filters),
    getStudentAssignmentCourseOptions(user.id),
    user.studentProfileId
      ? getHomeworkSummaryForStudent(user.studentProfileId, filters.courseId)
      : Promise.resolve({
          totalAssignments: 0,
          submittedCount: 0,
          gradedCount: 0,
          pendingCount: 0,
          lateCount: 0,
          completionRate: 0,
        }),
  ]);

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/student">
              <ArrowLeft aria-hidden="true" />
              Dashboard
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Student dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">My assignments</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            View and submit homework only for ACTIVE course enrollments.
          </p>
        </div>
      </section>

      <section className="tt-shell space-y-6 py-8">
        <HomeworkSummaryCards summary={summary} />

        <form className="tt-filter-panel" method="get">
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
              <Link href="/dashboard/student/assignments">Reset</Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        {assignments.length === 0 ? (
          <AssignmentEmptyState
            actionHref="/courses"
            actionLabel="Browse courses"
            description="Assignments appear after you have ACTIVE enrollments."
            title="No assignments found"
          />
        ) : (
          <AssignmentTable
            assignments={assignments}
            showStudentStatus
            showTutor
            viewPathPrefix="/dashboard/student/assignments"
          />
        )}
      </section>
    </main>
  );
}
