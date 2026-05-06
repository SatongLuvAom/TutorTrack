import { z } from "zod";
import { AssessmentType } from "@/lib/generated/prisma/enums";

const requiredText = (fieldName: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .max(maxLength, `${fieldName} is too long`);

const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength).optional().catch(undefined);

const optionalNumber = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().finite().min(0).max(9999).optional(),
);

export const assessmentTypeSchema = z.enum(AssessmentType);

export const assessmentCreateSchema = z.object({
  title: requiredText("Title", 160),
  type: assessmentTypeSchema,
  maxScore: z.coerce
    .number()
    .finite()
    .positive("Max score must be greater than 0")
    .max(9999, "Max score is too large"),
  takenAt: z.coerce.date({
    error: "Assessment date is required",
  }),
});

export const assessmentUpdateSchema = assessmentCreateSchema;

export const assessmentScoreSchema = z.object({
  studentId: requiredText("Student", 120),
  score: optionalNumber,
  note: optionalText(2_000),
});

export const bulkAssessmentScoreSchema = z.object({
  assessmentId: requiredText("Assessment", 120),
  scores: z.array(assessmentScoreSchema).min(1, "At least one score is required"),
});

export const assessmentFilterSchema = z.object({
  search: optionalText(100),
  courseId: optionalText(120),
  tutorId: optionalText(120),
  studentId: optionalText(120),
  type: assessmentTypeSchema.optional().catch(undefined),
  dateFrom: z.coerce.date().optional().catch(undefined),
  dateTo: z.coerce.date().optional().catch(undefined),
});

export type AssessmentCreateInput = z.infer<typeof assessmentCreateSchema>;
export type AssessmentUpdateInput = z.infer<typeof assessmentUpdateSchema>;
export type AssessmentScoreInput = z.infer<typeof assessmentScoreSchema>;
export type BulkAssessmentScoreInput = z.infer<
  typeof bulkAssessmentScoreSchema
>;
export type AssessmentFilterInput = z.infer<typeof assessmentFilterSchema>;
