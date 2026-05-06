import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseEmptyState } from "@/components/courses/course-empty-state";
import { SessionTable } from "@/components/sessions/session-table";
import { requireStudent } from "@/lib/guards";
import { getStudentSchedule } from "@/services/session.service";

export const dynamic = "force-dynamic";

export default async function StudentSchedulePage() {
  const user = await requireStudent();
  const sessions = await getStudentSchedule(user.id);

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
          <h1 className="tt-heading mt-2 text-3xl">My schedule</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            View sessions from your ACTIVE course enrollments only.
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
        {sessions.length === 0 ? (
          <CourseEmptyState
            actionHref="/courses"
            actionLabel="Browse courses"
            description="Active enrollments with scheduled sessions will appear here."
            title="No scheduled sessions"
          />
        ) : (
          <SessionTable
            returnTo="/dashboard/student/schedule"
            sessions={sessions}
            viewHrefFor="course"
            viewPathPrefix="/courses"
          />
        )}
      </section>
    </main>
  );
}
