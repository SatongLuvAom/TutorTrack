import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssignmentEmptyState } from "@/components/assignments/assignment-empty-state";
import { AssignmentTable } from "@/components/assignments/assignment-table";
import { requirePermission, requireTutor } from "@/lib/guards";
import { canEditCourse } from "@/lib/permissions";
import { getTutorCourseById } from "@/services/course.service";
import {
  getTutorCourseAssignments,
  parseAssignmentFilters,
} from "@/services/assignment.service";

export const dynamic = "force-dynamic";

type TutorCourseAssignmentsPageProps = {
  params: Promise<{ courseId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TutorCourseAssignmentsPage({
  params,
  searchParams,
}: TutorCourseAssignmentsPageProps) {
  const user = await requireTutor();
  const { courseId } = await params;
  await requirePermission(canEditCourse(user, courseId));
  const query = searchParams ? await searchParams : {};
  const filters = parseAssignmentFilters(query);
  const [course, assignments] = await Promise.all([
    getTutorCourseById(user.id, courseId),
    getTutorCourseAssignments(user.id, courseId, filters),
  ]);

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
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="tt-kicker">Tutor dashboard</p>
              <h1 className="tt-heading mt-2 text-3xl">
                Assignments for {course.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                Assignments are visible to students with ACTIVE enrollment in
                this course.
              </p>
            </div>
            <Button asChild>
              <Link href={`/dashboard/tutor/courses/${courseId}/assignments/new`}>
                <Plus aria-hidden="true" />
                New assignment
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="tt-shell py-8">
        <form
          action={`/dashboard/tutor/courses/${courseId}/assignments`}
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
                  placeholder="Assignment title"
                  type="search"
                />
              </div>
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
                <option value="pending-grading">Pending grading</option>
                <option value="graded">Graded</option>
                <option value="late">Late</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button asChild type="button" variant="outline">
              <Link href={`/dashboard/tutor/courses/${courseId}/assignments`}>
                Reset
              </Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        <div className="mt-6">
          {assignments.length === 0 ? (
            <AssignmentEmptyState
              actionHref={`/dashboard/tutor/courses/${courseId}/assignments/new`}
              actionLabel="Create assignment"
              description="No assignment matches the current filters."
              title="No assignments found"
            />
          ) : (
            <AssignmentTable
              assignments={assignments}
              editPathPrefix="/dashboard/tutor/assignments"
              showCourse={false}
              viewPathPrefix="/dashboard/tutor/assignments"
            />
          )}
        </div>
      </section>
    </main>
  );
}
