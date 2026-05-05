import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnrollmentEmptyState } from "@/components/enrollments/enrollment-empty-state";
import { EnrollmentTable } from "@/components/enrollments/enrollment-table";
import { ParentChildEnrollForm } from "@/components/enrollments/parent-child-enroll-form";
import { requireParent, requirePermission } from "@/lib/guards";
import { canViewParentChild } from "@/lib/permissions";
import {
  getParentChildEnrollments,
  getParentChildSummary,
  getPublishedCourseOptions,
} from "@/services/enrollment.service";
import {
  cancelParentChildEnrollmentAction,
  createParentChildEnrollmentAction,
} from "@/app/dashboard/parent/children/[studentId]/enrollments/actions";

export const dynamic = "force-dynamic";

type ParentChildEnrollmentsPageProps = {
  params: Promise<{ studentId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ParentChildEnrollmentsPage({
  params,
  searchParams,
}: ParentChildEnrollmentsPageProps) {
  const user = await requireParent();
  const { studentId } = await params;
  await requirePermission(canViewParentChild(user, studentId));
  const query = searchParams ? await searchParams : {};
  const [child, enrollments, courses] = await Promise.all([
    getParentChildSummary(user.id, studentId),
    getParentChildEnrollments(user.id, studentId),
    getPublishedCourseOptions(),
  ]);
  const errorMessage = firstValue(query.error);

  if (!child) {
    notFound();
  }

  const returnTo = `/dashboard/parent/children/${studentId}/enrollments`;

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/parent">
              <ArrowLeft aria-hidden="true" />
              Parent dashboard
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Parent dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">
            Enrollments for {child.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            ผู้ปกครองดูและสมัครคอร์สได้เฉพาะลูกที่เชื่อมด้วย ParentStudentLink ที่ active
          </p>
        </div>
      </section>

      <section className="tt-shell space-y-6 py-8">
        {errorMessage ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <ParentChildEnrollForm
          action={createParentChildEnrollmentAction}
          courses={courses}
          returnTo={returnTo}
          studentId={studentId}
        />

        {enrollments.length === 0 ? (
          <EnrollmentEmptyState
            actionHref="/courses"
            actionLabel="Browse courses"
            description="ยังไม่มีรายการสมัครเรียนสำหรับนักเรียนคนนี้"
            title="ยังไม่มี enrollment"
          />
        ) : (
          <EnrollmentTable
            cancelAction={cancelParentChildEnrollmentAction}
            enrollments={enrollments}
            returnTo={returnTo}
            studentId={studentId}
          />
        )}
      </section>
    </main>
  );
}
