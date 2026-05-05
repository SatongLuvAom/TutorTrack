import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnrollmentEmptyState } from "@/components/enrollments/enrollment-empty-state";
import { EnrollmentTable } from "@/components/enrollments/enrollment-table";
import { requireStudent } from "@/lib/guards";
import { getStudentEnrollments } from "@/services/enrollment.service";
import { cancelStudentEnrollmentAction } from "@/app/dashboard/student/enrollments/actions";

export const dynamic = "force-dynamic";

type StudentEnrollmentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function StudentEnrollmentsPage({
  searchParams,
}: StudentEnrollmentsPageProps) {
  const user = await requireStudent();
  const params = searchParams ? await searchParams : {};
  const enrollments = await getStudentEnrollments(user.id);
  const errorMessage = firstValue(params.error);

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell py-8">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/student">
              <ArrowLeft aria-hidden="true" />
              Dashboard
            </Link>
          </Button>
          <p className="tt-kicker mt-5">Student dashboard</p>
          <h1 className="tt-heading mt-2 text-3xl">My enrollments</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            ดูคอร์สที่สมัครไว้และสถานะการสมัครของตัวเอง นักเรียนยกเลิกได้เฉพาะรายการที่ยังรออนุมัติ
          </p>
        </div>
      </section>

      <section className="tt-shell py-8">
        {errorMessage ? (
          <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        {enrollments.length === 0 ? (
          <EnrollmentEmptyState
            actionHref="/courses"
            actionLabel="Browse courses"
            description="เลือกคอร์ส published จาก marketplace แล้วกดสมัครเรียนเพื่อเริ่มต้น"
            title="ยังไม่มีรายการสมัครเรียน"
          />
        ) : (
          <EnrollmentTable
            cancelAction={cancelStudentEnrollmentAction}
            enrollments={enrollments}
            returnTo="/dashboard/student/enrollments"
          />
        )}
      </section>
    </main>
  );
}
