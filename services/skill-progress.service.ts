import {
  EnrollmentStatus,
  Prisma,
  SkillLevel,
  type PrismaClient,
} from "@/lib/generated/prisma/client";
import { getDb } from "@/lib/db";
import {
  bulkSkillProgressUpdateSchema,
  skillProgressFilterSchema,
  skillProgressUpdateSchema,
  type BulkSkillProgressUpdateInput,
  type SkillProgressFilterInput,
  type SkillProgressUpdateInput,
} from "@/lib/validators/skill-progress";
import { normalizeSearchText } from "@/services/marketplace-utils";

type SearchParamsInput = Record<string, string | string[] | undefined>;

export type SkillProgressFilters = {
  search?: string;
  courseId?: string;
  tutorId?: string;
  subjectId?: string;
  studentId?: string;
  level?: SkillLevel;
};

export type SkillCourseSummary = {
  id: string;
  title: string;
  subject: {
    id: string;
    name: string;
    slug: string;
  };
  tutor: {
    id: string;
    name: string;
    email: string;
  };
};

export type SkillStudentSummary = {
  id: string;
  name: string;
  email: string;
  displayName: string | null;
  gradeLevel: string | null;
};

export type SkillSummary = {
  id: string;
  courseId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  course: SkillCourseSummary;
};

export type SkillProgressSummary = {
  id: string;
  skillId: string;
  studentId: string;
  enrollmentId: string;
  level: SkillLevel;
  score: number;
  note: string | null;
  evaluatedAt: Date;
  updatedAt: Date;
};

export type SkillProgressMatrixItem = {
  enrollmentId: string;
  student: SkillStudentSummary;
  skill: SkillSummary;
  progress: SkillProgressSummary | null;
};

export type SkillProgressListItem = SkillProgressSummary & {
  skill: SkillSummary;
  student: SkillStudentSummary;
};

export type SkillCourseOption = {
  id: string;
  title: string;
  subjectName: string;
};

type CourseAccessRecord = {
  id: string;
  tutorId: string;
};

type SkillAccessRecord = {
  id: string;
  courseId: string;
  courseTutorId: string;
};

type ActiveEnrollmentRecord = {
  id: string;
  studentId: string;
  courseId: string;
};

type SkillProgressUpsertData = {
  skillId: string;
  studentId: string;
  enrollmentId: string;
  updatedByTutorId: string;
  level: SkillLevel;
  note: string | null;
  evaluatedAt: Date;
};

export type SkillProgressWriteStore = {
  getTutorProfileByUserId(tutorUserId: string): Promise<{ id: string } | null>;
  getCourseAccess(courseId: string): Promise<CourseAccessRecord | null>;
  getSkillAccess(skillId: string): Promise<SkillAccessRecord | null>;
  getActiveEnrollmentForStudent(
    courseId: string,
    studentId: string,
  ): Promise<ActiveEnrollmentRecord | null>;
  upsertStudentSkillProgress(
    data: SkillProgressUpsertData,
  ): Promise<SkillProgressSummary>;
  runInTransaction<T>(
    callback: (store: SkillProgressWriteStore) => Promise<T>,
  ): Promise<T>;
};

export type SkillProgressManagementErrorCode =
  | "TUTOR_PROFILE_REQUIRED"
  | "COURSE_NOT_FOUND"
  | "SKILL_NOT_FOUND"
  | "FORBIDDEN"
  | "ACTIVE_ENROLLMENT_REQUIRED"
  | "SKILL_COURSE_MISMATCH";

export class SkillProgressManagementError extends Error {
  constructor(
    readonly code: SkillProgressManagementErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SkillProgressManagementError";
  }
}

type PrismaSkillProgressClient = Pick<
  PrismaClient,
  "course" | "enrollment" | "skill" | "studentSkillProgress" | "tutorProfile"
>;

function firstValue(value: string | string[] | undefined): string | undefined {
  const selected = Array.isArray(value) ? value[0] : value;

  return selected === "" ? undefined : selected;
}

