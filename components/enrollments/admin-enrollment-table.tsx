import { EnrollmentStatus } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { EnrollmentStatusBadge } from "@/components/enrollments/enrollment-status-badge";
import { formatPrice } from "@/services/marketplace-utils";
import type { AdminEnrollmentItem } from "@/services/enrollment.service";

type EnrollmentAction = (formData: FormData) => Promise<void>;

type AdminEnrollmentTableProps = {
  enrollments: AdminEnrollmentItem[];
  updateAction: EnrollmentAction;
  returnTo: string;
};

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
  }).format(value);
}

function nextStatuses(status: EnrollmentStatus): EnrollmentStatus[] {
  if (status === EnrollmentStatus.PENDING) {
    return [EnrollmentStatus.ACTIVE, EnrollmentStatus.CANCELLED];
  }

  if (status === EnrollmentStatus.ACTIVE) {
    return [EnrollmentStatus.COMPLETED, EnrollmentStatus.CANCELLED];
  }

  return [];
}

export function AdminEnrollmentTable({
  enrollments,
  updateAction,
  returnTo,
}: AdminEnrollmentTableProps) {
  return (
    <div className="tt-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="bg-secondary/65 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Parent</th>
              <th className="px-4 py-3 font-medium">Course</th>
              <th className="px-4 py-3 font-medium">Tutor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Enrolled</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {enrollments.map((enrollment) => (
              <tr className="align-top hover:bg-secondary/35" key={enrollment.id}>
                <td className="px-4 py-4">
                  <p className="font-semibold">
                    {enrollment.student.displayName ?? enrollment.student.name}
                  </p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {enrollment.student.email}
                  </p>
                </td>
                <td className="px-4 py-4">
                  {enrollment.parents.length === 0 ? (
                    <span className="text-muted-foreground">No active parent</span>
                  ) : (
                    enrollment.parents.map((parent) => (
                      <div key={parent.id}>
                        <p className="font-medium">{parent.name}</p>
                        <p className="break-all text-xs text-muted-foreground">
                          {parent.email}
                        </p>
                      </div>
                    ))
                  )}
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium">{enrollment.course.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {enrollment.course.subject.name} - {enrollment.course.type} -{" "}
                    {formatPrice(enrollment.course.priceCents)}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium">{enrollment.course.tutor.name}</p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {enrollment.course.tutor.email}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <EnrollmentStatusBadge status={enrollment.status} />
                </td>
                <td className="px-4 py-4">{formatDate(enrollment.enrolledAt)}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {nextStatuses(enrollment.status).map((status) => (
                      <form action={updateAction} key={status}>
                        <input
                          name="enrollmentId"
                          type="hidden"
                          value={enrollment.id}
                        />
                        <input name="status" type="hidden" value={status} />
                        <input name="returnTo" type="hidden" value={returnTo} />
                        <Button size="sm" type="submit" variant="outline">
                          {status === EnrollmentStatus.ACTIVE
                            ? "Activate"
                            : status === EnrollmentStatus.COMPLETED
                              ? "Complete"
                              : "Cancel"}
                        </Button>
                      </form>
                    ))}
                    {nextStatuses(enrollment.status).length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        Final state
                      </span>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
