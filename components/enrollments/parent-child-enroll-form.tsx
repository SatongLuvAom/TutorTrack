import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/services/marketplace-utils";
import type { EnrollmentCourseOption } from "@/services/enrollment.service";

type EnrollmentAction = (formData: FormData) => Promise<void>;

type ParentChildEnrollFormProps = {
  studentId: string;
  courses: EnrollmentCourseOption[];
  action: EnrollmentAction;
  returnTo: string;
};

export function ParentChildEnrollForm({
  studentId,
  courses,
  action,
  returnTo,
}: ParentChildEnrollFormProps) {
  return (
    <form action={action} className="tt-filter-panel">
      <input name="studentId" type="hidden" value={studentId} />
      <input name="returnTo" type="hidden" value={returnTo} />
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-2">
          <label className="tt-label" htmlFor="courseId">
            สมัครคอร์สใหม่ให้ลูก
          </label>
          <select className="tt-input" id="courseId" name="courseId" required>
            <option value="">เลือกคอร์สที่เปิดรับสมัคร</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title} - {course.subjectName} - {course.tutorName} -{" "}
                {formatPrice(course.priceCents)}
              </option>
            ))}
          </select>
        </div>
        <Button disabled={courses.length === 0} type="submit">
          <PlusCircle aria-hidden="true" />
          สมัครให้ลูก
        </Button>
      </div>
    </form>
  );
}
