import { CourseActions } from "@/components/courses/course-actions";
import { CourseStatusBadge } from "@/components/courses/course-status-badge";
import { formatPrice, getLevelLabel } from "@/services/marketplace-utils";
import type { ManagedCourse } from "@/services/course.service";

type CourseAction = (formData: FormData) => Promise<void>;

type AdminCourseTableProps = {
  courses: ManagedCourse[];
  returnTo: string;
  publishAction: CourseAction;
  archiveAction: CourseAction;
  restoreAction: CourseAction;
};

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
  }).format(value);
}

export function AdminCourseTable({
  courses,
  returnTo,
  publishAction,
  archiveAction,
  restoreAction,
}: AdminCourseTableProps) {
  return (
    <div className="tt-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="bg-secondary/65 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Course</th>
              <th className="px-4 py-3 font-medium">Tutor</th>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stats</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {courses.map((course) => (
              <tr key={course.id} className="align-top transition-colors hover:bg-secondary/35">
                <td className="px-4 py-4">
                  <p className="font-semibold">{course.title}</p>
                  <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                    {getLevelLabel([course.level])} - max{" "}
                    {course.maxStudents ?? "flexible"} students
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium">{course.tutor.name}</p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {course.tutor.email}
                  </p>
                </td>
                <td className="px-4 py-4">{course.subject.name}</td>
                <td className="px-4 py-4">{course.type}</td>
                <td className="px-4 py-4">{formatPrice(course.priceCents)}</td>
                <td className="px-4 py-4">
                  <p>{course.stats.enrollmentCount} enrollments</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {course.stats.scheduledSessionCount} sessions,{" "}
                    {course.stats.assignmentCount} assignments
                  </p>
                </td>
                <td className="px-4 py-4">
                  <CourseStatusBadge status={course.status} />
                </td>
                <td className="px-4 py-4">{formatDate(course.updatedAt)}</td>
                <td className="px-4 py-4">
                  <CourseActions
                    archiveAction={archiveAction}
                    courseId={course.id}
                    publishAction={publishAction}
                    restoreAction={restoreAction}
                    returnTo={returnTo}
                    status={course.status}
                    viewHref={`/dashboard/admin/courses/${course.id}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
