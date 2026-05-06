import { z } from "zod";
import { AttendanceStatus } from "@/lib/generated/prisma/enums";

const requiredId = (fieldName: string) =>
  z.string().trim().min(1, `${fieldName} is required`).max(120);

const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength).optional().catch(undefined);

export const attendanceMarkSchema = z.object({
  studentId: requiredId("Student"),
  status: z.enum([
    AttendanceStatus.PRESENT,
    AttendanceStatus.ABSENT,
    AttendanceStatus.LATE,
    AttendanceStatus.EXCUSED,
  ]),
  note: optionalText(500),
});

export const bulkAttendanceMarkSchema = z.object({
  sessionId: requiredId("Session"),
  records: z.array(attendanceMarkSchema).min(1, "At least one student is required"),
  returnTo: z.string().trim().max(300).optional().catch(undefined),
});

export const attendanceFilterSchema = z.object({
  search: optionalText(100),
  courseId: optionalText(120),
  studentId: optionalText(120),
  sessionId: optionalText(120),
  status: z
    .enum([
      AttendanceStatus.PRESENT,
      AttendanceStatus.ABSENT,
      AttendanceStatus.LATE,
      AttendanceStatus.EXCUSED,
    ])
    .optional()
    .catch(undefined),
});

export type AttendanceMarkInput = z.infer<typeof attendanceMarkSchema>;
export type BulkAttendanceMarkInput = z.infer<
  typeof bulkAttendanceMarkSchema
>;
export type AttendanceFilterInput = z.infer<typeof attendanceFilterSchema>;
