import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AssessmentScoreTable } from "@/components/assessments/assessment-score-table";
import { AssignmentEmptyState } from "@/components/assignments/assignment-empty-state";
import { Button } from "@/components/ui/button";
import { AssessmentType } from "@/lib/generated/prisma/enums";
import { requireStudent } from "@/lib/guards";
import {
  getStudentAssessmentCourseOptions,
  getStudentAssessments,
  parseAssessmentFilters,
} from "@/services/assessment.service";

export const dynamic = "force-dynamic";

type StudentAssessmentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StudentAssessmentsPage({
  searchParams,
}: StudentAssessmentsPageProps) {
  const user = await requireStudent();
  const query = searchParams ? await searchParams : {};
  const filters = parseAssessmentFilters(query);
  const [assessments, courses] = await Promise.all([
    getStudentAssessments(user.id, filters),
    getStudentAssessmentCourseOptions(user.id),
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
          <h1 className="tt-heading mt-2 text-3xl">Assessment results</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Scores from your ACTIVE enrollments only.
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
        <form className="tt-filter-panel" method="get">
          <div className="grid gap-4 md:grid-cols-2">
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
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button asChild type="button" variant="outline">
              <Link href="/dashboard/student/assessments">Reset</Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        <div className="mt-6">
          {assessments.length === 0 ? (
            <AssignmentEmptyState
              description="Assessment results appear after your tutor records scores."
              title="No assessment results found"
            />
          ) : (
            <AssessmentScoreTable assessments={assessments} showTutor />
          )}
        </div>
      </section>
    </main>
  );
}
