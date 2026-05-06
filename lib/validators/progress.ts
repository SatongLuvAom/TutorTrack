import { z } from "zod";

const requiredText = (fieldName: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .max(maxLength, `${fieldName} is too long`);

const optionalText = (maxLength: number) =>
  z
    .preprocess(
      (value) => (value === "" || value === null ? undefined : value),
      z.string().trim().max(maxLength).optional(),
    )
    .catch(undefined);

export const progressReportQuerySchema = z.object({
  studentId: requiredText("Student", 120),
  courseId: requiredText("Course", 120),
});

export const progressNoteCreateSchema = z
  .object({
    strengths: optionalText(2_000),
    weaknesses: optionalText(2_000),
    behaviorNote: optionalText(2_000),
    nextPlan: optionalText(2_000),
    parentSummary: optionalText(2_000),
  })
  .refine(
    (value) =>
      Boolean(
        value.strengths ||
          value.weaknesses ||
          value.behaviorNote ||
          value.nextPlan ||
          value.parentSummary,
      ),
    "At least one progress note field is required",
  );

export const progressNoteFilterSchema = progressReportQuerySchema;

export type ProgressReportQueryInput = z.infer<
  typeof progressReportQuerySchema
>;
export type ProgressNoteCreateInput = z.infer<typeof progressNoteCreateSchema>;
export type ProgressNoteFilterInput = z.infer<typeof progressNoteFilterSchema>;
