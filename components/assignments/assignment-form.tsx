import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AssignmentListItem } from "@/services/assignment.service";

type AssignmentAction = (formData: FormData) => Promise<void>;

type AssignmentFormProps = {
  action: AssignmentAction;
  courseId: string;
  assignment?: AssignmentListItem;
  returnTo: string;
};

function toDatetimeLocal(value: Date | null | undefined): string {
  if (!value) {
    return "";
  }

  return value.toISOString().slice(0, 16);
}

export function AssignmentForm({
  action,
  courseId,
  assignment,
  returnTo,
}: AssignmentFormProps) {
  return (
    <form action={action} className="tt-card p-5">
      <input name="courseId" type="hidden" value={courseId} />
      <input name="returnTo" type="hidden" value={returnTo} />
      {assignment ? (
        <input name="assignmentId" type="hidden" value={assignment.id} />
      ) : null}

      <div className="flex items-center gap-2">
        <ClipboardCheck aria-hidden="true" className="size-5 text-primary" />
        <h2 className="tt-heading text-xl">
          {assignment ? "Edit assignment" : "Create assignment"}
        </h2>
      </div>

      <div className="mt-5 grid gap-5">
        <div className="space-y-2">
          <label className="tt-label" htmlFor="title">
            Title
          </label>
          <input
            className="tt-input"
            defaultValue={assignment?.title ?? ""}
            id="title"
            maxLength={160}
            name="title"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="tt-label" htmlFor="description">
            Description
          </label>
          <textarea
            className="tt-input min-h-36 py-3"
            defaultValue={assignment?.description ?? ""}
            id="description"
            maxLength={2000}
            name="description"
            required
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="tt-label" htmlFor="dueDate">
              Due date
            </label>
            <input
              className="tt-input"
              defaultValue={toDatetimeLocal(assignment?.dueDate)}
              id="dueDate"
              name="dueDate"
              required
              type="datetime-local"
            />
          </div>

          <div className="space-y-2">
            <label className="tt-label" htmlFor="maxScore">
              Max score
            </label>
            <input
              className="tt-input"
              defaultValue={assignment?.maxScore ?? 100}
              id="maxScore"
              min={0.01}
              name="maxScore"
              required
              step="0.01"
              type="number"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="submit">
          <ClipboardCheck aria-hidden="true" />
          {assignment ? "Save assignment" : "Create assignment"}
        </Button>
      </div>
    </form>
  );
}
