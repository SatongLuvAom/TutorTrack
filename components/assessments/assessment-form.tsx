import { ClipboardPenLine } from "lucide-react";
import { AssessmentType } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import type { AssessmentListItem } from "@/services/assessment.service";

type AssessmentAction = (formData: FormData) => Promise<void>;

type AssessmentFormProps = {
  action: AssessmentAction;
  courseId: string;
  assessment?: AssessmentListItem;
  returnTo: string;
};

function toDatetimeLocal(value: Date | null | undefined): string {
  if (!value) {
    return "";
  }

  return value.toISOString().slice(0, 16);
}

export function AssessmentForm({
  action,
  courseId,
  assessment,
  returnTo,
}: AssessmentFormProps) {
  return (
    <form action={action} className="tt-card p-5">
      <input name="courseId" type="hidden" value={courseId} />
      <input name="returnTo" type="hidden" value={returnTo} />
      {assessment ? (
        <input name="assessmentId" type="hidden" value={assessment.id} />
      ) : null}

      <div className="flex items-center gap-2">
        <ClipboardPenLine aria-hidden="true" className="size-5 text-primary" />
        <h2 className="tt-heading text-xl">
          {assessment ? "Edit assessment" : "Create assessment"}
        </h2>
      </div>

      <div className="mt-5 grid gap-5">
        <div className="space-y-2">
          <label className="tt-label" htmlFor="title">
            Title
          </label>
          <input
            className="tt-input"
            defaultValue={assessment?.title ?? ""}
            id="title"
            maxLength={160}
            name="title"
            required
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="tt-label" htmlFor="type">
              Type
            </label>
            <select
              className="tt-input"
              defaultValue={assessment?.type ?? AssessmentType.QUIZ}
              id="type"
              name="type"
              required
            >
              <option value={AssessmentType.PRE_TEST}>Pre-test</option>
              <option value={AssessmentType.QUIZ}>Quiz</option>
              <option value={AssessmentType.MOCK_EXAM}>Mock exam</option>
              <option value={AssessmentType.POST_TEST}>Post-test</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="tt-label" htmlFor="takenAt">
              Date
            </label>
            <input
              className="tt-input"
              defaultValue={toDatetimeLocal(assessment?.takenAt)}
              id="takenAt"
              name="takenAt"
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
              defaultValue={assessment?.maxScore ?? 100}
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
          <ClipboardPenLine aria-hidden="true" />
          {assessment ? "Save assessment" : "Create assessment"}
        </Button>
      </div>
    </form>
  );
}
