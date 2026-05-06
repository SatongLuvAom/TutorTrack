import Link from "next/link";
import { SessionActions } from "@/components/sessions/session-actions";
import { SessionStatusBadge } from "@/components/sessions/session-status-badge";
import type { ManagedSession } from "@/services/session.service";

type SessionAction = (formData: FormData) => Promise<void>;

type SessionTableProps = {
  sessions: ManagedSession[];
  returnTo: string;
  viewPathPrefix: string;
  editPathPrefix?: string;
  showTutor?: boolean;
  showActions?: boolean;
  viewHrefFor?: "session" | "course";
  cancelAction?: SessionAction;
  completeAction?: SessionAction;
};

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

export function SessionTable({
  sessions,
  returnTo,
  viewPathPrefix,
  editPathPrefix,
  showTutor = false,
  showActions = false,
  viewHrefFor = "session",
  cancelAction,
  completeAction,
}: SessionTableProps) {
  return (
    <div className="tt-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-secondary/65 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Session</th>
              <th className="px-4 py-3 font-medium">Course</th>
              {showTutor ? (
                <th className="px-4 py-3 font-medium">Tutor</th>
              ) : null}
              <th className="px-4 py-3 font-medium">Schedule</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Attendance</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sessions.map((session) => {
              const viewHref =
                viewHrefFor === "course"
                  ? `/courses/${session.course.id}`
                  : `${viewPathPrefix}/${session.id}`;

              return (
                <tr
                  className="align-top transition-colors hover:bg-secondary/35"
                  key={session.id}
                >
                  <td className="px-4 py-4">
                    <Link
                      className="font-semibold text-primary hover:underline"
                      href={viewHref}
                    >
                      {session.title}
                    </Link>
                  {session.description ? (
                    <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                      {session.description}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium">{session.course.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {session.course.subject.name}
                  </p>
                </td>
                {showTutor ? (
                  <td className="px-4 py-4">
                    <p className="font-medium">{session.course.tutor.name}</p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">
                      {session.course.tutor.email}
                    </p>
                  </td>
                ) : null}
                <td className="px-4 py-4">
                  {formatDateRange(session.startsAt, session.endsAt)}
                </td>
                <td className="px-4 py-4">
                  <SessionStatusBadge status={session.status} />
                </td>
                <td className="px-4 py-4">
                  <p>
                    {session.stats.attendanceCount} /{" "}
                    {session.stats.activeEnrollmentCount}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    active students marked
                  </p>
                </td>
                <td className="px-4 py-4">
                  {showActions ? (
                    <SessionActions
                      cancelAction={cancelAction}
                      completeAction={completeAction}
                      editHref={
                        editPathPrefix
                          ? `${editPathPrefix}/${session.id}/edit`
                          : undefined
                      }
                      returnTo={returnTo}
                      sessionId={session.id}
                      status={session.status}
                      viewHref={viewHref}
                    />
                  ) : (
                    <Link
                      className="text-sm font-semibold text-primary hover:underline"
                      href={viewHref}
                    >
                      View
                    </Link>
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
