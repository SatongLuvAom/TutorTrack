import { z } from "zod";
import { SkillLevel } from "@/lib/generated/prisma/enums";

const requiredText = (fieldName: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .max(maxLength, `${fieldName} is too long`);

const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength).optional().catch(undefined);

export const skillLevelSchema = z.enum(SkillLevel);

export const skillProgressUpdateSchema = z.object({
  studentId: requiredText("Student", 120),
  courseId: requiredText("Course", 120),
  skillId: requiredText("Skill", 120),
  level: skillLevelSchema,
  note: optionalText(2_000),
});

export const bulkSkillProgressUpdateSchema = z.object({
  courseId: requiredText("Course", 120),
  records: z
    .array(
      z.object({
        studentId: requiredText("Student", 120),
        skillId: requiredText("Skill", 120),
        level: skillLevelSchema,
        note: optionalText(2_000),
      }),
    )
    .min(1, "At least one skill progress record is required"),
});

export const skillProgressFilterSchema = z.object({
  search: optionalText(100),
  courseId: optionalText(120),
  tutorId: optionalText(120),
  subjectId: optionalText(120),
  studentId: optionalText(120),
  level: skillLevelSchema.optional().catch(undefined),
});

export type SkillProgressUpdateInput = z.infer<
  typeof skillProgressUpdateSchema
>;
export type BulkSkillProgressUpdateInput = z.infer<
  typeof bulkSkillProgressUpdateSchema
>;
export type SkillProgressFilterInput = z.infer<
  typeof skillProgressFilterSchema
>;
