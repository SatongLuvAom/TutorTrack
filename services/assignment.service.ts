import {
  EnrollmentStatus,
  Prisma,
  type PrismaClient,
} from "@/lib/generated/prisma/client";
import { getDb } from "@/lib/db";
import {
  assignmentCreateSchema,
  assignmentFilterSchema,
  assignmentUpdateSchema,
  type AssignmentCreateInput,
  type AssignmentFilterInput,
  type AssignmentGradingStatus,
  type AssignmentUpdateInput,
} from "@/lib/validators/assignment";
import { normalizeSearchText } from "@/services/marketplace-utils";

type SearchParamsInput = Record<string, string | string[] | undefined>;

export type AssignmentSubmissionStatus =
  | "NOT_SUBMITTED"
  | "SUBMITTED"
  | "GRADED"
  | "LATE"
  | "OVERDUE";

export type AssignmentFilters = {
  search?: string;
  courseId?: string;
  tutorId?: string;
  subjectId?: string;
  studentId?: string;
  gradingStatus?: AssignmentGradingStatus;
  dueFrom?: Date;
  dueTo?: Date;
};

export type AssignmentCourseSummary = {
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

export type AssignmentStudentSummary = {
  id: string;
  name: string;
  email: string;
  displayName: string | null;
  gradeLevel: string | null;
};

export type AssignmentSubmissionSummary = {
  id: string;
  studentId: string;
  content: string | null;
  fileUrl: string | null;
  submittedAt: Date;
  score: number | null;
  feedback: string | null;
  gradedAt: Date | null;
  status: AssignmentSubmissionStatus;
};

export type AssignmentStats = {
  activeEnrollmentCount: number;
  submissionCount: number;
  gradedCount: number;
  pendingGradingCount: number;
  notSubmittedCount: number;
  lateCount: number;
  overdueCount: number;
};

export type AssignmentListItem = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  maxScore: number | null;
  createdAt: Date;
  updatedAt: Date;
  course: AssignmentCourseSummary;
  stats: AssignmentStats;
};

export type StudentAssignmentItem = AssignmentListItem & {
  submission: AssignmentSubmissionSummary | null;
  status: AssignmentSubmissionStatus;
};

export type AssignmentRosterItem = {
  enrollmentId: string;
  student: AssignmentStudentSummary;
  submission: AssignmentSubmissionSummary | null;
  status: AssignmentSubmissionStatus;
};

export type TutorAssignmentDetail = AssignmentListItem & {
  roster: AssignmentRosterItem[];
};

export type AssignmentCourseOption = {
  id: string;
  title: string;
  subjectName: string;
};

type CourseAccessRecord = {
  id: string;
  tutorId: string;
};

type AssignmentMutationRecord = {
  id: string;
  courseId: string;
  courseTutorId: string;
  maxScore: number | null;
};

type AssignmentWriteRecord = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  maxScore: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type AssignmentCreateData = {
  courseId: string;
  title: string;
  instructions: string;
  dueAt: Date;
  maxScore: number;
};

type AssignmentUpdateData = {
  title: string;
  instructions: string;
  dueAt: Date;
  maxScore: number;
};

export type AssignmentWriteStore = {
  getTutorProfileByUserId(tutorUserId: string): Promise<{ id: string } | null>;
  getCourseAccess(courseId: string): Promise<CourseAccessRecord | null>;
  getAssignmentForMutation(
    assignmentId: string,
  ): Promise<AssignmentMutationRecord | null>;
  createAssignment(data: AssignmentCreateData): Promise<AssignmentWriteRecord>;
  updateAssignment(
    assignmentId: string,
    data: AssignmentUpdateData,
  ): Promise<AssignmentWriteRecord>;
};

export type AssignmentManagementErrorCode =
  | "TUTOR_PROFILE_REQUIRED"
  | "COURSE_NOT_FOUND"
  | "ASSIGNMENT_NOT_FOUND"
  | "FORBIDDEN"
  | "SESSION_LINK_UNSUPPORTED";

