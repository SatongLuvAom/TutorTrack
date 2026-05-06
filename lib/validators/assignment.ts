import { z } from "zod";

const requiredText = (fieldName: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .max(maxLength, `${fieldName} is too long`);

const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength).optional().catch(undefined);

export const assignmentGradingStatusSchema = z.enum([
  "all",
  "pending",
  "not-submitted",
  "submitted",
  "graded",
  "pending-grading",
  "late",
  "overdue",
]);

export const assignmentCreateSchema = z.object({
  title: requiredText("Title", 160),
  description: requiredText("Description", 2_000),
  dueDate: z.coerce.date({
    error: "Due date is required",
  }),
  maxScore: z.coerce
    .number()
    .finite()
    .positive("Max score must be greater than 0")
    .max(9999, "Max score is too large"),
  sessionId: optionalText(120),
});

export const assignmentUpdateSchema = assignmentCreateSchema;

export const assignmentFilterSchema = z.object({
  search: optionalText(100),
  courseId: optionalText(120),
  tutorId: optionalText(120),
  subjectId: optionalText(120),
  studentId: optionalText(120),
  gradingStatus: assignmentGradingStatusSchema.optional().catch(undefined),
  dueFrom: z.coerce.date().optional().catch(undefined),
  dueTo: z.coerce.date().optional().catch(undefined),
});

export type AssignmentCreateInput = z.infer<typeof assignmentCreateSchema>;
export type AssignmentUpdateInput = z.infer<typeof assignmentUpdateSchema>;
export type AssignmentFilterInput = z.infer<typeof assignmentFilterSchema>;
export type AssignmentGradingStatus = z.infer<
  typeof assignmentGradingStatusSchema
>;
