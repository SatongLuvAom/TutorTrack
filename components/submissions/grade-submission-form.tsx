import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SubmissionListItem } from "@/services/submission.service";

type GradeAction = (formData: FormData) => Promise<void>;

type GradeSubmissionFormProps = {
  action: GradeAction;
  submission: SubmissionListItem;
  returnTo: string;
};

export function GradeSubmissionForm({
  action,
  submission,
  returnTo,
}: GradeSubmissionFormProps) {
  return (
    <form action={action} className="tt-card p-5">
      <input name="submissionId" type="hidden" value={submission.id} />
      <input name="returnTo" type="hidden" value={returnTo} />
      <div className="flex items-center gap-2">
        <ClipboardCheck aria-hidden="true" className="size-5 text-primary" />
        <h2 className="tt-heading text-xl">Grade submission</h2>
      </div>

      <div className="mt-5 grid gap-5">
        <div className="space-y-2">
          <label className="tt-label" htmlFor="score">
            Score
          </label>
          <input
            className="tt-input"
            defaultValue={submission.score ?? ""}
            id="score"
            max={submission.assignment.maxScore ?? undefined}
            min={0}
            name="score"
            required
            step="0.01"
            type="number"
          />
          <p className="text-xs text-muted-foreground">
            Max score: {submission.assignment.maxScore ?? "-"}
          </p>
        </div>

        <div className="space-y-2">
          <label className="tt-label" htmlFor="feedback">
            Feedback
          </label>
          <textarea
            className="tt-input min-h-32 py-3"
            defaultValue={submission.feedback ?? ""}
            id="feedback"
            maxLength={2000}
            name="feedback"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="submit">
          <ClipboardCheck aria-hidden="true" />
          Save grade
        </Button>
      </div>
    </form>
  );
}