export class AssignmentManagementError extends Error {
  constructor(
    readonly code: AssignmentManagementErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AssignmentManagementError";
  }
}

type DecimalLike = { toString(): string } | number | string | null | undefined;

type PrismaAssignmentClient = Pick<
  PrismaClient,
  "assignment" | "course" | "tutorProfile"
>;

function firstValue(value: string | string[] | undefined): string | undefined {
  const selected = Array.isArray(value) ? value[0] : value;

  return selected === "" ? undefined : selected;
}

function decimalToNumber(value: DecimalLike): number | null {
  return value === null || value === undefined ? null : Number(value);
}

export function deriveAssignmentSubmissionStatus(
  submission:
    | {
        submittedAt: Date;
        gradedAt: Date | null;
      }
    | null
    | undefined,
  dueDate: Date | null,
  now = new Date(),
): AssignmentSubmissionStatus {
  if (!submission) {
    return dueDate && dueDate.getTime() < now.getTime()
      ? "OVERDUE"
      : "NOT_SUBMITTED";
  }

  if (submission.gradedAt) {
    return "GRADED";
  }

  if (dueDate && submission.submittedAt.getTime() > dueDate.getTime()) {
    return "LATE";
  }

  return "SUBMITTED";
}

export function isSubmissionLate(
  submission:
    | {
        submittedAt: Date;
      }
    | null
    | undefined,
  dueDate: Date | null,
): boolean {
  return Boolean(
    submission && dueDate && submission.submittedAt.getTime() > dueDate.getTime(),
  );
}

export function parseAssignmentFilters(
  params: SearchParamsInput,
): AssignmentFilters {
  const parsed: AssignmentFilterInput = assignmentFilterSchema.parse({
    search: firstValue(params.search),
    courseId: firstValue(params.courseId) ?? firstValue(params.course),
    tutorId: firstValue(params.tutorId) ?? firstValue(params.tutor),
    subjectId: firstValue(params.subjectId) ?? firstValue(params.subject),
    studentId: firstValue(params.studentId) ?? firstValue(params.student),
    gradingStatus:
      firstValue(params.gradingStatus) ??
      firstValue(params.status) ??
      firstValue(params.homeworkStatus),
    dueFrom: firstValue(params.dueFrom),
    dueTo: firstValue(params.dueTo),
  });

  return {
    search: normalizeSearchText(parsed.search),
    courseId: normalizeSearchText(parsed.courseId),
    tutorId: normalizeSearchText(parsed.tutorId),
    subjectId: normalizeSearchText(parsed.subjectId),
    studentId: normalizeSearchText(parsed.studentId),
    gradingStatus:
      parsed.gradingStatus && parsed.gradingStatus !== "all"
        ? parsed.gradingStatus
        : undefined,
    dueFrom: parsed.dueFrom,
    dueTo: parsed.dueTo,
  };
}

export function buildAssignmentCreateData(
  courseId: string,
  input: AssignmentCreateInput,
): AssignmentCreateData {
  const parsed = assignmentCreateSchema.parse(input);

  if (parsed.sessionId) {
    throw new AssignmentManagementError(
      "SESSION_LINK_UNSUPPORTED",
      "This schema does not support linking assignments to lesson sessions yet.",
    );
  }

  return {
    courseId,
    title: parsed.title,
    instructions: parsed.description,
    dueAt: parsed.dueDate,
    maxScore: parsed.maxScore,
  };
}

export function buildAssignmentUpdateData(
  input: AssignmentUpdateInput,
): AssignmentUpdateData {
  const parsed = assignmentUpdateSchema.parse(input);

  if (parsed.sessionId) {
    throw new AssignmentManagementError(
      "SESSION_LINK_UNSUPPORTED",
      "This schema does not support linking assignments to lesson sessions yet.",
    );
  }

  return {
    title: parsed.title,
    instructions: parsed.description,
    dueAt: parsed.dueDate,
    maxScore: parsed.maxScore,
  };
}

