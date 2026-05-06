import Link from "next/link";
import { CalendarCheck, CalendarX, Eye, Pencil } from "lucide-react";
import { SessionStatus } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";

type SessionAction = (formData: FormData) => Promise<void>;

type SessionActionsProps = {
  sessionId: string;
  status: SessionStatus;
  returnTo: string;
  viewHref: string;
  editHref?: string;
  cancelAction?: SessionAction;
  completeAction?: SessionAction;
};

function StatusActionForm({
  action,
  sessionId,
  returnTo,
  children,
}: {
  action: SessionAction;
  sessionId: string;
  returnTo: string;
  children: React.ReactNode;
}) {
  return (
    <form action={action}>
      <input name="sessionId" type="hidden" value={sessionId} />
      <input name="returnTo" type="hidden" value={returnTo} />
      {children}
    </form>
  );
}

export function SessionActions({
  sessionId,
  status,
  returnTo,
  viewHref,
  editHref,
  cancelAction,
  completeAction,
}: SessionActionsProps) {
  const canMutate = status === SessionStatus.SCHEDULED;

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href={viewHref}>
          <Eye aria-hidden="true" />
          View
        </Link>
      </Button>

      {editHref && canMutate ? (
        <Button asChild size="sm" variant="outline">
          <Link href={editHref}>
            <Pencil aria-hidden="true" />
            Edit
          </Link>
        </Button>
      ) : null}

      {completeAction && canMutate ? (
        <StatusActionForm
          action={completeAction}
          returnTo={returnTo}
          sessionId={sessionId}
        >
          <Button size="sm" type="submit">
            <CalendarCheck aria-hidden="true" />
            Complete
          </Button>
        </StatusActionForm>
      ) : null}

      {cancelAction && canMutate ? (
        <StatusActionForm
          action={cancelAction}
          returnTo={returnTo}
          sessionId={sessionId}
        >
          <Button size="sm" type="submit" variant="outline">
            <CalendarX aria-hidden="true" />
            Cancel
          </Button>
        </StatusActionForm>
      ) : null}
    </div>
  );
}
