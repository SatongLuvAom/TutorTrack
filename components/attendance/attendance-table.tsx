import Link from "next/link";
import { AttendanceStatusBadge } from "@/components/attendance/attendance-status-badge";
import type { AttendanceListItem } from "@/services/attendance.service";

type AttendanceTableProps = {
  records: AttendanceListItem[];
  showStudent?: boolean;
  showTutor?: boolean;
};

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function AttendanceTable({
  records,
  showStudent = true,
  showTutor = false,
}: AttendanceTableProps) {
  return (
    <div className="tt-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-secondary/65 text-xs uppercase text-muted-foreground">
            <tr>
              {showStudent ? (
                <th className="px-4 py-3 font-medium">Student</th>
              ) : null}
              <th className="px-4 py-3 font-medium">Session</th>
              <th className="px-4 py-3 font-medium">Course</th>
              {showTutor ? (
                <th className="px-4 py-3 font-medium">Tutor</th>
              ) : null}
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Marked</th>
              <th className="px-4 py-3 font-medium">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {records.map((record) => (
              <tr className="align-top hover:bg-secondary/35" key={record.id}>
                {showStudent ? (
                  <td className="px-4 py-4">
                    <p className="font-semibold">
                      {record.student.displayName ?? record.student.name}
                    </p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">
                      {record.student.email}
                    </p>
                  </td>
                ) : null}
                <td className="px-4 py-4">
                  <p className="font-medium">{record.session.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(record.session.startsAt)}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <Link
                    className="font-medium text-primary hover:underline"
                    href={`/courses/${record.session.course.id}`}
                  >
                    {record.session.course.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {record.session.course.subject.name}
                  </p>
                </td>
                {showTutor ? (
                  <td className="px-4 py-4">
                    <p className="font-medium">
                      {record.session.course.tutor.name}
                    </p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">
                      {record.session.course.tutor.email}
                    </p>
                  </td>
                ) : null}
                <td className="px-4 py-4">
                  <AttendanceStatusBadge status={record.status} />
                </td>
                <td className="px-4 py-4">{formatDate(record.markedAt)}</td>
                <td className="px-4 py-4">
                  {record.note ? (
                    <span>{record.note}</span>
                  ) : (
                    <span className="text-muted-foreground">No note</span>
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
