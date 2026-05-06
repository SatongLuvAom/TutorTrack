import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { AssessmentTable } from "@/components/assessments/assessment-table";
import { AssignmentEmptyState } from "@/components/assignments/assignment-empty-state";
import { Button } from "@/components/ui/button";
import { AssessmentType } from "@/lib/generated/prisma/enums";
import { requirePermission, requireTutor } from "@/lib/guards";
import { canEditCourse } from "@/lib/permissions";
import { getTutorCourseById } from "@/services/course.service";
import {
  getTutorCourseAssessments,
  parseAssessmentFilters,
} from "@/services/assessment.service";

export const dynamic = "force-dynamic";

type TutorCourseAssessmentsPageProps = {
  params: Promise<{ courseId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TutorCourseAssessmentsPage({
  params,
  searchParams,
}: TutorCourseAssessmentsPageProps) {
  const user = await requireTutor();
  const { courseId } = await params;
  await requirePermission(canEditCourse(user, courseId));
  const query = searchParams ? await searchParams : {};
  const filters = parseAssessmentFilters(query);
  const [course, assessments] = await Promise.all([
    getTutorCourseById(user.id, courseId),
    getTutorCourseAssessments(user.id, courseId, filters),
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
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="tt-kicker">Tutor dashboard</p>
              <h1 className="tt-heading mt-2 text-3xl">
                Assessments for {course.title}
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Scores are recorded only for ACTIVE enrolled students.
              </p>
            </div>
            <Button asChild>
              <Link href={`/dashboard/tutor/courses/${courseId}/assessments/new`}>
                <Plus aria-hidden="true" />
                New assessment
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="tt-shell py-8">
        <form
          action={`/dashboard/tutor/courses/${courseId}/assessments`}
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
                  placeholder="Assessment title"
                  type="search"
                />
              </div>
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
              <Link href={`/dashboard/tutor/courses/${courseId}/assessments`}>
                Reset
              </Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        <div className="mt-6">
          {assessments.length === 0 ? (
            <AssignmentEmptyState
              actionHref={`/dashboard/tutor/courses/${courseId}/assessments/new`}
              actionLabel="Create assessment"
              description="No assessments match this course and filter set."
              title="No assessments found"
            />
          ) : (
            <AssessmentTable
              assessments={assessments}
              editPathPrefix="/dashboard/tutor/assessments"
              showCourse={false}
              viewPathPrefix="/dashboard/tutor/assessments"
            />
          )}
        </div>
      </section>
    </main>
  );
}
