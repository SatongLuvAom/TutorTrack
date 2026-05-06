import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssignmentEmptyState } from "@/components/assignments/assignment-empty-state";
import { AssignmentTable } from "@/components/assignments/assignment-table";
import { requireTutor } from "@/lib/guards";
import {
  getTutorAssignmentCourseOptions,
  getTutorAssignments,
  parseAssignmentFilters,
} from "@/services/assignment.service";

export const dynamic = "force-dynamic";

type TutorAssignmentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TutorAssignmentsPage({
  searchParams,
}: TutorAssignmentsPageProps) {
  const user = await requireTutor();
  const query = searchParams ? await searchParams : {};
  const filters = parseAssignmentFilters(query);
  const [assignments, courses] = await Promise.all([
    getTutorAssignments(user.id, filters),
    getTutorAssignmentCourseOptions(user.id),
  ]);

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
          <h1 className="tt-heading mt-2 text-3xl">Assignments</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Manage homework across your own courses and review grading queues.
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
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
                <option value="not-submitted">Not submitted</option>
                <option value="submitted">Submitted</option>
                <option value="pending-grading">Pending grading</option>
                <option value="graded">Graded</option>
                <option value="late">Late</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button asChild type="button" variant="outline">
              <Link href="/dashboard/tutor/assignments">Reset</Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        <div className="mt-6">
          {assignments.length === 0 ? (
            <AssignmentEmptyState
              actionHref="/dashboard/tutor/courses"
              actionLabel="Choose a course"
              description="Create assignments from a tutor-owned course page."
              title="No assignments found"
            />
          ) : (
            <AssignmentTable
              assignments={assignments}
              editPathPrefix="/dashboard/tutor/assignments"
              viewPathPrefix="/dashboard/tutor/assignments"
            />
          )}
        </div>
      </section>
    </main>
  );
}