export function mapSkillLevelToScore(level: SkillLevel): number {
  switch (level) {
    case SkillLevel.NEEDS_WORK:
      return 25;
    case SkillLevel.BASIC:
      return 50;
    case SkillLevel.GOOD:
      return 75;
    case SkillLevel.EXCELLENT:
      return 100;
  }
}

export function parseSkillProgressFilters(
  params: SearchParamsInput,
): SkillProgressFilters {
  const parsed: SkillProgressFilterInput = skillProgressFilterSchema.parse({
    search: firstValue(params.search),
    courseId: firstValue(params.courseId) ?? firstValue(params.course),
    tutorId: firstValue(params.tutorId) ?? firstValue(params.tutor),
    subjectId: firstValue(params.subjectId) ?? firstValue(params.subject),
    studentId: firstValue(params.studentId) ?? firstValue(params.student),
    level: firstValue(params.level),
  });

  return {
    search: normalizeSearchText(parsed.search),
    courseId: normalizeSearchText(parsed.courseId),
    tutorId: normalizeSearchText(parsed.tutorId),
    subjectId: normalizeSearchText(parsed.subjectId),
    studentId: normalizeSearchText(parsed.studentId),
    level: parsed.level,
  };
}

function mapProgressSummary(row: {
  id: string;
  skillId: string;
  studentId: string;
  enrollmentId: string;
  level: SkillLevel;
  note: string | null;
  evaluatedAt: Date;
  updatedAt: Date;
}): SkillProgressSummary {
  return {
    id: row.id,
    skillId: row.skillId,
    studentId: row.studentId,
    enrollmentId: row.enrollmentId,
    level: row.level,
    score: mapSkillLevelToScore(row.level),
    note: row.note,
    evaluatedAt: row.evaluatedAt,
    updatedAt: row.updatedAt,
  };
}

function createPrismaSkillProgressStore(
  client: PrismaSkillProgressClient,
): SkillProgressWriteStore {
  const store: SkillProgressWriteStore = {
    async getTutorProfileByUserId(tutorUserId) {
      return client.tutorProfile.findUnique({
        where: { userId: tutorUserId },
        select: { id: true },
      });
    },

    async getCourseAccess(courseId) {
      return client.course.findUnique({
        where: { id: courseId },
        select: { id: true, tutorId: true },
      });
    },

    async getSkillAccess(skillId) {
      const skill = await client.skill.findUnique({
        where: { id: skillId },
        select: {
          id: true,
          courseId: true,
          course: { select: { tutorId: true } },
        },
      });

      if (!skill) {
        return null;
      }

      return {
        id: skill.id,
        courseId: skill.courseId,
        courseTutorId: skill.course.tutorId,
      };
    },

    async getActiveEnrollmentForStudent(courseId, studentId) {
      return client.enrollment.findFirst({
        where: { courseId, studentId, status: EnrollmentStatus.ACTIVE },
        orderBy: { enrolledAt: "desc" },
        select: { id: true, studentId: true, courseId: true },
      });
    },

    async upsertStudentSkillProgress(data) {
      const row = await client.studentSkillProgress.upsert({
        where: {
          skillId_studentId: {
            skillId: data.skillId,
            studentId: data.studentId,
          },
        },
        update: {
          enrollmentId: data.enrollmentId,
          updatedByTutorId: data.updatedByTutorId,
          level: data.level,
          note: data.note,
          evaluatedAt: data.evaluatedAt,
        },
        create: data,
      });

      return mapProgressSummary(row);
    },

    async runInTransaction(callback) {
      return callback(store);
    },
  };

  return store;
}

