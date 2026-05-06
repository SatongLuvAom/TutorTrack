import { getDb } from "@/lib/db";
import type { SkillSummary } from "@/services/skill-progress.service";

const skillSelect = {
  id: true,
  courseId: true,
  name: true,
  description: true,
  sortOrder: true,
  course: {
    select: {
      id: true,
      title: true,
      subject: {
        select: { id: true, name: true, slug: true },
      },
      tutor: {
        select: {
          id: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  },
} as const;

type SkillRow = {
  id: string;
  courseId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  course: {
    id: string;
    title: string;
    subject: { id: string; name: string; slug: string };
    tutor: {
      id: string;
      user: { name: string; email: string };
    };
  };
};

function mapSkill(row: SkillRow): SkillSummary {
  return {
    id: row.id,
    courseId: row.courseId,
    name: row.name,
    description: row.description,
    sortOrder: row.sortOrder,
    course: {
      id: row.course.id,
      title: row.course.title,
      subject: row.course.subject,
      tutor: {
        id: row.course.tutor.id,
        name: row.course.tutor.user.name,
        email: row.course.tutor.user.email,
      },
    },
  };
}

export async function getCourseSkills(courseId: string): Promise<SkillSummary[]> {
  const rows = await getDb().skill.findMany({
    where: { courseId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: skillSelect,
  });

  return rows.map(mapSkill);
}

export async function getSkillsBySubject(
  subjectId: string,
): Promise<SkillSummary[]> {
  const rows = await getDb().skill.findMany({
    where: { course: { subjectId } },
    orderBy: [{ course: { title: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
    select: skillSelect,
  });

  return rows.map(mapSkill);
}
