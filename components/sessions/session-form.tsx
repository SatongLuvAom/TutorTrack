import Link from "next/link";
import { AlertTriangle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionStatusBadge } from "@/components/sessions/session-status-badge";
import type {
  ManagedSession,
  SessionCourseOption,
} from "@/services/session.service";

type SessionFormAction = (formData: FormData) => Promise<void>;

type SessionFormProps = {
  action: SessionFormAction;
  cancelHref: string;
  courses: SessionCourseOption[];
  session?: ManagedSession;
  fixedCourseId?: string;
  errorMessage?: string;
};

function toDateTimeInput(value: Date | null | undefined): string {
  if (!value) {
    return "";
  }

  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);

  return local.toISOString().slice(0, 16);
}

function defaultEnd(session: ManagedSession | undefined): Date | null {
  if (!session) {
    return null;
  }

  if (session.endsAt) {
    return session.endsAt;
  }

  return new Date(session.startsAt.getTime() + 60 * 60_000);
}

export function SessionForm({
  action,
  cancelHref,
  courses,
  session,
  fixedCourseId,
  errorMessage,
}: SessionFormProps) {
  const selectedCourseId = fixedCourseId ?? session?.courseId ?? "";
  const fixedCourse = courses.find((course) => course.id === selectedCourseId);

  return (
    <form action={action} className="tt-card p-5">
      {session ? <input name="sessionId" type="hidden" value={session.id} /> : null}
      {fixedCourseId ? (
        <input name="courseId" type="hidden" value={fixedCourseId} />
      ) : null}

      {errorMessage ? (
        <div className="mb-5 flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      ) : null}

      {session ? (
        <div className="mb-5">
          <SessionStatusBadge status={session.status} />
        </div>
      ) : null}

      <div className="grid gap-5">
        <div className="space-y-2">
          <label className="tt-label" htmlFor="courseId">
            Course
          </label>
          {fixedCourseId ? (
            <div className="rounded-lg border border-input bg-secondary/45 px-3 py-2 text-sm">
              <p className="font-medium">{fixedCourse?.title ?? "Selected course"}</p>
              {fixedCourse ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {fixedCourse.subjectName} - {fixedCourse.status}
                </p>
              ) : null}
            </div>
          ) : (
            <select
              className="tt-input"
              defaultValue={selectedCourseId}
              id="courseId"
              name="courseId"
              required
            >
              <option disabled value="">
                Select published course
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} - {course.subjectName}
                </option>
              ))}
            </select>
          )}
          {courses.length === 0 ? (
            <p className="text-xs leading-5 text-muted-foreground">
              Publish a course before creating sessions.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="tt-label" htmlFor="title">
            Title
          </label>
          <input
            className="tt-input"
            defaultValue={session?.title}
            id="title"
            maxLength={160}
            name="title"
            required
            type="text"
          />
        </div>

        <div className="space-y-2">
          <label className="tt-label" htmlFor="description">
            Description
          </label>
          <textarea
            className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/40"
            defaultValue={session?.description ?? ""}
            id="description"
            maxLength={1000}
            name="description"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="tt-label" htmlFor="scheduledStart">
              Scheduled start
            </label>
            <input
              className="tt-input"
              defaultValue={toDateTimeInput(session?.startsAt)}
              id="scheduledStart"
              name="scheduledStart"
              required
              type="datetime-local"
            />
          </div>

          <div className="space-y-2">
            <label className="tt-label" htmlFor="scheduledEnd">
              Scheduled end
            </label>
            <input
              className="tt-input"
              defaultValue={toDateTimeInput(defaultEnd(session))}
              id="scheduledEnd"
              name="scheduledEnd"
              required
              type="datetime-local"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="tt-label" htmlFor="meetingLink">
            Meeting link
          </label>
          <input
            className="tt-input"
            defaultValue={session?.meetingUrl ?? ""}
            id="meetingLink"
            maxLength={500}
            name="meetingLink"
            placeholder="https://..."
            type="url"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button asChild type="button" variant="outline">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button disabled={courses.length === 0} type="submit">
          <Save aria-hidden="true" />
          Save session
        </Button>
      </div>
    </form>
  );
}