const prismaSkillProgressWriteStore: SkillProgressWriteStore = {
  async getTutorProfileByUserId(tutorUserId) {
    return createPrismaSkillProgressStore(getDb()).getTutorProfileByUserId(
      tutorUserId,
    );
  },
  async getCourseAccess(courseId) {
    return createPrismaSkillProgressStore(getDb()).getCourseAccess(courseId);
  },
  async getSkillAccess(skillId) {
    return createPrismaSkillProgressStore(getDb()).getSkillAccess(skillId);
  },
  async getActiveEnrollmentForStudent(courseId, studentId) {
    return createPrismaSkillProgressStore(getDb()).getActiveEnrollmentForStudent(
      courseId,
      studentId,
    );
  },
  async upsertStudentSkillProgress(data) {
    return createPrismaSkillProgressStore(getDb()).upsertStudentSkillProgress(
      data,
    );
  },
  async runInTransaction(callback) {
    return getDb().$transaction(
      async (tx) =>
        callback(
          createPrismaSkillProgressStore(tx as PrismaSkillProgressClient),
        ),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  },
};

async function getRequiredTutorProfileId(
  tutorUserId: string,
  store: SkillProgressWriteStore,
): Promise<string> {
  const tutor = await store.getTutorProfileByUserId(tutorUserId);

  if (!tutor) {
    throw new SkillProgressManagementError(
      "TUTOR_PROFILE_REQUIRED",
      "A tutor profile is required to manage skill progress.",
    );
  }

  return tutor.id;
}

async function assertTutorOwnsCourse(
  tutorUserId: string,
  courseId: string,
  store: SkillProgressWriteStore,
): Promise<string> {
  const [tutorId, course] = await Promise.all([
    getRequiredTutorProfileId(tutorUserId, store),
    store.getCourseAccess(courseId),
  ]);

  if (!course) {
    throw new SkillProgressManagementError(
      "COURSE_NOT_FOUND",
      "Course not found.",
    );
  }

  if (course.tutorId !== tutorId) {
    throw new SkillProgressManagementError(
      "FORBIDDEN",
      "You do not have permission to manage skill progress for this course.",
    );
  }

  return tutorId;
}

async function updateSkillProgressRecord(
  tutorUserId: string,
  input: SkillProgressUpdateInput,
  store: SkillProgressWriteStore,
): Promise<SkillProgressSummary> {
  const tutorId = await assertTutorOwnsCourse(tutorUserId, input.courseId, store);
  const [skill, enrollment] = await Promise.all([
    store.getSkillAccess(input.skillId),
    store.getActiveEnrollmentForStudent(input.courseId, input.studentId),
  ]);

  if (!skill) {
    throw new SkillProgressManagementError(
      "SKILL_NOT_FOUND",
      "Skill not found.",
    );
  }

  if (skill.courseId !== input.courseId) {
    throw new SkillProgressManagementError(
      "SKILL_COURSE_MISMATCH",
      "Skill does not belong to this course.",
    );
  }

  if (skill.courseTutorId !== tutorId) {
    throw new SkillProgressManagementError(
      "FORBIDDEN",
      "You do not have permission to manage this skill.",
    );
  }

  if (!enrollment) {
    throw new SkillProgressManagementError(
      "ACTIVE_ENROLLMENT_REQUIRED",
      "Skill progress can be updated only for ACTIVE enrolled students.",
    );
  }

  return store.upsertStudentSkillProgress({
    skillId: input.skillId,
    studentId: input.studentId,
    enrollmentId: enrollment.id,
    updatedByTutorId: tutorId,
    level: input.level,
    note: input.note || null,
    evaluatedAt: new Date(),
  });
}

export async function updateStudentSkillProgress(
  tutorUserId: string,
  studentId: string,
  courseId: string,
  skillId: string,
  input: Omit<SkillProgressUpdateInput, "studentId" | "courseId" | "skillId">,
  store: SkillProgressWriteStore = prismaSkillProgressWriteStore,
): Promise<SkillProgressSummary> {
  const parsed = skillProgressUpdateSchema.parse({
    studentId,
    courseId,
    skillId,
    ...input,
  });

  return store.runInTransaction((tx) =>
    updateSkillProgressRecord(tutorUserId, parsed, tx),
  );
}

export async function bulkUpdateStudentSkillProgress(
  tutorUserId: string,
  courseId: string,
  input: Omit<BulkSkillProgressUpdateInput, "courseId">,
  store: SkillProgressWriteStore = prismaSkillProgressWriteStore,
): Promise<SkillProgressSummary[]> {
  const parsed = bulkSkillProgressUpdateSchema.parse({ courseId, ...input });

  return store.runInTransaction(async (tx) => {
    const results: SkillProgressSummary[] = [];

    for (const record of parsed.records) {
      results.push(
        await updateSkillProgressRecord(
          tutorUserId,
          {
            studentId: record.studentId,
            courseId: parsed.courseId,
            skillId: record.skillId,
            level: record.level,
            note: record.note,
          },
          tx,
        ),
      );
    }

    return results;
  });
}

const studentSummarySelect = {
  id: true,
  displayName: true,
  gradeLevel: true,
  user: {
    select: {
      name: true,
      email: true,
    },
  },
} satisfies Prisma.StudentProfileSelect;

const progressSelect = {
  id: true,
  skillId: true,
  studentId: true,
  enrollmentId: true,
  level: true,
  note: true,
  evaluatedAt: true,
  updatedAt: true,
} satisfies Prisma.StudentSkillProgressSelect;

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
} satisfies Prisma.SkillSelect;

