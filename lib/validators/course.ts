import { z } from "zod";
import { CourseStatus, CourseType } from "@/lib/generated/prisma/enums";

export const courseLevelOptions = [
  "middle-school",
  "high-school",
  "exam-prep",
  "international",
  "all-levels",
] as const;

export const courseLevelSchema = z.enum(courseLevelOptions);

const requiredText = (fieldName: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .max(maxLength, `${fieldName} is too long`);

const bahtAmountSchema = z.coerce
  .number()
  .finite("Price must be a valid number")
  .min(0, "Price must be at least 0")
  .max(1_000_000, "Price is too high");

const positiveIntSchema = (fieldName: string, maxValue: number) =>
  z.coerce
    .number()
    .int(`${fieldName} must be a whole number`)
    .min(1, `${fieldName} must be at least 1`)
    .max(maxValue, `${fieldName} is too high`);

export const courseCreateSchema = z.object({
  title: requiredText("Title", 160),
  description: requiredText("Description", 2_000),
  subjectId: requiredText("Subject", 120),
  level: courseLevelSchema,
  courseType: z.enum([CourseType.PRIVATE, CourseType.GROUP]),
  price: bahtAmountSchema,
  maxStudents: positiveIntSchema("Max students", 200),
  totalSessions: positiveIntSchema("Total sessions", 200),
});

export const courseUpdateSchema = courseCreateSchema;

export const courseFilterSchema = z.object({
  search: z.string().trim().max(100).optional().catch(undefined),
  subjectId: z.string().trim().max(120).optional().catch(undefined),
  tutorId: z.string().trim().max(120).optional().catch(undefined),
  status: z
    .enum([CourseStatus.DRAFT, CourseStatus.PUBLISHED, CourseStatus.ARCHIVED])
    .optional()
    .catch(undefined),
  courseType: z
    .enum([CourseType.PRIVATE, CourseType.GROUP])
    .optional()
    .catch(undefined),
});

export const courseStatusUpdateSchema = z.object({
  status: z.enum([
    CourseStatus.DRAFT,
    CourseStatus.PUBLISHED,
    CourseStatus.ARCHIVED,
  ]),
});

export const courseStatusActionSchema = courseStatusUpdateSchema.extend({
  courseId: requiredText("Course", 120),
  returnTo: z.string().trim().max(500).optional().catch(undefined),
});

export type CourseCreateInput = z.infer<typeof courseCreateSchema>;
export type CourseUpdateInput = z.infer<typeof courseUpdateSchema>;
export type CourseFilterInput = z.infer<typeof courseFilterSchema>;
export type CourseStatusUpdateInput = z.infer<typeof courseStatusUpdateSchema>;
export type CourseStatusActionInput = z.infer<typeof courseStatusActionSchema>;
export type CourseLevel = (typeof courseLevelOptions)[number];
