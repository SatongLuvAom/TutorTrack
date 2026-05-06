import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AssignmentEmptyState } from "@/components/assignments/assignment-empty-state";
import { SkillMatrix } from "@/components/skills/skill-matrix";
import { StudentSkillSummary } from "@/components/skills/student-skill-summary";
import { Button } from "@/components/ui/button";
import { requireStudent } from "@/lib/guards";
import {
  getSkillProgressCourseOptionsForStudent,
  getStudentSkillProgress,
  parseSkillProgressFilters,
} from "@/services/skill-progress.service";

export const dynamic = "force-dynamic";

type StudentSkillsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StudentSkillsPage({
  searchParams,
}: StudentSkillsPageProps) {
  const user = await requireStudent();
  const query = searchParams ? await searchParams : {};
  const filters = parseSkillProgressFilters(query);
  const [rows, courses] = await Promise.all([
    getStudentSkillProgress(user.id, filters),
    getSkillProgressCourseOptionsForStudent(user.id),
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
          <h1 className="tt-heading mt-2 text-3xl">Skill progress</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Read-only skill levels from your ACTIVE enrollments.
          </p>
        </div>
      </section>

      <section className="tt-shell space-y-6 py-8">
        <form className="tt-filter-panel" method="get">
          <div className="max-w-md space-y-2">
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
          <div className="mt-4 flex justify-end gap-2">
            <Button asChild type="button" variant="outline">
              <Link href="/dashboard/student/skills">Reset</Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        <StudentSkillSummary rows={rows} />
        {rows.length === 0 ? (
          <AssignmentEmptyState
            description="Skill progress appears after a tutor updates the course skill matrix."
            title="No skill progress found"
          />
        ) : (
          <SkillMatrix rows={rows} />
        )}
      </section>
    </main>
  );
}
