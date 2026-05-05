import { z } from "zod";
import { EnrollmentStatus } from "@/lib/generated/prisma/enums";

const requiredId = (fieldName: string) =>
  z.string().trim().min(1, `${fieldName} is required`).max(120);

const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength).optional().catch(undefined);

export const enrollmentCreateSchema = z.object({
  courseId: requiredId("Course"),
  returnTo: z.string().trim().max(300).optional().catch(undefined),
});

export const parentEnrollmentCreateSchema = z.object({
  courseId: requiredId("Course"),
  studentId: requiredId("Student"),
  returnTo: z.string().trim().max(300).optional().catch(undefined),
});

export const enrollmentCancelSchema = z.object({
  enrollmentId: requiredId("Enrollment"),
  studentId: requiredId("Student").optional().catch(undefined),
  returnTo: z.string().trim().max(300).optional().catch(undefined),
});

export const enrollmentStatusUpdateSchema = z.object({
  enrollmentId: requiredId("Enrollment"),
  status: z.enum([
    EnrollmentStatus.PENDING,
    EnrollmentStatus.ACTIVE,
    EnrollmentStatus.COMPLETED,
    EnrollmentStatus.CANCELLED,
  ]),
  returnTo: z.string().trim().max(300).optional().catch(undefined),
});

export const enrollmentFilterSchema = z.object({
  search: optionalText(100),
  courseId: optionalText(120),
  tutorId: optionalText(120),
  studentId: optionalText(120),
  status: z
    .enum([
      EnrollmentStatus.PENDING,
      EnrollmentStatus.ACTIVE,
      EnrollmentStatus.COMPLETED,
      EnrollmentStatus.CANCELLED,
    ])
    .optional()
    .catch(undefined),
});

export type EnrollmentCreateInput = z.infer<typeof enrollmentCreateSchema>;
export type ParentEnrollmentCreateInput = z.infer<
  typeof parentEnrollmentCreateSchema
>;
export type EnrollmentCancelInput = z.infer<typeof enrollmentCancelSchema>;
export type EnrollmentStatusUpdateInput = z.infer<
  typeof enrollmentStatusUpdateSchema
>;
export type EnrollmentFilterInput = z.infer<typeof enrollmentFilterSchema>;
