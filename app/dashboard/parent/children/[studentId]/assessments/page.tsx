import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AssessmentScoreTable } from "@/components/assessments/assessment-score-table";
import { AssignmentEmptyState } from "@/components/assignments/assignment-empty-state";
import { Button } from "@/components/ui/button";
import { AssessmentType } from "@/lib/generated/prisma/enums";
import { requireParent, requirePermission } from "@/lib/guards";
import { canViewStudentAssessments } from "@/lib/permissions";
import {
  getParentChildAssessmentCourseOptions,
  getParentChildAssessments,
  parseAssessmentFilters,
} from "@/services/assessment.service";

export const dynamic = "force-dynamic";

type ParentChildAssessmentsPageProps = {
  params: Promise<{ studentId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ParentChildAssessmentsPage({
  params,
  searchParams,
}: ParentChildAssessmentsPageProps) {
  const user = await requireParent();
  const { studentId } = await params;
  await requirePermission(canViewStudentAssessments(user, studentId));
  const query = searchParams ? await searchParams : {};
  const filters = parseAssessmentFilters(query);
  const [assessments, courses] = await Promise.all([
    getParentChildAssessments(user.id, studentId, filters),
    getParentChildAssessmentCourseOptions(user.id, studentId),
  ]);

  if (courses.length === 0 && assessments.length === 0) {
    const canView = await canViewStudentAssessments(user, studentId);
    if (!canView) {
      notFound();
    }
  }

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/parent">
              <ArrowLeft aria-hidden="true" />
              Parent dashboard
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Parent dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">Child assessments</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Read-only scores for an active linked child.
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
              <Link href={`/dashboard/parent/children/${studentId}/assessments`}>
                Reset
              </Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        <div className="mt-6">
          {assessments.length === 0 ? (
            <AssignmentEmptyState
              description="Assessment results appear after the tutor records scores."
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
