import { z } from "zod";
import { SessionStatus } from "@/lib/generated/prisma/enums";

const requiredText = (fieldName: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .max(maxLength, `${fieldName} is too long`);

const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength).optional().catch(undefined);

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .catch(undefined)
  .transform((value) => (value === "" ? undefined : value))
  .pipe(z.string().url("Meeting link must be a valid URL").optional());

const scheduledRangeSchema = z
  .object({
    scheduledStart: z.coerce.date({
      error: "Scheduled start is required",
    }),
    scheduledEnd: z.coerce.date({
      error: "Scheduled end is required",
    }),
  })
  .refine((input) => input.scheduledEnd > input.scheduledStart, {
    message: "Scheduled end must be after scheduled start",
    path: ["scheduledEnd"],
  });

export const sessionCreateSchema = z
  .object({
    courseId: requiredText("Course", 120),
    title: requiredText("Title", 160),
    description: optionalText(1_000),
    meetingLink: optionalUrl,
  })
  .and(scheduledRangeSchema);

export const sessionUpdateSchema = z
  .object({
    title: requiredText("Title", 160),
    description: optionalText(1_000),
    meetingLink: optionalUrl,
  })
  .and(scheduledRangeSchema);

export const sessionFilterSchema = z.object({
  search: z.string().trim().max(100).optional().catch(undefined),
  courseId: z.string().trim().max(120).optional().catch(undefined),
  tutorId: z.string().trim().max(120).optional().catch(undefined),
  status: z
    .enum([
      SessionStatus.SCHEDULED,
      SessionStatus.COMPLETED,
      SessionStatus.CANCELLED,
    ])
    .optional()
    .catch(undefined),
});

export const sessionStatusUpdateSchema = z.object({
  sessionId: requiredText("Session", 120),
  status: z.enum([
    SessionStatus.SCHEDULED,
    SessionStatus.COMPLETED,
    SessionStatus.CANCELLED,
  ]),
  returnTo: z.string().trim().max(300).optional().catch(undefined),
});

export type SessionCreateInput = z.infer<typeof sessionCreateSchema>;
export type SessionUpdateInput = z.infer<typeof sessionUpdateSchema>;
export type SessionFilterInput = z.infer<typeof sessionFilterSchema>;
export type SessionStatusUpdateInput = z.infer<
  typeof sessionStatusUpdateSchema
>;
