import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssignmentEmptyState } from "@/components/assignments/assignment-empty-state";
import { SubmissionTable } from "@/components/submissions/submission-table";
import { requireAdmin } from "@/lib/guards";
import {
  getAdminSubmissionFilterOptions,
  getAdminSubmissions,
  parseSubmissionFilters,
} from "@/services/submission.service";

export const dynamic = "force-dynamic";

type AdminSubmissionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminSubmissionsPage({
  searchParams,
}: AdminSubmissionsPageProps) {
  await requireAdmin();
  const query = searchParams ? await searchParams : {};
  const filters = parseSubmissionFilters(query);
  const [submissions, options] = await Promise.all([
    getAdminSubmissions(filters),
    getAdminSubmissionFilterOptions(),
  ]);

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
          <h1 className="tt-heading mt-2 text-3xl">Submissions</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Inspect all homework submissions. Admin grading is out of scope for
            this MVP phase.
          </p>
        </div>
      </section>

      <section className="tt-shell space-y-6 py-8">
        <form className="tt-filter-panel" method="get">
          <div className="grid gap-4 md:grid-cols-5">
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
                  placeholder="Student, assignment, course"
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
              <label className="tt-label" htmlFor="gradingStatus">
                Status
              </label>
              <select
                className="tt-input"
                defaultValue={filters.gradingStatus ?? ""}
                id="gradingStatus"
                name="gradingStatus"
              >
                <option value="">All</option>
                <option value="graded">Graded</option>
                <option value="ungraded">Ungraded</option>
                <option value="late">Late</option>
                <option value="on-time">On time</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button asChild type="button" variant="outline">
              <Link href="/dashboard/admin/submissions">Reset</Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        {submissions.length === 0 ? (
          <AssignmentEmptyState
            description="No submission matches the current filters."
            title="No submissions found"
          />
        ) : (
          <SubmissionTable submissions={submissions} />
        )}
      </section>
    </main>
  );
}