const progressListSelect = {
  ...progressSelect,
  student: { select: studentSummarySelect },
  skill: { select: skillSelect },
} satisfies Prisma.StudentSkillProgressSelect;

type StudentSummaryRow = Prisma.StudentProfileGetPayload<{
  select: typeof studentSummarySelect;
}>;

type SkillRow = Prisma.SkillGetPayload<{
  select: typeof skillSelect;
}>;

type ProgressListRow = Prisma.StudentSkillProgressGetPayload<{
  select: typeof progressListSelect;
}>;

function mapStudentSummary(row: StudentSummaryRow): SkillStudentSummary {
  return {
    id: row.id,
    name: row.user.name,
    email: row.user.email,
    displayName: row.displayName,
    gradeLevel: row.gradeLevel,
  };
}

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

function buildSkillProgressWhere(
  filters: SkillProgressFilters,
  base: Prisma.StudentSkillProgressWhereInput = {},
): Prisma.StudentSkillProgressWhereInput {
  const and: Prisma.StudentSkillProgressWhereInput[] = [base];

  if (filters.search) {
    and.push({
      OR: [
        { note: { contains: filters.search, mode: "insensitive" } },
        { skill: { name: { contains: filters.search, mode: "insensitive" } } },
        { skill: { description: { contains: filters.search, mode: "insensitive" } } },
        { skill: { course: { title: { contains: filters.search, mode: "insensitive" } } } },
        { student: { displayName: { contains: filters.search, mode: "insensitive" } } },
        { student: { user: { name: { contains: filters.search, mode: "insensitive" } } } },
      ],
    });
  }

  if (filters.courseId) {
    and.push({ skill: { courseId: filters.courseId } });
  }

  if (filters.tutorId) {
    and.push({ skill: { course: { tutorId: filters.tutorId } } });
  }

  if (filters.subjectId) {
    and.push({ skill: { course: { subjectId: filters.subjectId } } });
  }

  if (filters.studentId) {
    and.push({ studentId: filters.studentId });
  }

  if (filters.level) {
    and.push({ level: filters.level });
  }

  return { AND: and };
}

function mapProgressListItem(row: ProgressListRow): SkillProgressListItem {
  return {
    ...mapProgressSummary(row),
    skill: mapSkill(row.skill),
    student: mapStudentSummary(row.student),
  };
}

function progressMatchesFilter(
  item: SkillProgressMatrixItem,
  filters: SkillProgressFilters,
): boolean {
  if (filters.level && item.progress?.level !== filters.level) {
    return false;
  }

  if (!filters.search) {
    return true;
  }

  const haystack = [
    item.student.name,
    item.student.email,
    item.student.displayName,
    item.skill.name,
    item.skill.description,
    item.skill.course.title,
    item.skill.course.subject.name,
    item.progress?.note,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(filters.search.toLowerCase());
}

export async function getTutorCourseSkillProgress(
  tutorUserId: string,
  courseId: string,
  filters: SkillProgressFilters = {},
): Promise<SkillProgressMatrixItem[]> {
  const course = await getDb().course.findFirst({
    where: { id: courseId, tutor: { userId: tutorUserId } },
    select: {
      enrollments: {
        where: { status: EnrollmentStatus.ACTIVE },
        orderBy: { enrolledAt: "asc" },
        select: {
          id: true,
          student: { select: studentSummarySelect },
        },
      },
      skills: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          ...skillSelect,
          progress: {
            where: { enrollment: { status: EnrollmentStatus.ACTIVE } },
            select: progressSelect,
          },
        },
      },
    },
  });

  if (!course) {
    return [];
  }

  const rows = course.enrollments.flatMap((enrollment) =>
    course.skills.map((skill) => {
      const progress =
        skill.progress.find(
          (candidate) => candidate.studentId === enrollment.student.id,
        ) ?? null;

      return {
        enrollmentId: enrollment.id,
        student: mapStudentSummary(enrollment.student),
        skill: mapSkill(skill),
        progress: progress ? mapProgressSummary(progress) : null,
      };
    }),
  );

  return rows.filter((row) => progressMatchesFilter(row, filters));
}

