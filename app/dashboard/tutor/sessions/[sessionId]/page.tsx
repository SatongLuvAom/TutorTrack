import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, LinkIcon } from "lucide-react";
import { SessionStatus } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { AttendanceTable } from "@/components/attendance/attendance-table";
import { BulkAttendanceForm } from "@/components/attendance/bulk-attendance-form";
import { SessionActions } from "@/components/sessions/session-actions";
import { SessionStatusBadge } from "@/components/sessions/session-status-badge";
import { requirePermission, requireTutor } from "@/lib/guards";
import { canViewSession, canViewSessionAttendance } from "@/lib/permissions";
import {
  getSessionAttendance,
  getAdminAttendance,
} from "@/services/attendance.service";
import { getTutorSessionById } from "@/services/session.service";
import {
  bulkMarkAttendanceAction,
  cancelTutorSessionAction,
  completeTutorSessionAction,
} from "@/app/dashboard/tutor/sessions/actions";

export const dynamic = "force-dynamic";

type TutorSessionDetailPageProps = {
  params: Promise<{ sessionId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateRange(startsAt: Date, endsAt: Date | null): string {
  const start = new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(startsAt);

  if (!endsAt) {
    return start;
  }

  const end = new Intl.DateTimeFormat("th-TH", {
    timeStyle: "short",
  }).format(endsAt);

  return `${start} - ${end}`;
}

export default async function TutorSessionDetailPage({
  params,
  searchParams,
}: TutorSessionDetailPageProps) {
  const user = await requireTutor();
  const { sessionId } = await params;
  await requirePermission(canViewSession(user, sessionId));
  await requirePermission(canViewSessionAttendance(user, sessionId));
  const query = searchParams ? await searchParams : {};
  const [session, attendanceRows, markedRecords] = await Promise.all([
    getTutorSessionById(user.id, sessionId),
    getSessionAttendance(sessionId),
    getAdminAttendance({ sessionId }),
  ]);

  if (!session) {
    notFound();
  }

  const returnTo = `/dashboard/tutor/sessions/${sessionId}`;
  const errorMessage = firstValue(query.error);

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/tutor/sessions">
              <ArrowLeft aria-hidden="true" />
              Sessions
            </Link>
          </Button>
          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <SessionStatusBadge status={session.status} />
              <h1 className="tt-heading mt-4 text-3xl">{session.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                {session.course.title} - {session.course.subject.name}
              </p>
            </div>
            <SessionActions
              cancelAction={cancelTutorSessionAction}
              completeAction={completeTutorSessionAction}
              editHref={`/dashboard/tutor/sessions/${session.id}/edit`}
              returnTo={returnTo}
              sessionId={session.id}
              status={session.status}
              viewHref={returnTo}
            />
          </div>
        </div>
      </section>

      <section className="tt-shell grid gap-6 py-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {errorMessage ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          {session.status === SessionStatus.CANCELLED ? (
            <div className="tt-card p-5">
              <p className="font-semibold">Session cancelled</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Attendance is locked for cancelled sessions.
              </p>
            </div>
          ) : (
            <BulkAttendanceForm
              action={bulkMarkAttendanceAction}
              records={attendanceRows}
              returnTo={returnTo}
              sessionId={session.id}
            />
          )}

          {markedRecords.length > 0 ? (
            <section>
              <h2 className="tt-heading mb-4 text-xl">Marked records</h2>
              <AttendanceTable records={markedRecords} showStudent />
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="tt-card p-5">
            <Calendar aria-hidden="true" className="size-5 text-primary" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              Schedule
            </p>
            <p className="mt-2 text-sm font-semibold">
              {formatDateRange(session.startsAt, session.endsAt)}
            </p>
          </div>
          <div className="tt-card p-5">
            <p className="text-sm font-medium text-muted-foreground">
              Active students
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {session.stats.activeEnrollmentCount}
            </p>
          </div>
          <div className="tt-card p-5">
            <p className="text-sm font-medium text-muted-foreground">
              Attendance marked
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {session.stats.attendanceCount}
            </p>
          </div>
          {session.meetingUrl ? (
            <Button asChild className="w-full" variant="outline">
              <a href={session.meetingUrl} rel="noreferrer" target="_blank">
                <LinkIcon aria-hidden="true" />
                Open meeting
              </a>
            </Button>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
