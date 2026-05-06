import { z } from "zod";

const requiredId = (fieldName: string) =>
  z.string().trim().min(1, `${fieldName} is required`).max(120);

const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength).optional().catch(undefined);

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .catch(undefined)
  .transform((value) => (value === "" ? undefined : value))
  .pipe(
    z
      .string()
      .url("File URL must be valid")
      .refine((value) => {
        const protocol = new URL(value).protocol;

        return protocol === "http:" || protocol === "https:";
      }, "File URL must use http or https")
      .optional(),
  );

const submissionContentSchema = z
  .object({
    textAnswer: optionalText(5_000),
    fileUrl: optionalUrl,
  })
  .refine(
    (input) => Boolean(input.textAnswer?.trim() || input.fileUrl?.trim()),
    {
      message: "Submission requires either text answer or file URL",
      path: ["textAnswer"],
    },
  );

export const submissionCreateSchema = z
  .object({
    assignmentId: requiredId("Assignment"),
  })
  .and(submissionContentSchema);

export const submissionUpdateSchema = z
  .object({
    submissionId: requiredId("Submission"),
  })
  .and(submissionContentSchema);

export const submissionGradeSchema = z.object({
  submissionId: requiredId("Submission"),
  score: z.coerce
    .number()
    .finite()
    .min(0, "Score must be at least 0")
    .max(9999, "Score is too large"),
  feedback: optionalText(2_000),
});

export const submissionFilterSchema = z.object({
  search: optionalText(100),
  courseId: optionalText(120),
  tutorId: optionalText(120),
  studentId: optionalText(120),
  assignmentId: optionalText(120),
  gradingStatus: z
    .enum(["all", "graded", "ungraded", "late", "on-time"])
    .optional()
    .catch(undefined),
});

export type SubmissionCreateInput = z.infer<typeof submissionCreateSchema>;
export type SubmissionUpdateInput = z.infer<typeof submissionUpdateSchema>;
export type SubmissionGradeInput = z.infer<typeof submissionGradeSchema>;
export type SubmissionFilterInput = z.infer<typeof submissionFilterSchema>;
