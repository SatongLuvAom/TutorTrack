import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { AssignmentEmptyState } from "@/components/assignments/assignment-empty-state";
import { SkillProgressTable } from "@/components/skills/skill-progress-table";
import { Button } from "@/components/ui/button";
import { SkillLevel } from "@/lib/generated/prisma/enums";
import { requireAdmin } from "@/lib/guards";
import {
  getAdminSkillProgress,
  getAdminSkillProgressFilterOptions,
  parseSkillProgressFilters,
} from "@/services/skill-progress.service";

export const dynamic = "force-dynamic";

type AdminSkillProgressPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminSkillProgressPage({
  searchParams,
}: AdminSkillProgressPageProps) {
  await requireAdmin();
  const query = searchParams ? await searchParams : {};
  const filters = parseSkillProgressFilters(query);
  const [rows, options] = await Promise.all([
    getAdminSkillProgress(filters),
    getAdminSkillProgressFilterOptions(),
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
          <h1 className="tt-heading mt-2 text-3xl">Skill progress</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Read-only skill progress across all students and courses.
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
                  placeholder="Student, skill, course"
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
              <label className="tt-label" htmlFor="level">
                Level
              </label>
              <select
                className="tt-input"
                defaultValue={filters.level ?? ""}
                id="level"
                name="level"
              >
                <option value="">All</option>
                <option value={SkillLevel.NEEDS_WORK}>Needs work</option>
                <option value={SkillLevel.BASIC}>Basic</option>
                <option value={SkillLevel.GOOD}>Good</option>
                <option value={SkillLevel.EXCELLENT}>Excellent</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button asChild type="button" variant="outline">
              <Link href="/dashboard/admin/skill-progress">Reset</Link>
            </Button>
            <Button type="submit">Apply filters</Button>
          </div>
        </form>

        <div className="mt-6">
          {rows.length === 0 ? (
            <AssignmentEmptyState
              description="No skill progress records match this filter set."
              title="No skill progress found"
            />
          ) : (
            <SkillProgressTable rows={rows} showStudent showTutor />
          )}
        </div>
      </section>
    </main>
  );
}