function mapAssignmentWriteRecord(
  row: {
    id: string;
    courseId: string;
    title: string;
    instructions: string | null;
    dueAt: Date | null;
    maxScore: DecimalLike;
    createdAt: Date;
    updatedAt: Date;
  },
): AssignmentWriteRecord {
  return {
    id: row.id,
    courseId: row.courseId,
    title: row.title,
    description: row.instructions,
    dueDate: row.dueAt,
    maxScore: decimalToNumber(row.maxScore),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function createPrismaAssignmentStore(
  client: PrismaAssignmentClient,
): AssignmentWriteStore {
  return {
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

    async getAssignmentForMutation(assignmentId) {
      const row = await client.assignment.findUnique({
        where: { id: assignmentId },
        select: {
          id: true,
          courseId: true,
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
        courseTutorId: row.course.tutorId,
        maxScore: decimalToNumber(row.maxScore),
      };
    },

    async createAssignment(data) {
      const row = await client.assignment.create({
        data,
      });

      return mapAssignmentWriteRecord(row);
    },

    async updateAssignment(assignmentId, data) {
      const row = await client.assignment.update({
        where: { id: assignmentId },
        data,
      });

      return mapAssignmentWriteRecord(row);
    },
  };
}

const prismaAssignmentWriteStore: AssignmentWriteStore = {
  async getTutorProfileByUserId(tutorUserId) {
    return createPrismaAssignmentStore(getDb()).getTutorProfileByUserId(
      tutorUserId,
    );
  },
  async getCourseAccess(courseId) {
    return createPrismaAssignmentStore(getDb()).getCourseAccess(courseId);
  },
  async getAssignmentForMutation(assignmentId) {
    return createPrismaAssignmentStore(getDb()).getAssignmentForMutation(
      assignmentId,
    );
  },
  async createAssignment(data) {
    return createPrismaAssignmentStore(getDb()).createAssignment(data);
  },
  async updateAssignment(assignmentId, data) {
    return createPrismaAssignmentStore(getDb()).updateAssignment(
      assignmentId,
      data,
    );
  },
};

async function getRequiredTutorProfileId(
  tutorUserId: string,
  store: AssignmentWriteStore,
): Promise<string> {
  const tutor = await store.getTutorProfileByUserId(tutorUserId);

  if (!tutor) {
    throw new AssignmentManagementError(
      "TUTOR_PROFILE_REQUIRED",
      "A tutor profile is required to manage assignments.",
    );
  }

  return tutor.id;
}

async function assertTutorOwnsCourse(
  tutorUserId: string,
  courseId: string,
  store: AssignmentWriteStore,
): Promise<void> {
  const [tutorId, course] = await Promise.all([
    getRequiredTutorProfileId(tutorUserId, store),
    store.getCourseAccess(courseId),
  ]);

  if (!course) {
    throw new AssignmentManagementError("COURSE_NOT_FOUND", "Course not found.");
  }

  if (course.tutorId !== tutorId) {
    throw new AssignmentManagementError(
      "FORBIDDEN",
      "You do not have permission to manage assignments for this course.",
    );
  }
}

async function getTutorOwnedAssignment(
  tutorUserId: string,
  assignmentId: string,
  store: AssignmentWriteStore,
): Promise<AssignmentMutationRecord> {
  const [tutorId, assignment] = await Promise.all([
    getRequiredTutorProfileId(tutorUserId, store),
    store.getAssignmentForMutation(assignmentId),
  ]);

  if (!assignment) {
    throw new AssignmentManagementError(
      "ASSIGNMENT_NOT_FOUND",
      "Assignment not found.",
    );
  }

  if (assignment.courseTutorId !== tutorId) {
    throw new AssignmentManagementError(
      "FORBIDDEN",
      "You do not have permission to manage this assignment.",
    );
  }

  return assignment;
}

export async function createAssignment(
  tutorUserId: string,
  courseId: string,
  input: AssignmentCreateInput,
  store: AssignmentWriteStore = prismaAssignmentWriteStore,
): Promise<AssignmentWriteRecord> {
  await assertTutorOwnsCourse(tutorUserId, courseId, store);

  return store.createAssignment(buildAssignmentCreateData(courseId, input));
}

export async function updateAssignment(
  tutorUserId: string,
  assignmentId: string,
  input: AssignmentUpdateInput,
  store: AssignmentWriteStore = prismaAssignmentWriteStore,
): Promise<AssignmentWriteRecord> {
  await getTutorOwnedAssignment(tutorUserId, assignmentId, store);

  return store.updateAssignment(
    assignmentId,
    buildAssignmentUpdateData(input),
  );
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

const submissionSummarySelect = {
  id: true,
  studentId: true,
  content: true,
  fileUrl: true,
  submittedAt: true,
  score: true,
  feedback: true,
  gradedAt: true,
} satisfies Prisma.SubmissionSelect;

const assignmentListSelect = {
  id: true,
  title: true,
  instructions: true,
  dueAt: true,
  maxScore: true,
  createdAt: true,
  updatedAt: true,
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
  submissions: {
    select: submissionSummarySelect,
  },
} satisfies Prisma.AssignmentSelect;

function assignmentListSelectForStudent(studentId: string) {
  return {
    ...assignmentListSelect,
    submissions: {
      where: { studentId },
      select: submissionSummarySelect,
    },
  } satisfies Prisma.AssignmentSelect;
}

type StudentSummaryRow = Prisma.StudentProfileGetPayload<{
  select: typeof studentSummarySelect;
}>;

type SubmissionSummaryRow = Prisma.SubmissionGetPayload<{
  select: typeof submissionSummarySelect;
}>;

type AssignmentListRow = Prisma.AssignmentGetPayload<{
  select: typeof assignmentListSelect;
}>;

function mapStudentSummary(row: StudentSummaryRow): AssignmentStudentSummary {
  return {
    id: row.id,
    name: row.user.name,
    email: row.user.email,
    displayName: row.displayName,
    gradeLevel: row.gradeLevel,
  };
}

function mapSubmissionSummary(
  row: SubmissionSummaryRow,
  dueDate: Date | null,
): AssignmentSubmissionSummary {
  return {
    id: row.id,
    studentId: row.studentId,
    content: row.content,
    fileUrl: row.fileUrl,
    submittedAt: row.submittedAt,
    score: decimalToNumber(row.score),
    feedback: row.feedback,
    gradedAt: row.gradedAt,
    status: deriveAssignmentSubmissionStatus(row, dueDate),
  };
}

function buildAssignmentStats(row: AssignmentListRow): AssignmentStats {
  const activeEnrollmentCount = row.course.enrollments.length;
  const submissionCount = row.submissions.length;
  const gradedCount = row.submissions.filter((submission) =>
    Boolean(submission.gradedAt),
  ).length;
  const pendingGradingCount = row.submissions.filter(
    (submission) => !submission.gradedAt,
  ).length;
  const lateCount = row.submissions.filter(
    (submission) => isSubmissionLate(submission, row.dueAt),
  ).length;
  const overdueCount =
    row.dueAt && row.dueAt.getTime() < Date.now()
      ? Math.max(activeEnrollmentCount - submissionCount, 0)
      : 0;

  return {
    activeEnrollmentCount,
    submissionCount,
    gradedCount,
    pendingGradingCount,
    notSubmittedCount: Math.max(activeEnrollmentCount - submissionCount, 0),
    lateCount,
    overdueCount,
  };
}

function mapAssignmentListItem(row: AssignmentListRow): AssignmentListItem {
  return {
    id: row.id,
    title: row.title,
    description: row.instructions,
    dueDate: row.dueAt,
    maxScore: decimalToNumber(row.maxScore),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
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
    stats: buildAssignmentStats(row),
  };
}

function buildAssignmentWhere(
  filters: AssignmentFilters,
  base: Prisma.AssignmentWhereInput = {},
): Prisma.AssignmentWhereInput {
  const and: Prisma.AssignmentWhereInput[] = [base];

  if (filters.search) {
    and.push({
      OR: [
        { title: { contains: filters.search, mode: "insensitive" } },
        { instructions: { contains: filters.search, mode: "insensitive" } },
        { course: { title: { contains: filters.search, mode: "insensitive" } } },
        { course: { subject: { name: { contains: filters.search, mode: "insensitive" } } } },
        { course: { tutor: { user: { name: { contains: filters.search, mode: "insensitive" } } } } },
      ],
    });
  }

  if (filters.courseId) {
    and.push({ courseId: filters.courseId });
  }

  if (filters.tutorId) {
    and.push({ course: { tutorId: filters.tutorId } });
  }

  if (filters.subjectId) {
    and.push({ course: { subjectId: filters.subjectId } });
  }

  if (filters.studentId) {
    and.push({
      course: {
        enrollments: {
          some: {
            studentId: filters.studentId,
            status: EnrollmentStatus.ACTIVE,
          },
        },
      },
    });
  }

  const dueAt: Prisma.DateTimeNullableFilter<"Assignment"> = {};

  if (filters.dueFrom) {
    dueAt.gte = filters.dueFrom;
  }

  if (filters.dueTo) {
    dueAt.lte = filters.dueTo;
  }

  if (Object.keys(dueAt).length > 0) {
    and.push({ dueAt });
  }

  return { AND: and };
}

function matchesAssignmentStatus(
  item: AssignmentListItem,
  status: AssignmentGradingStatus | undefined,
): boolean {
  if (!status || status === "all") {
    return true;
  }

  if (status === "not-submitted" || status === "pending") {
    return item.stats.notSubmittedCount > 0;
  }

  if (status === "submitted") {
    return item.stats.submissionCount > 0;
  }

  if (status === "graded") {
    return item.stats.gradedCount > 0;
  }

  if (status === "pending-grading") {
    return item.stats.pendingGradingCount > 0;
  }

  if (status === "late") {
    return item.stats.lateCount > 0;
  }

  if (status === "overdue") {
    return item.stats.overdueCount > 0;
  }

  return true;
}

function matchesStudentAssignmentStatus(
  item: StudentAssignmentItem,
  status: AssignmentGradingStatus | undefined,
): boolean {
  if (!status || status === "all") {
    return true;
  }

  if (status === "pending" || status === "not-submitted") {
    return item.status === "NOT_SUBMITTED" || item.status === "OVERDUE";
  }

  if (status === "submitted") {
    return item.status === "SUBMITTED" || item.status === "LATE";
  }

  if (status === "graded") {
    return item.status === "GRADED";
  }

  if (status === "late") {
    return isSubmissionLate(item.submission, item.dueDate);
  }

  if (status === "overdue") {
    return item.status === "OVERDUE";
  }

  if (status === "pending-grading") {
    return item.status === "SUBMITTED" || item.status === "LATE";
  }

  return true;
}

export async function getTutorAssignments(
  tutorUserId: string,
  filters: AssignmentFilters = {},
): Promise<AssignmentListItem[]> {
  const tutor = await getDb().tutorProfile.findUnique({
    where: { userId: tutorUserId },
    select: { id: true },
  });

  if (!tutor) {
    return [];
  }

  const rows = await getDb().assignment.findMany({
    where: buildAssignmentWhere(filters, { course: { tutorId: tutor.id } }),
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    select: assignmentListSelect,
  });

  return rows
    .map(mapAssignmentListItem)
    .filter((item) => matchesAssignmentStatus(item, filters.gradingStatus));
}

export async function getTutorCourseAssignments(
  tutorUserId: string,
  courseId: string,
  filters: AssignmentFilters = {},
): Promise<AssignmentListItem[]> {
  const tutor = await getDb().tutorProfile.findUnique({
    where: { userId: tutorUserId },
    select: { id: true },
  });

  if (!tutor) {
    return [];
  }

  const rows = await getDb().assignment.findMany({
    where: buildAssignmentWhere(filters, {
      courseId,
      course: { tutorId: tutor.id },
    }),
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    select: assignmentListSelect,
  });

  return rows
    .map(mapAssignmentListItem)
    .filter((item) => matchesAssignmentStatus(item, filters.gradingStatus));
}

export async function getTutorAssignmentById(
  tutorUserId: string,
  assignmentId: string,
): Promise<TutorAssignmentDetail | null> {
  const tutor = await getDb().tutorProfile.findUnique({
    where: { userId: tutorUserId },
    select: { id: true },
  });

  if (!tutor) {
    return null;
  }

  const row = await getDb().assignment.findFirst({
    where: { id: assignmentId, course: { tutorId: tutor.id } },
    select: {
      ...assignmentListSelect,
      course: {
        select: {
          ...assignmentListSelect.course.select,
          enrollments: {
            where: { status: EnrollmentStatus.ACTIVE },
            orderBy: { enrolledAt: "asc" },
            select: {
              id: true,
              student: {
                select: studentSummarySelect,
              },
            },
          },
        },
      },
    },
  });

  if (!row) {
    return null;
  }

  const submissionsByStudent = new Map(
    row.submissions.map((submission) => [submission.studentId, submission]),
  );
  const base = mapAssignmentListItem(row);

  return {
    ...base,
    roster: row.course.enrollments.map((enrollment) => {
      const submission = submissionsByStudent.get(enrollment.student.id);
      const status = deriveAssignmentSubmissionStatus(
        submission ?? null,
        row.dueAt,
      );

      return {
        enrollmentId: enrollment.id,
        student: mapStudentSummary(enrollment.student),
        submission: submission
          ? mapSubmissionSummary(submission, row.dueAt)
          : null,
        status,
      };
    }),
  };
}

export async function getAdminAssignmentById(
  assignmentId: string,
): Promise<TutorAssignmentDetail | null> {
  const row = await getDb().assignment.findUnique({
    where: { id: assignmentId },
    select: {
      ...assignmentListSelect,
      course: {
        select: {
          ...assignmentListSelect.course.select,
          enrollments: {
            where: { status: EnrollmentStatus.ACTIVE },
            orderBy: { enrolledAt: "asc" },
            select: {
              id: true,
              student: {
                select: studentSummarySelect,
              },
            },
          },
        },
      },
    },
  });

  if (!row) {
    return null;
  }

  const submissionsByStudent = new Map(
    row.submissions.map((submission) => [submission.studentId, submission]),
  );
  const base = mapAssignmentListItem(row);

  return {
    ...base,
    roster: row.course.enrollments.map((enrollment) => {
      const submission = submissionsByStudent.get(enrollment.student.id);
      const status = deriveAssignmentSubmissionStatus(
        submission ?? null,
        row.dueAt,
      );

      return {
        enrollmentId: enrollment.id,
        student: mapStudentSummary(enrollment.student),
        submission: submission
          ? mapSubmissionSummary(submission, row.dueAt)
          : null,
        status,
      };
    }),
  };
}

function mapStudentAssignment(
  row: AssignmentListRow,
  studentId: string,
): StudentAssignmentItem {
  const submission = row.submissions.find(
    (candidate) => candidate.studentId === studentId,
  );
  const base = mapAssignmentListItem(row);
  const status = deriveAssignmentSubmissionStatus(submission ?? null, row.dueAt);

  return {
    ...base,
    submission: submission ? mapSubmissionSummary(submission, row.dueAt) : null,
    status,
  };
}

export async function getStudentAssignments(
  studentUserId: string,
  filters: AssignmentFilters = {},
): Promise<StudentAssignmentItem[]> {
  const student = await getDb().studentProfile.findUnique({
    where: { userId: studentUserId },
    select: { id: true },
  });

  if (!student) {
    return [];
  }

  const rows = await getDb().assignment.findMany({
    where: buildAssignmentWhere(filters, {
      course: {
        enrollments: {
          some: { studentId: student.id, status: EnrollmentStatus.ACTIVE },
        },
      },
    }),
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    select: assignmentListSelectForStudent(student.id),
  });

  return rows
    .map((row) => mapStudentAssignment(row, student.id))
    .filter((item) =>
      matchesStudentAssignmentStatus(item, filters.gradingStatus),
    );
}

export async function getStudentAssignmentById(
  studentUserId: string,
  assignmentId: string,
): Promise<StudentAssignmentItem | null> {
  const student = await getDb().studentProfile.findUnique({
    where: { userId: studentUserId },
    select: { id: true },
  });

  if (!student) {
    return null;
  }

  const row = await getDb().assignment.findFirst({
    where: {
      id: assignmentId,
      course: {
        enrollments: {
          some: { studentId: student.id, status: EnrollmentStatus.ACTIVE },
        },
      },
    },
    select: assignmentListSelectForStudent(student.id),
  });

  return row ? mapStudentAssignment(row, student.id) : null;
}

async function hasActiveParentChildLink(
  parentUserId: string,
  studentId: string,
): Promise<boolean> {
  const link = await getDb().parentStudentLink.findFirst({
    where: {
      parent: { userId: parentUserId },
      studentId,
      isActive: true,
      endedAt: null,
    },
    select: { id: true },
  });

  return Boolean(link);
}

export async function getParentChildAssignments(
  parentUserId: string,
  studentId: string,
  filters: AssignmentFilters = {},
): Promise<StudentAssignmentItem[]> {
  if (!(await hasActiveParentChildLink(parentUserId, studentId))) {
    return [];
  }

  const rows = await getDb().assignment.findMany({
    where: buildAssignmentWhere(filters, {
      course: {
        enrollments: {
          some: { studentId, status: EnrollmentStatus.ACTIVE },
        },
      },
    }),
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    select: assignmentListSelectForStudent(studentId),
  });

  return rows
    .map((row) => mapStudentAssignment(row, studentId))
    .filter((item) =>
      matchesStudentAssignmentStatus(item, filters.gradingStatus),
    );
}

export async function getParentChildAssignmentById(
  parentUserId: string,
  studentId: string,
  assignmentId: string,
): Promise<StudentAssignmentItem | null> {
  if (!(await hasActiveParentChildLink(parentUserId, studentId))) {
    return null;
  }

  const row = await getDb().assignment.findFirst({
    where: {
      id: assignmentId,
      course: {
        enrollments: {
          some: { studentId, status: EnrollmentStatus.ACTIVE },
        },
      },
    },
    select: assignmentListSelectForStudent(studentId),
  });

  return row ? mapStudentAssignment(row, studentId) : null;
}

export async function getAdminAssignments(
  filters: AssignmentFilters = {},
): Promise<AssignmentListItem[]> {
  const rows = await getDb().assignment.findMany({
    where: buildAssignmentWhere(filters),
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    select: assignmentListSelect,
  });

  return rows
    .map(mapAssignmentListItem)
    .filter((item) => matchesAssignmentStatus(item, filters.gradingStatus));
}

export async function getTutorAssignmentCourseOptions(
  tutorUserId: string,
): Promise<AssignmentCourseOption[]> {
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

export async function getStudentAssignmentCourseOptions(
  studentUserId: string,
): Promise<AssignmentCourseOption[]> {
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

export async function getParentChildAssignmentCourseOptions(
  parentUserId: string,
  studentId: string,
): Promise<AssignmentCourseOption[]> {
  if (!(await hasActiveParentChildLink(parentUserId, studentId))) {
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

export async function getAdminAssignmentFilterOptions(): Promise<{
  courses: Array<{ id: string; title: string }>;
  tutors: Array<{ id: string; name: string; email: string }>;
  subjects: Array<{ id: string; name: string }>;
}> {
  const [courses, tutors, subjects] = await Promise.all([
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
  ]);

  return {
    courses,
    tutors: tutors.map((tutor) => ({
      id: tutor.id,
      name: tutor.user.name,
      email: tutor.user.email,
    })),
    subjects,
  };
}
