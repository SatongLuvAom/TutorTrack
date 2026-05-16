import Link from "next/link";
import { QrCode, WalletCards, XCircle } from "lucide-react";
import { EnrollmentStatus } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { EnrollmentStatusBadge } from "@/components/enrollments/enrollment-status-badge";
import { formatPrice } from "@/services/marketplace-utils";
import type { EnrollmentListItem } from "@/services/enrollment.service";

type EnrollmentAction = (formData: FormData) => Promise<void>;

type EnrollmentTableProps = {
  enrollments: EnrollmentListItem[];
  cancelAction?: EnrollmentAction;
  returnTo: string;
  studentId?: string;
};

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
  }).format(value);
}

export function EnrollmentTable({
  enrollments,
  cancelAction,
  returnTo,
  studentId,
}: EnrollmentTableProps) {
  const paymentHref = (enrollmentId: string) =>
    studentId
      ? `/dashboard/parent/children/${studentId}/enrollments/${enrollmentId}/payment`
      : `/dashboard/student/enrollments/${enrollmentId}/payment`;
  const promptPayHref = (enrollmentId: string) =>
    studentId
      ? `/dashboard/parent/children/${studentId}/enrollments/${enrollmentId}/pay`
      : `/dashboard/student/enrollments/${enrollmentId}/pay`;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:hidden">
        {enrollments.map((enrollment) => (
          <article className="tt-card p-5" key={enrollment.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  className="font-semibold text-primary hover:underline"
                  href={`/courses/${enrollment.course.id}`}
                >
                  {enrollment.course.title}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {enrollment.course.subject.name} - {enrollment.course.type}
                </p>
              </div>
              <EnrollmentStatusBadge status={enrollment.status} />
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-lg bg-secondary/60 p-3">
                <p className="text-muted-foreground">Tutor</p>
                <p className="mt-1 font-medium">{enrollment.course.tutor.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-secondary/60 p-3">
                  <p className="text-muted-foreground">Price</p>
                  <p className="mt-1 font-medium">
                    {formatPrice(enrollment.course.priceCents)}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/60 p-3">
                  <p className="text-muted-foreground">Enrolled</p>
                  <p className="mt-1 font-medium">
                    {formatDate(enrollment.enrolledAt)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {enrollment.status === EnrollmentStatus.PENDING ||
              enrollment.status === EnrollmentStatus.ACTIVE ? (
                <>
                  <Button asChild size="sm" variant="outline">
                    <Link href={promptPayHref(enrollment.id)}>
                      <QrCode aria-hidden="true" />
                      PromptPay
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={paymentHref(enrollment.id)}>
                      <WalletCards aria-hidden="true" />
                      Manual
                    </Link>
                  </Button>
                </>
              ) : null}
              {cancelAction && enrollment.status === EnrollmentStatus.PENDING ? (
                <form action={cancelAction}>
                  <input name="enrollmentId" type="hidden" value={enrollment.id} />
                  {studentId ? (
                    <input name="studentId" type="hidden" value={studentId} />
                  ) : null}
                  <input name="returnTo" type="hidden" value={returnTo} />
                  <Button size="sm" type="submit" variant="destructive">
                    <XCircle aria-hidden="true" />
                    Cancel
                  </Button>
                </form>
              ) : null}
              <Button asChild size="sm" variant="outline">
                <Link href={`/courses/${enrollment.course.id}`}>View</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>

      <div className="tt-card hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-secondary/65 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Course</th>
              <th className="px-4 py-3 font-medium">Tutor</th>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Enrolled</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {enrollments.map((enrollment) => (
              <tr
                className="align-top transition-colors hover:bg-secondary/35"
                key={enrollment.id}
              >
                <td className="px-4 py-4">
                  <Link
                    className="font-semibold text-primary hover:underline"
                    href={`/courses/${enrollment.course.id}`}
                  >
                    {enrollment.course.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {enrollment.course.totalSessions} sessions
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium">{enrollment.course.tutor.name}</p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {enrollment.course.tutor.email}
                  </p>
                </td>
                <td className="px-4 py-4">{enrollment.course.subject.name}</td>
                <td className="px-4 py-4">{enrollment.course.type}</td>
                <td className="px-4 py-4">
                  {formatPrice(enrollment.course.priceCents)}
                </td>
                <td className="px-4 py-4">
                  <EnrollmentStatusBadge status={enrollment.status} />
                </td>
                <td className="px-4 py-4">{formatDate(enrollment.enrolledAt)}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {enrollment.status === EnrollmentStatus.PENDING ||
                    enrollment.status === EnrollmentStatus.ACTIVE ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={promptPayHref(enrollment.id)}>
                          <QrCode aria-hidden="true" />
                          PromptPay
                        </Link>
                      </Button>
                    ) : null}
                    {enrollment.status === EnrollmentStatus.PENDING ||
                    enrollment.status === EnrollmentStatus.ACTIVE ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={paymentHref(enrollment.id)}>
                          <WalletCards aria-hidden="true" />
                          Manual
                        </Link>
                      </Button>
                    ) : null}
                    {cancelAction &&
                    enrollment.status === EnrollmentStatus.PENDING ? (
                      <form action={cancelAction}>
                        <input
                          name="enrollmentId"
                          type="hidden"
                          value={enrollment.id}
                        />
                        {studentId ? (
                          <input
                            name="studentId"
                            type="hidden"
                            value={studentId}
                          />
                        ) : null}
                        <input name="returnTo" type="hidden" value={returnTo} />
                        <Button size="sm" type="submit" variant="destructive">
                          <XCircle aria-hidden="true" />
                          Cancel
                        </Button>
                      </form>
                    ) : null}
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/courses/${enrollment.course.id}`}>View</Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