export async function getTutorStudentSkillProgress(
  tutorUserId: string,
  studentId: string,
  filters: SkillProgressFilters = {},
): Promise<SkillProgressMatrixItem[]> {
  const courses = await getDb().course.findMany({
    where: {
      tutor: { userId: tutorUserId },
      ...(filters.courseId ? { id: filters.courseId } : {}),
      ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
      enrollments: {
        some: { studentId, status: EnrollmentStatus.ACTIVE },
      },
    },
    orderBy: { title: "asc" },
    select: {
      enrollments: {
        where: { studentId, status: EnrollmentStatus.ACTIVE },
        take: 1,
        select: {
          id: true,
          student: { select: studentSummarySelect },
        },
      },
      skills: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          ...skillSelect,
          progress: {
            where: {
              studentId,
              enrollment: { status: EnrollmentStatus.ACTIVE },
            },
            take: 1,
            select: progressSelect,
          },
        },
      },
    },
  });

  const rows = courses.flatMap((course) => {
    const enrollment = course.enrollments[0];

    if (!enrollment) {
      return [];
    }

    return course.skills.map((skill) => ({
      enrollmentId: enrollment.id,
      student: mapStudentSummary(enrollment.student),
      skill: mapSkill(skill),
      progress: skill.progress[0] ? mapProgressSummary(skill.progress[0]) : null,
    }));
  });

  return rows.filter((row) => progressMatchesFilter(row, filters));
}

export async function getStudentSkillProgress(
  studentUserId: string,
  filters: SkillProgressFilters = {},
): Promise<SkillProgressMatrixItem[]> {
  const student = await getDb().studentProfile.findUnique({
    where: { userId: studentUserId },
    select: { id: true },
  });

  if (!student) {
    return [];
  }

  const courses = await getDb().course.findMany({
    where: {
      ...(filters.courseId ? { id: filters.courseId } : {}),
      ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
      enrollments: {
        some: { studentId: student.id, status: EnrollmentStatus.ACTIVE },
      },
    },
    orderBy: { title: "asc" },
    select: {
      enrollments: {
        where: { studentId: student.id, status: EnrollmentStatus.ACTIVE },
        take: 1,
        select: {
          id: true,
          student: { select: studentSummarySelect },
        },
      },
      skills: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          ...skillSelect,
          progress: {
            where: {
              studentId: student.id,
              enrollment: { status: EnrollmentStatus.ACTIVE },
            },
            take: 1,
            select: progressSelect,
          },
        },
      },
    },
  });

  const rows = courses.flatMap((course) => {
    const enrollment = course.enrollments[0];

    if (!enrollment) {
      return [];
    }

    return course.skills.map((skill) => ({
      enrollmentId: enrollment.id,
      student: mapStudentSummary(enrollment.student),
      skill: mapSkill(skill),
      progress: skill.progress[0] ? mapProgressSummary(skill.progress[0]) : null,
    }));
  });

  return rows.filter((row) => progressMatchesFilter(row, filters));
}

