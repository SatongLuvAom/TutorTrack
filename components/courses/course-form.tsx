import Link from "next/link";
import { AlertTriangle, Save } from "lucide-react";
import { CourseType } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { MARKETPLACE_LEVEL_OPTIONS } from "@/services/marketplace-utils";
import type {
  ManagedCourse,
  ManagedCourseSubject,
} from "@/services/course.service";

type CourseFormAction = (formData: FormData) => Promise<void>;

type CourseFormProps = {
  action: CourseFormAction;
  cancelHref: string;
  subjects: ManagedCourseSubject[];
  course?: ManagedCourse;
  errorMessage?: string;
};

function priceInBaht(course: ManagedCourse | undefined): string {
  if (!course) {
    return "0";
  }

  return String(course.priceCents / 100);
}

export function CourseForm({
  action,
  cancelHref,
  subjects,
  course,
  errorMessage,
}: CourseFormProps) {
  return (
    <form
      action={action}
      className="tt-card p-5"
    >
      {course ? <input name="courseId" type="hidden" value={course.id} /> : null}

      {errorMessage ? (
          <div className="mb-5 flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      ) : null}

      <div className="grid gap-5">
        <div className="space-y-2">
          <label className="tt-label" htmlFor="title">
            Title
          </label>
          <input
            className="tt-input"
            defaultValue={course?.title}
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
            className="min-h-32 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/40"
            defaultValue={course?.description ?? ""}
            id="description"
            maxLength={2000}
            name="description"
            required
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="tt-label" htmlFor="subjectId">
              Subject
            </label>
            <select
              className="tt-input"
              defaultValue={course?.subject.id ?? ""}
              id="subjectId"
              name="subjectId"
              required
            >
              <option disabled value="">
                Select subject
              </option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
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
              defaultValue={course?.level ?? "all-levels"}
              id="level"
              name="level"
              required
            >
              {MARKETPLACE_LEVEL_OPTIONS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="tt-label" htmlFor="courseType">
              Course type
            </label>
            <select
              className="tt-input"
              defaultValue={course?.type ?? CourseType.PRIVATE}
              id="courseType"
              name="courseType"
              required
            >
              <option value={CourseType.PRIVATE}>Private</option>
              <option value={CourseType.GROUP}>Group</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="tt-label" htmlFor="price">
              Price (THB)
            </label>
            <input
              className="tt-input"
              defaultValue={priceInBaht(course)}
              id="price"
              min={0}
              name="price"
              required
              step="1"
              type="number"
            />
          </div>

          <div className="space-y-2">
            <label className="tt-label" htmlFor="maxStudents">
              Max students
            </label>
            <input
              className="tt-input"
              defaultValue={course?.maxStudents ?? 1}
              id="maxStudents"
              min={1}
              name="maxStudents"
              required
              step="1"
              type="number"
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Private courses usually use 1 student. Use group courses for
              larger cohorts.
            </p>
          </div>

          <div className="space-y-2">
            <label className="tt-label" htmlFor="totalSessions">
              Total sessions
            </label>
            <input
              className="tt-input"
              defaultValue={course?.totalSessions ?? 1}
              id="totalSessions"
              min={1}
              name="totalSessions"
              required
              step="1"
              type="number"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button asChild type="button" variant="outline">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button type="submit">
          <Save aria-hidden="true" />
          Save course
        </Button>
      </div>
    </form>
  );
}
