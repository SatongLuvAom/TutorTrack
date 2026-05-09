import { MessageSquareText } from "lucide-react";
import { formatProgressDate } from "./progress-utils";

export type ProgressNoteDisplay = {
  id: string;
  note: string;
  strengths: string | null;
  weaknesses: string | null;
  recommendedNextSteps: string | null;
  tutorName: string;
  createdAt: Date;
};

type ProgressNoteCardProps = {
  note: ProgressNoteDisplay | null;
  title?: string;
};

export function ProgressNoteCard({
  note,
  title = "Latest tutor note",
}: ProgressNoteCardProps) {
  if (!note) {
    return (
      <section className="tt-card p-5">
        <p className="tt-kicker">{title}</p>
        <h2 className="tt-heading mt-1 text-xl">No tutor note yet</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Tutor notes will appear here after the tutor records progress.
        </p>
      </section>
    );
  }

  return (
    <section className="tt-card p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-secondary p-2 text-primary">
          <MessageSquareText aria-hidden="true" className="size-5" />
        </div>
        <div>
          <p className="tt-kicker">{title}</p>
          <h2 className="tt-heading mt-1 text-xl">{note.tutorName}</h2>
          <p className="text-xs text-muted-foreground">
            {formatProgressDate(note.createdAt)}
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
        <p className="rounded-lg bg-muted px-3 py-2">{note.note}</p>
        {note.strengths ? <p>Strengths: {note.strengths}</p> : null}
        {note.weaknesses ? <p>Weaknesses: {note.weaknesses}</p> : null}
        {note.recommendedNextSteps ? (
          <p>Next steps: {note.recommendedNextSteps}</p>
        ) : null}
      </div>
    </section>
  );
}
