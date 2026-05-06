import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { AssessmentScoreTable } from "@/components/assessments/assessment-score-table";
import { AssignmentEmptyState } from "@/components/assignments/assignment-empty-state";
import { Button } from "@/components/ui/button";
import { AssessmentType } from "@/lib/generated/prisma/enums";
import { requireAdmin } from "@/lib/guards";
import {
  getAdminAssessmentFilterOptions,
  getAdminAssessments,
  parseAssessmentFilters,
} from "@/services/assessment.service";

export const dynamic = "force-dynamic";

type AdminAssessmentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminAssessmentsPage({
  searchParams,
}: AdminAssessmentsPageProps) {
  await requireAdmin();
  const query = searchParams ? await searchParams : {};
  const filters = parseAssessmentFilters(query);
  const [assessments, options] = await Promise.all([
    getAdminAssessments(filters),
    getAdminAssessmentFilterOptions(),
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
          <h1 className="tt-heading mt-2 text-3xl">Assessments</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Read-only score inspection across all TutorTrack courses.
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
        <form className="tt-filter-panel" method="get">
          <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px_180px_180px]">
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
                  placeholder="Assessment, course, student"
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
                <option value="">All</option>
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
                <option value="">All</option>
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
                <option value="">All</option>
                {options.students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="tt-label" htmlFor="type">
                Type
              </label>
              <select
                className="tt-input"
                defaultValue={filters.type ?? ""}
                id="type"
                name="type"
              >
                <option value="">All</option>
                <option value={AssessmentType.PRE_TEST}>Pre-test</option>
                <option value={AssessmentType.QUIZ}>Quiz</option>
                <option value={AssessmentType.MOCK_EXAM}>Mock exam</option>
                <option value={AssessmentType.POST_TEST}>Post-test</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button asChild type="button" variant="outline">
              <Link href="/dashboard/admin/assessments">Reset</Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        <div className="mt-6">
          {assessments.length === 0 ? (
            <AssignmentEmptyState
              description="No assessment score records match this filter set."
              title="No assessments found"
            />
          ) : (
            <AssessmentScoreTable assessments={assessments} showStudent showTutor />
          )}
        </div>
      </section>
    </main>
  );
}
