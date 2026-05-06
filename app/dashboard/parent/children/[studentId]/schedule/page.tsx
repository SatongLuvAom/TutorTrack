import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseEmptyState } from "@/components/courses/course-empty-state";
import { SessionTable } from "@/components/sessions/session-table";
import { requireParent, requirePermission } from "@/lib/guards";
import { canViewStudentSchedule } from "@/lib/permissions";
import { getParentChildSummary } from "@/services/enrollment.service";
import { getParentChildSchedule } from "@/services/session.service";

export const dynamic = "force-dynamic";

type ParentChildSchedulePageProps = {
  params: Promise<{ studentId: string }>;
};

export default async function ParentChildSchedulePage({
  params,
}: ParentChildSchedulePageProps) {
  const user = await requireParent();
  const { studentId } = await params;
  await requirePermission(canViewStudentSchedule(user, studentId));
  const [child, sessions] = await Promise.all([
    getParentChildSummary(user.id, studentId),
    getParentChildSchedule(user.id, studentId),
  ]);

  if (!child) {
    notFound();
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
          <h1 className="tt-heading mt-2 text-3xl">
            Schedule for {child.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Parents can view schedules only for active linked children.
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
        {sessions.length === 0 ? (
          <CourseEmptyState
            actionHref={`/dashboard/parent/children/${studentId}/enrollments`}
            actionLabel="Open enrollments"
            description="Active course sessions for this child will appear here."
            title="No scheduled sessions"
          />
        ) : (
          <SessionTable
            returnTo={`/dashboard/parent/children/${studentId}/schedule`}
            sessions={sessions}
            viewHrefFor="course"
            viewPathPrefix="/courses"
          />
        )}
      </section>
    </main>
  );
}
