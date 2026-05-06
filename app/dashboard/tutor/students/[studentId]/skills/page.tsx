import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { AssignmentEmptyState } from "@/components/assignments/assignment-empty-state";
import { BulkSkillProgressForm } from "@/components/skills/bulk-skill-progress-form";
import { StudentSkillSummary } from "@/components/skills/student-skill-summary";
import { Button } from "@/components/ui/button";
import { requirePermission, requireTutor } from "@/lib/guards";
import { canViewStudentSkillProgress } from "@/lib/permissions";
import { bulkUpdateTutorSkillProgressAction } from "@/app/dashboard/tutor/skills/actions";
import {
  getTutorSkillProgressCourseOptions,
  getTutorStudentSkillProgress,
  parseSkillProgressFilters,
  type SkillProgressMatrixItem,
} from "@/services/skill-progress.service";

export const dynamic = "force-dynamic";

type TutorStudentSkillsPageProps = {
  params: Promise<{ studentId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function groupByCourse(rows: SkillProgressMatrixItem[]) {
  const groups = new Map<string, SkillProgressMatrixItem[]>();

  for (const row of rows) {
    groups.set(row.skill.course.id, [
      ...(groups.get(row.skill.course.id) ?? []),
      row,
    ]);
  }

  return Array.from(groups.entries()).map(([courseId, courseRows]) => ({
    courseId,
    title: courseRows[0]?.skill.course.title ?? "Course",
    rows: courseRows,
  }));
}

export default async function TutorStudentSkillsPage({
  params,
  searchParams,
}: TutorStudentSkillsPageProps) {
  const user = await requireTutor();
  const { studentId } = await params;
  await requirePermission(canViewStudentSkillProgress(user, studentId));
  const query = searchParams ? await searchParams : {};
  const filters = parseSkillProgressFilters(query);
  const [rows, courses] = await Promise.all([
    getTutorStudentSkillProgress(user.id, studentId, filters),
    getTutorSkillProgressCourseOptions(user.id),
  ]);
  const student = rows[0]?.student;

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
          <h1 className="tt-heading mt-2 text-3xl">
            Skill progress for {student?.displayName ?? student?.name ?? "student"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Only skills from this tutor&apos;s courses with ACTIVE enrollment are
            editable.
          </p>
        </div>
      </section>

      <section className="tt-shell space-y-6 py-8">
        <form className="tt-filter-panel" method="get">
          <div className="grid gap-4 md:grid-cols-[1fr_240px]">
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
                  placeholder="Skill or note"
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
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button asChild type="button" variant="outline">
              <Link href={`/dashboard/tutor/students/${studentId}/skills`}>
                Reset
              </Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        <StudentSkillSummary rows={rows} />
        {rows.length === 0 ? (
          <AssignmentEmptyState
            description="This student has no ACTIVE enrollment in your courses with skills."
            title="No skill progress found"
          />
        ) : (
          <div className="space-y-6">
            {groupByCourse(rows).map((group) => (
              <section className="space-y-3" key={group.courseId}>
                <h2 className="tt-heading text-xl">{group.title}</h2>
                <BulkSkillProgressForm
                  action={bulkUpdateTutorSkillProgressAction}
                  courseId={group.courseId}
                  rows={group.rows}
                />
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
