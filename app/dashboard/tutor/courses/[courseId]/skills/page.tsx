import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { AssignmentEmptyState } from "@/components/assignments/assignment-empty-state";
import { BulkSkillProgressForm } from "@/components/skills/bulk-skill-progress-form";
import { Button } from "@/components/ui/button";
import { SkillLevel } from "@/lib/generated/prisma/enums";
import { requirePermission, requireTutor } from "@/lib/guards";
import { canManageSkillProgress } from "@/lib/permissions";
import { bulkUpdateTutorSkillProgressAction } from "@/app/dashboard/tutor/skills/actions";
import { getTutorCourseById } from "@/services/course.service";
import {
  getTutorCourseSkillProgress,
  parseSkillProgressFilters,
} from "@/services/skill-progress.service";

export const dynamic = "force-dynamic";

type TutorCourseSkillsPageProps = {
  params: Promise<{ courseId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TutorCourseSkillsPage({
  params,
  searchParams,
}: TutorCourseSkillsPageProps) {
  const user = await requireTutor();
  const { courseId } = await params;
  await requirePermission(canManageSkillProgress(user, courseId));
  const query = searchParams ? await searchParams : {};
  const filters = parseSkillProgressFilters(query);
  const [course, rows] = await Promise.all([
    getTutorCourseById(user.id, courseId),
    getTutorCourseSkillProgress(user.id, courseId, filters),
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
          <p className="tt-kicker mt-5">Tutor dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">
            Skill matrix for {course.title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Update skill levels only for ACTIVE enrolled students.
          </p>
        </div>
      </section>

      <section className="tt-shell space-y-6 py-8">
        <form
          action={`/dashboard/tutor/courses/${courseId}/skills`}
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
                  placeholder="Student or skill"
                  type="search"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="tt-label" htmlFor="level">
                Level
              </label>
              <select
                className="tt-input"
                defaultValue={filters.level ?? ""}
                id="level"
                name="level"
              >
                <option value="">All levels</option>
                <option value={SkillLevel.NEEDS_WORK}>Needs work</option>
                <option value={SkillLevel.BASIC}>Basic</option>
                <option value={SkillLevel.GOOD}>Good</option>
                <option value={SkillLevel.EXCELLENT}>Excellent</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button asChild type="button" variant="outline">
              <Link href={`/dashboard/tutor/courses/${courseId}/skills`}>
                Reset
              </Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        {rows.length === 0 ? (
          <AssignmentEmptyState
            description="This course needs ACTIVE students and course skills before skill progress can be updated."
            title="No skill rows found"
          />
        ) : (
          <BulkSkillProgressForm
            action={bulkUpdateTutorSkillProgressAction}
            courseId={courseId}
            rows={rows}
            showStudent
          />
        )}
      </section>
    </main>
  );
}
