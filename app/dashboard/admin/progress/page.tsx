import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { ProgressReportEmptyState } from "@/components/progress/progress-report-empty-state";
import { ProgressReportTable } from "@/components/progress/progress-report-table";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/guards";
import {
  getAdminProgressFilterOptions,
  getAdminProgressOverview,
  parseProgressOverviewFilters,
} from "@/services/progress.service";

export const dynamic = "force-dynamic";

type AdminProgressPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminProgressPage({
  searchParams,
}: AdminProgressPageProps) {
  const user = await requireAdmin();
  const query = searchParams ? await searchParams : {};
  const filters = parseProgressOverviewFilters(query);
  const [reports, options] = await Promise.all([
    getAdminProgressOverview(user.id, filters),
    getAdminProgressFilterOptions(),
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
          <h1 className="tt-heading mt-2 text-3xl">Progress reports</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            Read-only platform-wide progress summaries for ACTIVE enrollments.
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
        <form className="tt-filter-panel" method="get">
          <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px_180px]">
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
                  placeholder="Student, course, tutor"
                  type="search"
                />
              </div>
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
                <option value="">All</option>
                {options.students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
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
                <option value="">All</option>
                {options.tutors.map((tutor) => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.name}
                  </option>
                ))}
              </select>
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
                <option value="">All</option>
                {options.courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <label className="tt-label" htmlFor="subjectId">
                Subject
              </label>
              <select
                className="tt-input"
                defaultValue={filters.subjectId ?? ""}
                id="subjectId"
                name="subjectId"
              >
                <option value="">All</option>
                {options.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="space-y-2">
              <span className="tt-label">Min score</span>
              <input
                className="tt-input"
                defaultValue={filters.minScore ?? ""}
                max={100}
                min={0}
                name="minScore"
                type="number"
              />
            </label>
            <label className="space-y-2">
              <span className="tt-label">Max score</span>
              <input
                className="tt-input"
                defaultValue={filters.maxScore ?? ""}
                max={100}
                min={0}
                name="maxScore"
                type="number"
              />
            </label>
            <label className="space-y-2">
              <span className="tt-label">Min completeness</span>
              <input
                className="tt-input"
                defaultValue={filters.minCompleteness ?? ""}
                max={100}
                min={0}
                name="minCompleteness"
                type="number"
              />
            </label>
            <label className="space-y-2">
              <span className="tt-label">Max completeness</span>
              <input
                className="tt-input"
                defaultValue={filters.maxCompleteness ?? ""}
                max={100}
                min={0}
                name="maxCompleteness"
                type="number"
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button asChild type="button" variant="outline">
              <Link href="/dashboard/admin/progress">Reset</Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        <div className="mt-6">
          {reports.length === 0 ? (
            <ProgressReportEmptyState
              description="No ACTIVE enrollment progress reports match this filter set."
              title="No progress reports found"
            />
          ) : (
            <ProgressReportTable
              getDetailHref={(row) =>
                `/dashboard/admin/students/${row.studentId}/courses/${row.courseId}/progress`
              }
              rows={reports}
              showStudent
            />
          )}
        </div>
      </section>
    </main>
  );
}
