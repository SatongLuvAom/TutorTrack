import Link from "next/link";
import { Archive, Eye, Pencil, RotateCcw, Send } from "lucide-react";
import { CourseStatus } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";

type CourseAction = (formData: FormData) => Promise<void>;

type CourseActionsProps = {
  courseId: string;
  status: CourseStatus;
  returnTo: string;
  viewHref: string;
  editHref?: string;
  publishAction: CourseAction;
  archiveAction: CourseAction;
  restoreAction: CourseAction;
};

function StatusActionForm({
  action,
  courseId,
  returnTo,
  children,
}: {
  action: CourseAction;
  courseId: string;
  returnTo: string;
  children: React.ReactNode;
}) {
  return (
    <form action={action}>
      <input name="courseId" type="hidden" value={courseId} />
      <input name="returnTo" type="hidden" value={returnTo} />
      {children}
    </form>
  );
}

export function CourseActions({
  courseId,
  status,
  returnTo,
  viewHref,
  editHref,
  publishAction,
  archiveAction,
  restoreAction,
}: CourseActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href={viewHref}>
          <Eye aria-hidden="true" />
          View
        </Link>
      </Button>

      {editHref ? (
        <Button asChild size="sm" variant="outline">
          <Link href={editHref}>
            <Pencil aria-hidden="true" />
            Edit
          </Link>
        </Button>
      ) : null}

      {status === CourseStatus.DRAFT ? (
        <StatusActionForm
          action={publishAction}
          courseId={courseId}
          returnTo={returnTo}
        >
          <Button size="sm" type="submit">
            <Send aria-hidden="true" />
            Publish
          </Button>
        </StatusActionForm>
      ) : null}

      {status !== CourseStatus.ARCHIVED ? (
        <StatusActionForm
          action={archiveAction}
          courseId={courseId}
          returnTo={returnTo}
        >
          <Button size="sm" type="submit" variant="outline">
            <Archive aria-hidden="true" />
            Archive
          </Button>
        </StatusActionForm>
      ) : (
        <StatusActionForm
          action={restoreAction}
          courseId={courseId}
          returnTo={returnTo}
        >
          <Button size="sm" type="submit" variant="outline">
            <RotateCcw aria-hidden="true" />
            Restore draft
          </Button>
        </StatusActionForm>
      )}
    </div>
  );
}
