import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProgressNoteFormProps = {
  studentId: string;
  courseId: string;
  action: (formData: FormData) => Promise<void>;
  error?: string;
};

export function ProgressNoteForm({
  studentId,
  courseId,
  action,
  error,
}: ProgressNoteFormProps) {
  return (
    <form action={action} className="tt-card p-5">
      <input name="studentId" type="hidden" value={studentId} />
      <input name="courseId" type="hidden" value={courseId} />
      <p className="tt-kicker">Tutor progress note</p>
      <h2 className="tt-heading mt-1 text-xl">Add a new note</h2>
      {error ? (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="tt-label">Strengths</span>
          <textarea className="tt-input min-h-28 py-3" name="strengths" />
        </label>
        <label className="space-y-2">
          <span className="tt-label">Weaknesses</span>
          <textarea className="tt-input min-h-28 py-3" name="weaknesses" />
        </label>
        <label className="space-y-2">
          <span className="tt-label">Behavior note</span>
          <textarea className="tt-input min-h-28 py-3" name="behaviorNote" />
        </label>
        <label className="space-y-2">
          <span className="tt-label">Next plan</span>
          <textarea className="tt-input min-h-28 py-3" name="nextPlan" />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="tt-label">Parent summary</span>
          <textarea className="tt-input min-h-28 py-3" name="parentSummary" />
        </label>
      </div>
      <div className="mt-5 flex justify-end">
        <Button type="submit">
          <Save aria-hidden="true" />
          Save note
        </Button>
      </div>
    </form>
  );
}
