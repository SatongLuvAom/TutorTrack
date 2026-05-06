import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AssignmentSubmissionSummary } from "@/services/assignment.service";

type SubmissionAction = (formData: FormData) => Promise<void>;

type SubmissionFormProps = {
  action: SubmissionAction;
  assignmentId: string;
  submission?: AssignmentSubmissionSummary | null;
  returnTo: string;
};

export function SubmissionForm({
  action,
  assignmentId,
  submission,
  returnTo,
}: SubmissionFormProps) {
  const isGraded = Boolean(submission?.gradedAt);

  return (
    <form action={action} className="tt-card p-5">
      <input name="assignmentId" type="hidden" value={assignmentId} />
      <input name="returnTo" type="hidden" value={returnTo} />
      {submission ? (
        <input name="submissionId" type="hidden" value={submission.id} />
      ) : null}
      <div className="flex items-center gap-2">
        <Send aria-hidden="true" className="size-5 text-primary" />
        <h2 className="tt-heading text-xl">Submission</h2>
      </div>

      {isGraded ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          This submission has already been graded and cannot be edited.
        </p>
      ) : null}

      <div className="mt-5 space-y-5">
        <div className="space-y-2">
          <label className="tt-label" htmlFor="textAnswer">
            Text answer
          </label>
          <textarea
            className="tt-input min-h-40 py-3"
            defaultValue={submission?.content ?? ""}
            disabled={isGraded}
            id="textAnswer"
            maxLength={5000}
            name="textAnswer"
            placeholder="Write your answer here"
          />
        </div>

        <div className="space-y-2">
          <label className="tt-label" htmlFor="fileUrl">
            File URL
          </label>
          <input
            className="tt-input"
            defaultValue={submission?.fileUrl ?? ""}
            disabled={isGraded}
            id="fileUrl"
            maxLength={500}
            name="fileUrl"
            placeholder="https://..."
            type="url"
          />
          <p className="text-xs text-muted-foreground">
            Submit at least one of text answer or file URL.
          </p>
        </div>
      </div>

      {!isGraded ? (
        <div className="mt-6 flex justify-end">
          <Button type="submit">
            <Send aria-hidden="true" />
            {submission ? "Update submission" : "Submit assignment"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
