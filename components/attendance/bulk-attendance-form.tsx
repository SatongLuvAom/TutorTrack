import { ClipboardCheck } from "lucide-react";
import { AttendanceStatus } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { AttendanceStatusBadge } from "@/components/attendance/attendance-status-badge";
import type { SessionAttendanceItem } from "@/services/attendance.service";

type AttendanceAction = (formData: FormData) => Promise<void>;

type BulkAttendanceFormProps = {
  action: AttendanceAction;
  sessionId: string;
  records: SessionAttendanceItem[];
  returnTo: string;
};

const attendanceOptions = [
  AttendanceStatus.PRESENT,
  AttendanceStatus.LATE,
  AttendanceStatus.ABSENT,
  AttendanceStatus.EXCUSED,
] as const;

export function BulkAttendanceForm({
  action,
  sessionId,
  records,
  returnTo,
}: BulkAttendanceFormProps) {
  if (records.length === 0) {
    return (
      <div className="tt-card p-5">
        <p className="font-semibold">No active students</p>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          Attendance can be marked only for ACTIVE enrollments in this course.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="tt-card overflow-hidden">
      <input name="sessionId" type="hidden" value={sessionId} />
      <input name="returnTo" type="hidden" value={returnTo} />
      <div className="border-b border-border p-5">
        <div className="flex items-center gap-2">
          <ClipboardCheck aria-hidden="true" className="size-5 text-primary" />
          <h2 className="tt-heading text-xl">Mark attendance</h2>
        </div>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          Only students with ACTIVE enrollment are shown here.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-secondary/65 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Current</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {records.map((record) => (
              <tr className="align-top hover:bg-secondary/35" key={record.student.id}>
                <td className="px-4 py-4">
                  <input
                    name="studentId"
                    type="hidden"
                    value={record.student.id}
                  />
                  <p className="font-semibold">
                    {record.student.displayName ?? record.student.name}
                  </p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {record.student.email}
                  </p>
                </td>
                <td className="px-4 py-4">
                  {record.attendance ? (
                    <AttendanceStatusBadge status={record.attendance.status} />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Not marked
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <select
                    className="tt-input"
                    defaultValue={record.attendance?.status ?? AttendanceStatus.PRESENT}
                    name={`status:${record.student.id}`}
                  >
                    {attendanceOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-4">
                  <input
                    className="tt-input"
                    defaultValue={record.attendance?.note ?? ""}
                    maxLength={500}
                    name={`note:${record.student.id}`}
                    placeholder="Optional note"
                    type="text"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end border-t border-border p-5">
        <Button type="submit">
          <ClipboardCheck aria-hidden="true" />
          Save attendance
        </Button>
      </div>
    </form>
  );
}
