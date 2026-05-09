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

export const progressReportRouteParamsSchema = progressReportQuerySchema;

export const progressOverviewFilterSchema = z
  .object({
    search: optionalText(100),
    studentId: optionalText(120),
    tutorId: optionalText(120),
    courseId: optionalText(120),
    subjectId: optionalText(120),
    minScore: z.coerce.number().min(0).max(100).optional().catch(undefined),
    maxScore: z.coerce.number().min(0).max(100).optional().catch(undefined),
    minCompleteness: z.coerce
      .number()
      .min(0)
      .max(100)
      .optional()
      .catch(undefined),
    maxCompleteness: z.coerce
      .number()
      .min(0)
      .max(100)
      .optional()
      .catch(undefined),
  })
  .transform((value) => ({
    ...value,
    minScore:
      value.minScore !== undefined && value.maxScore !== undefined
        ? Math.min(value.minScore, value.maxScore)
        : value.minScore,
    maxScore:
      value.minScore !== undefined && value.maxScore !== undefined
        ? Math.max(value.minScore, value.maxScore)
        : value.maxScore,
    minCompleteness:
      value.minCompleteness !== undefined &&
      value.maxCompleteness !== undefined
        ? Math.min(value.minCompleteness, value.maxCompleteness)
        : value.minCompleteness,
    maxCompleteness:
      value.minCompleteness !== undefined &&
      value.maxCompleteness !== undefined
        ? Math.max(value.minCompleteness, value.maxCompleteness)
        : value.maxCompleteness,
  }));

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
export type ProgressReportRouteParamsInput = z.infer<
  typeof progressReportRouteParamsSchema
>;
export type ProgressOverviewFilterInput = z.infer<
  typeof progressOverviewFilterSchema
>;
export type ProgressNoteCreateInput = z.infer<typeof progressNoteCreateSchema>;
export type ProgressNoteFilterInput = z.infer<typeof progressNoteFilterSchema>;
