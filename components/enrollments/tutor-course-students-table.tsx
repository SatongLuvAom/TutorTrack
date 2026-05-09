import Link from "next/link";
import { EnrollmentStatusBadge } from "@/components/enrollments/enrollment-status-badge";
import { Button } from "@/components/ui/button";
import type {
  TutorCourseEnrollmentItem,
  TutorEnrollmentItem,
} from "@/services/enrollment.service";

type TutorCourseStudentsTableProps = {
  enrollments: TutorCourseEnrollmentItem[];
  courseId?: string;
};

type TutorEnrollmentsTableProps = {
  enrollments: TutorEnrollmentItem[];
};

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
  }).format(value);
}

function parentLabel(enrollment: TutorCourseEnrollmentItem): string {
  if (enrollment.parents.length === 0) {
    return "No linked parent";
  }

  return enrollment.parents
    .map((parent) =>
      parent.relationship ? `${parent.name} (${parent.relationship})` : parent.name,
    )
    .join(", ");
}

export function TutorCourseStudentsTable({
  courseId,
  enrollments,
}: TutorCourseStudentsTableProps) {
  return (
    <div className="tt-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-secondary/65 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Parent</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Enrolled</th>
              <th className="px-4 py-3 text-right font-medium">Progress</th>
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
                  {enrollment.student.gradeLevel ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {enrollment.student.gradeLevel}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4">{parentLabel(enrollment)}</td>
                <td className="px-4 py-4">
                  <EnrollmentStatusBadge status={enrollment.status} />
                </td>
                <td className="px-4 py-4">{formatDate(enrollment.enrolledAt)}</td>
                <td className="px-4 py-4 text-right">
                  {courseId ? (
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={`/dashboard/tutor/courses/${courseId}/students/${enrollment.student.id}/progress`}
                      >
                        Open
                      </Link>
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TutorEnrollmentsTable({
  enrollments,
}: TutorEnrollmentsTableProps) {
  return (
    <div className="tt-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-secondary/65 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Course</th>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Enrolled</th>
              <th className="px-4 py-3 text-right font-medium">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {enrollments.map((enrollment) => (
              <tr className="align-top hover:bg-secondary/35" key={enrollment.id}>
                <td className="px-4 py-4">
                  <p className="font-semibold">{enrollment.course.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {enrollment.course.subject.name} - {enrollment.course.type}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium">
                    {enrollment.student.displayName ?? enrollment.student.name}
                  </p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {enrollment.student.email}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <EnrollmentStatusBadge status={enrollment.status} />
                </td>
                <td className="px-4 py-4">{formatDate(enrollment.enrolledAt)}</td>
                <td className="px-4 py-4 text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={`/dashboard/tutor/courses/${enrollment.course.id}/students/${enrollment.student.id}/progress`}
                    >
                      Open
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
