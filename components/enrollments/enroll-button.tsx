import Link from "next/link";
import { ShieldAlert, UserPlus } from "lucide-react";
import { EnrollmentStatus, UserRole } from "@/lib/generated/prisma/enums";
import type { CurrentUser } from "@/lib/current-user";
import { Button } from "@/components/ui/button";
import { EnrollmentStatusBadge } from "@/components/enrollments/enrollment-status-badge";
import type {
  EnrollmentStatusSummary,
  ParentChildOption,
} from "@/services/enrollment.service";

type EnrollmentAction = (formData: FormData) => Promise<void>;

type EnrollmentCtaProps = {
  courseId: string;
  user: CurrentUser | null;
  studentEnrollment?: EnrollmentStatusSummary | null;
  parentChildren?: ParentChildOption[];
  createStudentAction: EnrollmentAction;
  createParentAction: EnrollmentAction;
  returnTo: string;
};

function EnrollmentNotice({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/45 p-3 text-sm">
      <div className="flex items-start gap-2">
        <ShieldAlert
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-primary"
        />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

function AlreadyEnrolled({
  enrollment,
}: {
  enrollment: EnrollmentStatusSummary;
}) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
      <p className="text-sm font-semibold text-emerald-800">สมัครคอร์สนี้แล้ว</p>
      <div className="mt-2">
        <EnrollmentStatusBadge status={enrollment.status} />
      </div>
    </div>
  );
}

function blocksNewEnrollment(status: EnrollmentStatus): boolean {
  return [
    EnrollmentStatus.PENDING,
    EnrollmentStatus.ACTIVE,
    EnrollmentStatus.COMPLETED,
  ].some((blockedStatus) => blockedStatus === status);
}

export function EnrollmentCta({
  courseId,
  user,
  studentEnrollment,
  parentChildren = [],
  createStudentAction,
  createParentAction,
  returnTo,
}: EnrollmentCtaProps) {
  if (!user) {
    return (
      <div className="mt-6 space-y-3">
        <Button asChild className="w-full">
          <Link href="/auth/login">เข้าสู่ระบบเพื่อสมัครเรียน</Link>
        </Button>
        <p className="text-xs leading-5 text-muted-foreground">
          นักเรียนและผู้ปกครองต้องเข้าสู่ระบบก่อนสมัครคอร์ส
        </p>
      </div>
    );
  }

  if (user.role === UserRole.STUDENT) {
    if (studentEnrollment && blocksNewEnrollment(studentEnrollment.status)) {
      return (
        <div className="mt-6">
          <AlreadyEnrolled enrollment={studentEnrollment} />
        </div>
      );
    }

    return (
      <div className="mt-6 space-y-3">
        {studentEnrollment ? (
          <AlreadyEnrolled enrollment={studentEnrollment} />
        ) : null}
        <form action={createStudentAction}>
          <input name="courseId" type="hidden" value={courseId} />
          <input name="returnTo" type="hidden" value={returnTo} />
          <Button className="w-full" type="submit">
            <UserPlus aria-hidden="true" />
            สมัครเรียน
          </Button>
        </form>
      </div>
    );
  }

  if (user.role === UserRole.PARENT) {
    const canSubmit = parentChildren.some(
      (child) =>
        !child.currentEnrollment ||
        !blocksNewEnrollment(child.currentEnrollment.status),
    );

    return (
      <form action={createParentAction} className="mt-6 space-y-3">
        <input name="courseId" type="hidden" value={courseId} />
        <input name="returnTo" type="hidden" value={returnTo} />
        <div className="space-y-2">
          <label className="tt-label" htmlFor="studentId">
            เลือกลูกที่ต้องการสมัคร
          </label>
          <select
            className="tt-input"
            disabled={parentChildren.length === 0}
            id="studentId"
            name="studentId"
            required
          >
            <option value="">เลือกรายชื่อนักเรียน</option>
            {parentChildren.map((child) => (
              <option
                disabled={
                  child.currentEnrollment
                    ? blocksNewEnrollment(child.currentEnrollment.status)
                    : false
                }
                key={child.studentId}
                value={child.studentId}
              >
                {child.name}
                {child.gradeLevel ? ` (${child.gradeLevel})` : ""}
                {child.currentEnrollment
                  ? ` - ${child.currentEnrollment.status}`
                  : ""}
              </option>
            ))}
          </select>
        </div>
        <Button className="w-full" disabled={!canSubmit} type="submit">
          <UserPlus aria-hidden="true" />
          สมัครเรียนให้ลูก
        </Button>
        {parentChildren.length === 0 ? (
          <p className="text-xs leading-5 text-muted-foreground">
            ยังไม่มี ParentStudentLink ที่ active สำหรับบัญชีนี้
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <div className="mt-6">
      <EnrollmentNotice
        description="บทบาทนี้ใช้ดูแลระบบหรือจัดการคอร์ส จึงไม่สามารถสมัครเรียนจากหน้านี้ได้"
        title="ไม่เปิดสมัครสำหรับบทบาทนี้"
      />
    </div>
  );
}