export async function getParentChildSkillProgress(
  parentUserId: string,
  studentId: string,
  filters: SkillProgressFilters = {},
): Promise<SkillProgressMatrixItem[]> {
  const link = await getDb().parentStudentLink.findFirst({
    where: {
      parent: { userId: parentUserId },
      studentId,
      isActive: true,
      endedAt: null,
    },
    select: { id: true },
  });

  if (!link) {
    return [];
  }

  const courses = await getDb().course.findMany({
    where: {
      ...(filters.courseId ? { id: filters.courseId } : {}),
      ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
      enrollments: {
        some: { studentId, status: EnrollmentStatus.ACTIVE },
      },
    },
    orderBy: { title: "asc" },
    select: {
      enrollments: {
        where: { studentId, status: EnrollmentStatus.ACTIVE },
        take: 1,
        select: {
          id: true,
          student: { select: studentSummarySelect },
        },
      },
      skills: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          ...skillSelect,
          progress: {
            where: {
              studentId,
              enrollment: { status: EnrollmentStatus.ACTIVE },
            },
            take: 1,
            select: progressSelect,
          },
        },
      },
    },
  });

  const rows = courses.flatMap((course) => {
    const enrollment = course.enrollments[0];

    if (!enrollment) {
      return [];
    }

    return course.skills.map((skill) => ({
      enrollmentId: enrollment.id,
      student: mapStudentSummary(enrollment.student),
      skill: mapSkill(skill),
      progress: skill.progress[0] ? mapProgressSummary(skill.progress[0]) : null,
    }));
  });

  return rows.filter((row) => progressMatchesFilter(row, filters));
}

export async function getAdminSkillProgress(
  filters: SkillProgressFilters = {},
): Promise<SkillProgressListItem[]> {
  const rows = await getDb().studentSkillProgress.findMany({
    where: buildSkillProgressWhere(filters),
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: 200,
    select: progressListSelect,
  });

  return rows.map(mapProgressListItem);
}

export async function getSkillAverageForStudent(
  studentId: string,
  courseId?: string,
): Promise<number | null> {
  const rows = await getDb().studentSkillProgress.findMany({
    where: {
      studentId,
      ...(courseId ? { skill: { courseId } } : {}),
      enrollment: { status: EnrollmentStatus.ACTIVE },
    },
    select: { level: true },
  });

  if (rows.length === 0) {
    return null;
  }

  return Math.round(
    rows.reduce((sum, row) => sum + mapSkillLevelToScore(row.level), 0) /
      rows.length,
  );
}

export async function getSkillProgressCourseOptionsForStudent(
  studentUserId: string,
): Promise<SkillCourseOption[]> {
  const student = await getDb().studentProfile.findUnique({
    where: { userId: studentUserId },
    select: { id: true },
  });

  if (!student) {
    return [];
  }

  return getSkillProgressCourseOptionsForStudentId(student.id);
}

export async function getSkillProgressCourseOptionsForStudentId(
  studentId: string,
): Promise<SkillCourseOption[]> {
  const courses = await getDb().course.findMany({
    where: {
      enrollments: {
        some: { studentId, status: EnrollmentStatus.ACTIVE },
      },
    },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      subject: { select: { name: true } },
    },
  });

  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    subjectName: course.subject.name,
  }));
}

export async function getTutorSkillProgressCourseOptions(
  tutorUserId: string,
): Promise<SkillCourseOption[]> {
  const courses = await getDb().course.findMany({
    where: { tutor: { userId: tutorUserId } },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      subject: { select: { name: true } },
    },
  });

  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    subjectName: course.subject.name,
  }));
}

export async function getAdminSkillProgressFilterOptions(): Promise<{
  courses: Array<{ id: string; title: string }>;
  tutors: Array<{ id: string; name: string; email: string }>;
  subjects: Array<{ id: string; name: string }>;
  students: Array<{ id: string; name: string; email: string }>;
}> {
  const [courses, tutors, subjects, students] = await Promise.all([
    getDb().course.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    getDb().tutorProfile.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        user: { select: { name: true, email: true } },
      },
    }),
    getDb().subject.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getDb().studentProfile.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  return {
    courses,
    tutors: tutors.map((tutor) => ({
      id: tutor.id,
      name: tutor.user.name,
      email: tutor.user.email,
    })),
    subjects,
    students: students.map((student) => ({
      id: student.id,
      name: student.user.name,
      email: student.user.email,
    })),
  };
}
