import {
  AssessmentType,
  EnrollmentStatus,
  Prisma,
  type PrismaClient,
} from "@/lib/generated/prisma/client";
import { getDb } from "@/lib/db";
import {
  assessmentCreateSchema,
  assessmentFilterSchema,
  assessmentUpdateSchema,
  bulkAssessmentScoreSchema,
  type AssessmentCreateInput,
  type AssessmentFilterInput,
  type AssessmentUpdateInput,
  type BulkAssessmentScoreInput,
} from "@/lib/validators/assessment";
import { normalizeSearchText } from "@/services/marketplace-utils";

type SearchParamsInput = Record<string, string | string[] | undefined>;
type DecimalLike = { toString(): string } | number | string | null | undefined;

export type AssessmentFilters = {
  search?: string;
  courseId?: string;
  tutorId?: string;
  studentId?: string;
  type?: AssessmentType;
  dateFrom?: Date;
  dateTo?: Date;
};

export type AssessmentCourseSummary = {
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

export type AssessmentStudentSummary = {
  id: string;
  name: string;
  email: string;
  displayName: string | null;
  gradeLevel: string | null;
};

export type AssessmentScoreSummary = {
  id: string;
  studentId: string;
  enrollmentId: string;
  score: number | null;
  maxScore: number;
  percentage: number | null;
  note: string | null;
  updatedAt: Date;
};

export type AssessmentListItem = {
  id: string;
  courseId: string;
  title: string;
  type: AssessmentType;
  takenAt: Date | null;
  maxScore: number;
  createdAt: Date;
  updatedAt: Date;
  course: AssessmentCourseSummary;
  stats: {
    activeEnrollmentCount: number;
    scoredCount: number;
    averageScore: number | null;
    averagePercentage: number | null;
  };
};

export type AssessmentScoreListItem = AssessmentScoreSummary & {
  title: string;
  type: AssessmentType;
  takenAt: Date | null;
  course: AssessmentCourseSummary;
  student: AssessmentStudentSummary;
};

export type AssessmentRosterItem = {
  enrollmentId: string;
  student: AssessmentStudentSummary;
  assessment: AssessmentScoreSummary | null;
};

export type TutorAssessmentDetail = AssessmentListItem & {
  roster: AssessmentRosterItem[];
};

export type AssessmentCourseOption = {
  id: string;
  title: string;
  subjectName: string;
};

type CourseAccessRecord = {
  id: string;
  tutorId: string;
};

type ActiveEnrollmentRecord = {
  id: string;
  studentId: string;
  courseId: string;
};

type AssessmentGroupRecord = {
  id: string;
  courseId: string;
  title: string;
  type: AssessmentType;
  takenAt: Date | null;
  maxScore: number;
  courseTutorId: string;
};

type AssessmentCreateRow = {
  courseId: string;
  studentId: string;
  enrollmentId: string;
  title: string;
  type: AssessmentType;
  maxScore: number;
  takenAt: Date;
  score: number | null;
  note: string | null;
};

type AssessmentGroupUpdateData = {
  title: string;
  type: AssessmentType;
  maxScore: number;
  takenAt: Date;
};

type AssessmentScoreUpdateData = {
  studentId: string;
  enrollmentId: string;
  score: number | null;
  note: string | null;
};

export type AssessmentWriteStore = {
  getTutorProfileByUserId(tutorUserId: string): Promise<{ id: string } | null>;
  getCourseAccess(courseId: string): Promise<CourseAccessRecord | null>;
  getAssessmentForMutation(
    assessmentId: string,
  ): Promise<AssessmentGroupRecord | null>;
  getActiveEnrollmentsForCourse(
    courseId: string,
  ): Promise<ActiveEnrollmentRecord[]>;
  getActiveEnrollmentForStudent(
    courseId: string,
    studentId: string,
  ): Promise<ActiveEnrollmentRecord | null>;
  countAssessmentGroup(group: AssessmentGroupRecord): Promise<number>;
  getGroupScoreValues(group: AssessmentGroupRecord): Promise<number[]>;
  createAssessmentRows(rows: AssessmentCreateRow[]): Promise<string>;
  updateAssessmentGroup(
    group: AssessmentGroupRecord,
    data: AssessmentGroupUpdateData,
  ): Promise<void>;
  recordAssessmentScore(
    group: AssessmentGroupRecord,
    data: AssessmentScoreUpdateData,
  ): Promise<void>;
  runInTransaction<T>(
    callback: (store: AssessmentWriteStore) => Promise<T>,
  ): Promise<T>;
};

export type AssessmentManagementErrorCode =
  | "TUTOR_PROFILE_REQUIRED"
  | "COURSE_NOT_FOUND"
  | "ASSESSMENT_NOT_FOUND"
  | "FORBIDDEN"
  | "ACTIVE_ENROLLMENT_REQUIRED"
  | "DUPLICATE_ASSESSMENT"
  | "SCORE_EXCEEDS_MAX_SCORE";

export class AssessmentManagementError extends Error {
  constructor(
    readonly code: AssessmentManagementErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AssessmentManagementError";
  }
}

type PrismaAssessmentClient = Pick<
  PrismaClient,
  "assessment" | "course" | "enrollment" | "tutorProfile"
>;

function firstValue(value: string | string[] | undefined): string | undefined {
  const selected = Array.isArray(value) ? value[0] : value;

  return selected === "" ? undefined : selected;
}

function decimalToNumber(value: DecimalLike): number {
  return value === null || value === undefined ? 0 : Number(value);
}

function nullableDecimalToNumber(value: DecimalLike): number | null {
  return value === null || value === undefined ? null : Number(value);
}

export function calculatePercentage(
  score: number | null,
  maxScore: number,
): number | null {
  if (score === null || maxScore <= 0) {
    return null;
  }

  return Math.round((score / maxScore) * 100);
}

export function parseAssessmentFilters(
  params: SearchParamsInput,
): AssessmentFilters {
  const parsed: AssessmentFilterInput = assessmentFilterSchema.parse({
    search: firstValue(params.search),
    courseId: firstValue(params.courseId) ?? firstValue(params.course),
    tutorId: firstValue(params.tutorId) ?? firstValue(params.tutor),
    studentId: firstValue(params.studentId) ?? firstValue(params.student),
    type: firstValue(params.type),
    dateFrom: firstValue(params.dateFrom),
    dateTo: firstValue(params.dateTo),
  });

  return {
    search: normalizeSearchText(parsed.search),
    courseId: normalizeSearchText(parsed.courseId),
    tutorId: normalizeSearchText(parsed.tutorId),
    studentId: normalizeSearchText(parsed.studentId),
    type: parsed.type,
    dateFrom: parsed.dateFrom,
    dateTo: parsed.dateTo,
  };
}

function assertScoreWithinMaxScore(
  score: number | null | undefined,
  maxScore: number,
): void {
  if (score !== null && score !== undefined && score > maxScore) {
    throw new AssessmentManagementError(
      "SCORE_EXCEEDS_MAX_SCORE",
      "Score cannot exceed assessment max score.",
    );
  }
}

function groupWhere(
  group: AssessmentGroupRecord,
): Prisma.AssessmentWhereInput {
  return {
    courseId: group.courseId,
    title: group.title,
    type: group.type,
    takenAt: group.takenAt,
    maxScore: group.maxScore,
  };
}

function createPrismaAssessmentStore(
  client: PrismaAssessmentClient,
): AssessmentWriteStore {
  const store: AssessmentWriteStore = {
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

    async getAssessmentForMutation(assessmentId) {
      const row = await client.assessment.findUnique({
        where: { id: assessmentId },
        select: {
          id: true,
          courseId: true,
          title: true,
          type: true,
          takenAt: true,
          maxScore: true,
          course: { select: { tutorId: true } },
        },
      });

      if (!row) {
        return null;
      }

      return {
        id: row.id,
        courseId: row.courseId,
        title: row.title,
        type: row.type,
        takenAt: row.takenAt,
        maxScore: decimalToNumber(row.maxScore),
        courseTutorId: row.course.tutorId,
      };
    },

    async getActiveEnrollmentsForCourse(courseId) {
      return client.enrollment.findMany({
        where: { courseId, status: EnrollmentStatus.ACTIVE },
        orderBy: { enrolledAt: "asc" },
        select: { id: true, studentId: true, courseId: true },
      });
    },

    async getActiveEnrollmentForStudent(courseId, studentId) {
      return client.enrollment.findFirst({
        where: { courseId, studentId, status: EnrollmentStatus.ACTIVE },
        orderBy: { enrolledAt: "desc" },
        select: { id: true, studentId: true, courseId: true },
      });
    },

    async countAssessmentGroup(group) {
      return client.assessment.count({
        where: groupWhere(group),
      });
    },

    async getGroupScoreValues(group) {
      const rows = await client.assessment.findMany({
        where: groupWhere(group),
        select: { score: true },
      });

      return rows
        .map((row) => nullableDecimalToNumber(row.score))
        .filter((score): score is number => score !== null);
    },

    async createAssessmentRows(rows) {
      const created = await Promise.all(
        rows.map((row) =>
          client.assessment.create({
            data: row,
            select: { id: true },
          }),
        ),
      );

      return created[0]?.id ?? "";
    },

    async updateAssessmentGroup(group, data) {
      await client.assessment.updateMany({
        where: groupWhere(group),
        data,
      });
    },

    async recordAssessmentScore(group, data) {
      const existing = await client.assessment.findFirst({
        where: { ...groupWhere(group), studentId: data.studentId },
        select: { id: true },
      });

      if (existing) {
        await client.assessment.updateMany({
          where: { ...groupWhere(group), studentId: data.studentId },
          data: {
            enrollmentId: data.enrollmentId,
            score: data.score,
            note: data.note,
          },
        });
        return;
      }

      await client.assessment.create({
        data: {
          courseId: group.courseId,
          studentId: data.studentId,
          enrollmentId: data.enrollmentId,
          title: group.title,
          type: group.type,
          maxScore: group.maxScore,
          takenAt: group.takenAt,
          score: data.score,
          note: data.note,
        },
      });
    },

    async runInTransaction(callback) {
      return callback(store);
    },
  };

  return store;
}

const prismaAssessmentWriteStore: AssessmentWriteStore = {
  async getTutorProfileByUserId(tutorUserId) {
    return createPrismaAssessmentStore(getDb()).getTutorProfileByUserId(
      tutorUserId,
    );
  },
  async getCourseAccess(courseId) {
    return createPrismaAssessmentStore(getDb()).getCourseAccess(courseId);
  },
  async getAssessmentForMutation(assessmentId) {
    return createPrismaAssessmentStore(getDb()).getAssessmentForMutation(
      assessmentId,
    );
  },
  async getActiveEnrollmentsForCourse(courseId) {
    return createPrismaAssessmentStore(getDb()).getActiveEnrollmentsForCourse(
      courseId,
    );
  },
  async getActiveEnrollmentForStudent(courseId, studentId) {
    return createPrismaAssessmentStore(getDb()).getActiveEnrollmentForStudent(
      courseId,
      studentId,
    );
  },
  async countAssessmentGroup(group) {
    return createPrismaAssessmentStore(getDb()).countAssessmentGroup(group);
  },
  async getGroupScoreValues(group) {
    return createPrismaAssessmentStore(getDb()).getGroupScoreValues(group);
  },
  async createAssessmentRows(rows) {
    return createPrismaAssessmentStore(getDb()).createAssessmentRows(rows);
  },
  async updateAssessmentGroup(group, data) {
    return createPrismaAssessmentStore(getDb()).updateAssessmentGroup(
      group,
      data,
    );
  },
  async recordAssessmentScore(group, data) {
    return createPrismaAssessmentStore(getDb()).recordAssessmentScore(
      group,
      data,
    );
  },
  async runInTransaction(callback) {
    return getDb().$transaction(
      async (tx) =>
        callback(createPrismaAssessmentStore(tx as PrismaAssessmentClient)),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  },
};

async function getRequiredTutorProfileId(
  tutorUserId: string,
  store: AssessmentWriteStore,
): Promise<string> {
  const tutor = await store.getTutorProfileByUserId(tutorUserId);

  if (!tutor) {
    throw new AssessmentManagementError(
      "TUTOR_PROFILE_REQUIRED",
      "A tutor profile is required to manage assessments.",
    );
  }

  return tutor.id;
}

async function getTutorOwnedCourse(
  tutorUserId: string,
  courseId: string,
  store: AssessmentWriteStore,
): Promise<CourseAccessRecord> {
  const [tutorId, course] = await Promise.all([
    getRequiredTutorProfileId(tutorUserId, store),
    store.getCourseAccess(courseId),
  ]);

  if (!course) {
    throw new AssessmentManagementError("COURSE_NOT_FOUND", "Course not found.");
  }

  if (course.tutorId !== tutorId) {
    throw new AssessmentManagementError(
      "FORBIDDEN",
      "You do not have permission to manage assessments for this course.",
    );
  }

  return course;
}

async function getTutorOwnedAssessment(
  tutorUserId: string,
  assessmentId: string,
  store: AssessmentWriteStore,
): Promise<AssessmentGroupRecord> {
  const [tutorId, assessment] = await Promise.all([
    getRequiredTutorProfileId(tutorUserId, store),
    store.getAssessmentForMutation(assessmentId),
  ]);

  if (!assessment) {
    throw new AssessmentManagementError(
      "ASSESSMENT_NOT_FOUND",
      "Assessment not found.",
    );
  }

  if (assessment.courseTutorId !== tutorId) {
    throw new AssessmentManagementError(
      "FORBIDDEN",
      "You do not have permission to manage this assessment.",
    );
  }

  return assessment;
}

export async function createAssessment(
  tutorUserId: string,
  courseId: string,
  input: AssessmentCreateInput,
  store: AssessmentWriteStore = prismaAssessmentWriteStore,
): Promise<string> {
  const parsed = assessmentCreateSchema.parse(input);

  return store.runInTransaction(async (tx) => {
    await getTutorOwnedCourse(tutorUserId, courseId, tx);

    const enrollments = await tx.getActiveEnrollmentsForCourse(courseId);
    if (enrollments.length === 0) {
      throw new AssessmentManagementError(
        "ACTIVE_ENROLLMENT_REQUIRED",
        "An assessment requires at least one ACTIVE enrolled student.",
      );
    }

    const duplicateCount = await tx.countAssessmentGroup({
      id: "",
      courseId,
      title: parsed.title,
      type: parsed.type,
      takenAt: parsed.takenAt,
      maxScore: parsed.maxScore,
      courseTutorId: "",
    });

    if (duplicateCount > 0) {
      throw new AssessmentManagementError(
        "DUPLICATE_ASSESSMENT",
        "An assessment with the same title, type, date, and max score already exists for this course.",
      );
    }

    return tx.createAssessmentRows(
      enrollments.map((enrollment) => ({
        courseId,
        studentId: enrollment.studentId,
        enrollmentId: enrollment.id,
        title: parsed.title,
        type: parsed.type,
        maxScore: parsed.maxScore,
        takenAt: parsed.takenAt,
        score: null,
        note: null,
      })),
    );
  });
}

export async function updateAssessment(
  tutorUserId: string,
  assessmentId: string,
  input: AssessmentUpdateInput,
  store: AssessmentWriteStore = prismaAssessmentWriteStore,
): Promise<void> {
  const parsed = assessmentUpdateSchema.parse(input);

  return store.runInTransaction(async (tx) => {
    const assessment = await getTutorOwnedAssessment(tutorUserId, assessmentId, tx);
    const scores = await tx.getGroupScoreValues(assessment);

    for (const score of scores) {
      assertScoreWithinMaxScore(score, parsed.maxScore);
    }

    await tx.updateAssessmentGroup(assessment, {
      title: parsed.title,
      type: parsed.type,
      maxScore: parsed.maxScore,
      takenAt: parsed.takenAt,
    });
  });
}

export async function bulkRecordAssessmentScores(
  tutorUserId: string,
  assessmentId: string,
  input: Omit<BulkAssessmentScoreInput, "assessmentId">,
  store: AssessmentWriteStore = prismaAssessmentWriteStore,
): Promise<void> {
  const parsed = bulkAssessmentScoreSchema.parse({ assessmentId, ...input });

  return store.runInTransaction(async (tx) => {
    const assessment = await getTutorOwnedAssessment(tutorUserId, assessmentId, tx);

    for (const record of parsed.scores) {
      assertScoreWithinMaxScore(record.score, assessment.maxScore);
      const enrollment = await tx.getActiveEnrollmentForStudent(
        assessment.courseId,
        record.studentId,
      );

      if (!enrollment) {
        throw new AssessmentManagementError(
          "ACTIVE_ENROLLMENT_REQUIRED",
          "Scores can be recorded only for ACTIVE enrolled students.",
        );
      }

      await tx.recordAssessmentScore(assessment, {
        studentId: record.studentId,
        enrollmentId: enrollment.id,
        score: record.score ?? null,
        note: record.note || null,
      });
    }
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

const assessmentListSelect = {
  id: true,
  courseId: true,
  studentId: true,
  enrollmentId: true,
  title: true,
  type: true,
  score: true,
  maxScore: true,
  takenAt: true,
  note: true,
  createdAt: true,
  updatedAt: true,
  student: {
    select: studentSummarySelect,
  },
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
      enrollments: {
        where: { status: EnrollmentStatus.ACTIVE },
        select: { id: true },
      },
    },
  },
} satisfies Prisma.AssessmentSelect;

type AssessmentListRow = Prisma.AssessmentGetPayload<{
  select: typeof assessmentListSelect;
}>;

type StudentSummaryRow = Prisma.StudentProfileGetPayload<{
  select: typeof studentSummarySelect;
}>;

function mapStudentSummary(row: StudentSummaryRow): AssessmentStudentSummary {
  return {
    id: row.id,
    name: row.user.name,
    email: row.user.email,
    displayName: row.displayName,
    gradeLevel: row.gradeLevel,
  };
}

function mapCourseSummary(row: AssessmentListRow["course"]): AssessmentCourseSummary {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    tutor: {
      id: row.tutor.id,
      name: row.tutor.user.name,
      email: row.tutor.user.email,
    },
  };
}

function mapAssessmentScore(row: AssessmentListRow): AssessmentScoreSummary {
  const maxScore = decimalToNumber(row.maxScore);
  const score = nullableDecimalToNumber(row.score);

  return {
    id: row.id,
    studentId: row.studentId,
    enrollmentId: row.enrollmentId,
    score,
    maxScore,
    percentage: calculatePercentage(score, maxScore),
    note: row.note,
    updatedAt: row.updatedAt,
  };
}

function mapAssessmentScoreListItem(
  row: AssessmentListRow,
): AssessmentScoreListItem {
  return {
    ...mapAssessmentScore(row),
    title: row.title,
    type: row.type,
    takenAt: row.takenAt,
    course: mapCourseSummary(row.course),
    student: mapStudentSummary(row.student),
  };
}

function groupKey(row: AssessmentListRow): string {
  return [
    row.courseId,
    row.title,
    row.type,
    row.takenAt?.toISOString() ?? "",
    decimalToNumber(row.maxScore),
  ].join("|");
}

function mapAssessmentGroups(rows: AssessmentListRow[]): AssessmentListItem[] {
  const groups = new Map<string, AssessmentListRow[]>();

  for (const row of rows) {
    const key = groupKey(row);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return Array.from(groups.values()).map((groupRows) => {
    const representative = groupRows[0];
    const maxScore = decimalToNumber(representative.maxScore);
    const scores = groupRows
      .map((row) => nullableDecimalToNumber(row.score))
      .filter((score): score is number => score !== null);
    const averageScore =
      scores.length === 0
        ? null
        : Math.round(
            (scores.reduce((sum, score) => sum + score, 0) / scores.length) *
              100,
          ) / 100;
    const updatedAt = groupRows.reduce(
      (latest, row) => (row.updatedAt > latest ? row.updatedAt : latest),
      representative.updatedAt,
    );

    return {
      id: representative.id,
      courseId: representative.courseId,
      title: representative.title,
      type: representative.type,
      takenAt: representative.takenAt,
      maxScore,
      createdAt: representative.createdAt,
      updatedAt,
      course: mapCourseSummary(representative.course),
      stats: {
        activeEnrollmentCount: representative.course.enrollments.length,
        scoredCount: scores.length,
        averageScore,
        averagePercentage: calculatePercentage(averageScore, maxScore),
      },
    };
  });
}

function buildAssessmentWhere(
  filters: AssessmentFilters,
  base: Prisma.AssessmentWhereInput = {},
): Prisma.AssessmentWhereInput {
  const and: Prisma.AssessmentWhereInput[] = [base];

  if (filters.search) {
    and.push({
      OR: [
        { title: { contains: filters.search, mode: "insensitive" } },
        { note: { contains: filters.search, mode: "insensitive" } },
        { course: { title: { contains: filters.search, mode: "insensitive" } } },
        { course: { subject: { name: { contains: filters.search, mode: "insensitive" } } } },
        { student: { displayName: { contains: filters.search, mode: "insensitive" } } },
        { student: { user: { name: { contains: filters.search, mode: "insensitive" } } } },
      ],
    });
  }

  if (filters.courseId) {
    and.push({ courseId: filters.courseId });
  }

  if (filters.tutorId) {
    and.push({ course: { tutorId: filters.tutorId } });
  }

  if (filters.studentId) {
    and.push({ studentId: filters.studentId });
  }

  if (filters.type) {
    and.push({ type: filters.type });
  }

  const takenAt: Prisma.DateTimeNullableFilter<"Assessment"> = {};

  if (filters.dateFrom) {
    takenAt.gte = filters.dateFrom;
  }

  if (filters.dateTo) {
    takenAt.lte = filters.dateTo;
  }

  if (Object.keys(takenAt).length > 0) {
    and.push({ takenAt });
  }

  return { AND: and };
}

async function getTutorProfileId(tutorUserId: string): Promise<string | null> {
  const tutor = await getDb().tutorProfile.findUnique({
    where: { userId: tutorUserId },
    select: { id: true },
  });

  return tutor?.id ?? null;
}

export async function getTutorAssessments(
  tutorUserId: string,
  filters: AssessmentFilters = {},
): Promise<AssessmentListItem[]> {
  const tutorId = await getTutorProfileId(tutorUserId);

  if (!tutorId) {
    return [];
  }

  const rows = await getDb().assessment.findMany({
    where: buildAssessmentWhere(filters, {
      course: { tutorId },
      enrollment: { status: EnrollmentStatus.ACTIVE },
    }),
    orderBy: [{ takenAt: "desc" }, { createdAt: "desc" }],
    select: assessmentListSelect,
  });

  return mapAssessmentGroups(rows);
}

export async function getTutorCourseAssessments(
  tutorUserId: string,
  courseId: string,
  filters: AssessmentFilters = {},
): Promise<AssessmentListItem[]> {
  const tutorId = await getTutorProfileId(tutorUserId);

  if (!tutorId) {
    return [];
  }

  const rows = await getDb().assessment.findMany({
    where: buildAssessmentWhere(filters, {
      courseId,
      course: { tutorId },
      enrollment: { status: EnrollmentStatus.ACTIVE },
    }),
    orderBy: [{ takenAt: "desc" }, { createdAt: "desc" }],
    select: assessmentListSelect,
  });

  return mapAssessmentGroups(rows);
}

export async function getTutorAssessmentById(
  tutorUserId: string,
  assessmentId: string,
): Promise<TutorAssessmentDetail | null> {
  const tutorId = await getTutorProfileId(tutorUserId);

  if (!tutorId) {
    return null;
  }

  const representative = await getDb().assessment.findFirst({
    where: { id: assessmentId, course: { tutorId } },
    select: assessmentListSelect,
  });

  if (!representative) {
    return null;
  }

  const [groupRows, enrollments] = await Promise.all([
    getDb().assessment.findMany({
      where: {
        ...groupWhere({
          id: representative.id,
          courseId: representative.courseId,
          title: representative.title,
          type: representative.type,
          takenAt: representative.takenAt,
          maxScore: decimalToNumber(representative.maxScore),
          courseTutorId: tutorId,
        }),
        enrollment: { status: EnrollmentStatus.ACTIVE },
      },
      select: assessmentListSelect,
    }),
    getDb().enrollment.findMany({
      where: {
        courseId: representative.courseId,
        status: EnrollmentStatus.ACTIVE,
      },
      orderBy: { enrolledAt: "asc" },
      select: {
        id: true,
        student: {
          select: studentSummarySelect,
        },
      },
    }),
  ]);

  const scoresByStudent = new Map(
    groupRows.map((row) => [row.studentId, mapAssessmentScore(row)]),
  );
  const group = mapAssessmentGroups(groupRows)[0];

  if (!group) {
    return null;
  }

  return {
    ...group,
    roster: enrollments.map((enrollment) => ({
      enrollmentId: enrollment.id,
      student: mapStudentSummary(enrollment.student),
      assessment: scoresByStudent.get(enrollment.student.id) ?? null,
    })),
  };
}

export async function getAssessmentForEdit(
  tutorUserId: string,
  assessmentId: string,
): Promise<AssessmentListItem | null> {
  const detail = await getTutorAssessmentById(tutorUserId, assessmentId);

  if (!detail) {
    return null;
  }

  return {
    id: detail.id,
    courseId: detail.courseId,
    title: detail.title,
    type: detail.type,
    takenAt: detail.takenAt,
    maxScore: detail.maxScore,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    course: detail.course,
    stats: detail.stats,
  };
}

export async function getStudentAssessments(
  studentUserId: string,
  filters: AssessmentFilters = {},
): Promise<AssessmentScoreListItem[]> {
  const student = await getDb().studentProfile.findUnique({
    where: { userId: studentUserId },
    select: { id: true },
  });

  if (!student) {
    return [];
  }

  const rows = await getDb().assessment.findMany({
    where: buildAssessmentWhere(filters, {
      studentId: student.id,
      enrollment: { status: EnrollmentStatus.ACTIVE },
    }),
    orderBy: [{ takenAt: "desc" }, { createdAt: "desc" }],
    select: assessmentListSelect,
  });

  return rows.map(mapAssessmentScoreListItem);
}

export async function getParentChildAssessments(
  parentUserId: string,
  studentId: string,
  filters: AssessmentFilters = {},
): Promise<AssessmentScoreListItem[]> {
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

  const rows = await getDb().assessment.findMany({
    where: buildAssessmentWhere(filters, {
      studentId,
      enrollment: { status: EnrollmentStatus.ACTIVE },
    }),
    orderBy: [{ takenAt: "desc" }, { createdAt: "desc" }],
    select: assessmentListSelect,
  });

  return rows.map(mapAssessmentScoreListItem);
}

export async function getAdminAssessments(
  filters: AssessmentFilters = {},
): Promise<AssessmentScoreListItem[]> {
  const rows = await getDb().assessment.findMany({
    where: buildAssessmentWhere(filters),
    orderBy: [{ takenAt: "desc" }, { createdAt: "desc" }],
    take: 200,
    select: assessmentListSelect,
  });

  return rows.map(mapAssessmentScoreListItem);
}

export async function getAssessmentAverageForStudent(
  studentId: string,
  courseId?: string,
): Promise<number | null> {
  const rows = await getDb().assessment.findMany({
    where: {
      studentId,
      ...(courseId ? { courseId } : {}),
      enrollment: { status: EnrollmentStatus.ACTIVE },
      score: { not: null },
    },
    select: { score: true, maxScore: true },
  });

  const percentages = rows
    .map((row) =>
      calculatePercentage(
        nullableDecimalToNumber(row.score),
        decimalToNumber(row.maxScore),
      ),
    )
    .filter((score): score is number => score !== null);

  if (percentages.length === 0) {
    return null;
  }

  return Math.round(
    percentages.reduce((sum, score) => sum + score, 0) / percentages.length,
  );
}

export async function getTutorAssessmentCourseOptions(
  tutorUserId: string,
): Promise<AssessmentCourseOption[]> {
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

export async function getStudentAssessmentCourseOptions(
  studentUserId: string,
): Promise<AssessmentCourseOption[]> {
  const student = await getDb().studentProfile.findUnique({
    where: { userId: studentUserId },
    select: { id: true },
  });

  if (!student) {
    return [];
  }

  const courses = await getDb().course.findMany({
    where: {
      enrollments: {
        some: { studentId: student.id, status: EnrollmentStatus.ACTIVE },
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

export async function getParentChildAssessmentCourseOptions(
  parentUserId: string,
  studentId: string,
): Promise<AssessmentCourseOption[]> {
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

export async function getAdminAssessmentFilterOptions(): Promise<{
  courses: Array<{ id: string; title: string }>;
  tutors: Array<{ id: string; name: string; email: string }>;
  students: Array<{ id: string; name: string; email: string }>;
}> {
  const [courses, tutors, students] = await Promise.all([
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
    students: students.map((student) => ({
      id: student.id,
      name: student.user.name,
      email: student.user.email,
    })),
  };
}
