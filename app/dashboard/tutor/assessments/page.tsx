import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { AssessmentTable } from "@/components/assessments/assessment-table";
import { AssignmentEmptyState } from "@/components/assignments/assignment-empty-state";
import { Button } from "@/components/ui/button";
import { AssessmentType } from "@/lib/generated/prisma/enums";
import { requireTutor } from "@/lib/guards";
import {
  getTutorAssessmentCourseOptions,
  getTutorAssessments,
  parseAssessmentFilters,
} from "@/services/assessment.service";

export const dynamic = "force-dynamic";

type TutorAssessmentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TutorAssessmentsPage({
  searchParams,
}: TutorAssessmentsPageProps) {
  const user = await requireTutor();
  const query = searchParams ? await searchParams : {};
  const filters = parseAssessmentFilters(query);
  const [assessments, courses] = await Promise.all([
    getTutorAssessments(user.id, filters),
    getTutorAssessmentCourseOptions(user.id),
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
          <h1 className="tt-heading mt-2 text-3xl">Assessments</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Track quizzes, mock exams, and pre/post tests for active students in
            your courses.
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
        <form className="tt-filter-panel" method="get">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_180px_180px_180px]">
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
                  placeholder="Assessment or course"
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
              <label className="tt-label" htmlFor="type">
                Type
              </label>
              <select
                className="tt-input"
                defaultValue={filters.type ?? ""}
                id="type"
                name="type"
              >
                <option value="">All types</option>
                <option value={AssessmentType.PRE_TEST}>Pre-test</option>
                <option value={AssessmentType.QUIZ}>Quiz</option>
                <option value={AssessmentType.MOCK_EXAM}>Mock exam</option>
                <option value={AssessmentType.POST_TEST}>Post-test</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="tt-label" htmlFor="dateFrom">
                From
              </label>
              <input
                className="tt-input"
                defaultValue={query.dateFrom?.toString()}
                id="dateFrom"
                name="dateFrom"
                type="date"
              />
            </div>
            <div className="space-y-2">
              <label className="tt-label" htmlFor="dateTo">
                To
              </label>
              <input
                className="tt-input"
                defaultValue={query.dateTo?.toString()}
                id="dateTo"
                name="dateTo"
                type="date"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button asChild type="button" variant="outline">
              <Link href="/dashboard/tutor/assessments">Reset</Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        <div className="mt-6">
          {assessments.length === 0 ? (
            <AssignmentEmptyState
              actionHref="/dashboard/tutor/courses"
              actionLabel="Choose a course"
              description="Create assessments from a tutor-owned course page."
              title="No assessments found"
            />
          ) : (
            <AssessmentTable
              assessments={assessments}
              editPathPrefix="/dashboard/tutor/assessments"
              viewPathPrefix="/dashboard/tutor/assessments"
            />
          )}
        </div>
      </section>
    </main>
  );
}
