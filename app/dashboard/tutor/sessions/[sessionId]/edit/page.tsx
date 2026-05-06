import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionForm } from "@/components/sessions/session-form";
import { requirePermission, requireTutor } from "@/lib/guards";
import { canEditSession } from "@/lib/permissions";
import {
  getTutorSessionById,
  getTutorSessionCourseOptions,
} from "@/services/session.service";
import { updateTutorSessionAction } from "@/app/dashboard/tutor/sessions/actions";

export const dynamic = "force-dynamic";

type EditTutorSessionPageProps = {
  params: Promise<{ sessionId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EditTutorSessionPage({
  params,
  searchParams,
}: EditTutorSessionPageProps) {
  const user = await requireTutor();
  const { sessionId } = await params;
  await requirePermission(canEditSession(user, sessionId));
  const query = searchParams ? await searchParams : {};
  const [session, courses] = await Promise.all([
    getTutorSessionById(user.id, sessionId),
    getTutorSessionCourseOptions(user.id),
  ]);

  if (!session) {
    notFound();
  }

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href={`/dashboard/tutor/sessions/${sessionId}`}>
              <ArrowLeft aria-hidden="true" />
              Session
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Tutor dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">Edit session</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Only scheduled sessions can be edited.
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
        <SessionForm
          action={updateTutorSessionAction}
          cancelHref={`/dashboard/tutor/sessions/${sessionId}`}
          courses={courses}
          errorMessage={firstValue(query.error)}
          fixedCourseId={session.courseId}
          session={session}
        />
      </section>
    </main>
  );
}
