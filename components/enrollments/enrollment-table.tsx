import Link from "next/link";
import { XCircle } from "lucide-react";
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
  return (
    <div className="tt-card overflow-hidden">
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
                  {cancelAction && enrollment.status === EnrollmentStatus.PENDING ? (
                    <form action={cancelAction}>
                      <input
                        name="enrollmentId"
                        type="hidden"
                        value={enrollment.id}
                      />
                      {studentId ? (
                        <input name="studentId" type="hidden" value={studentId} />
                      ) : null}
                      <input name="returnTo" type="hidden" value={returnTo} />
                      <Button size="sm" type="submit" variant="destructive">
                        <XCircle aria-hidden="true" />
                        Cancel
                      </Button>
                    </form>
                  ) : (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/courses/${enrollment.course.id}`}>View</Link>
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
