import {
  EnrollmentStatus,
  Prisma,
  type PrismaClient,
} from "@/lib/generated/prisma/client";
import { getDb } from "@/lib/db";
import {
  submissionCreateSchema,
  submissionFilterSchema,
  submissionGradeSchema,
  submissionUpdateSchema,
  type SubmissionFilterInput,
  type SubmissionGradeInput,
} from "@/lib/validators/submission";
import {
  deriveAssignmentSubmissionStatus,
  isSubmissionLate,
  type AssignmentCourseSummary,
  type AssignmentSubmissionStatus,
  type AssignmentStudentSummary,
} from "@/services/assignment.service";
import { normalizeSearchText } from "@/services/marketplace-utils";

type SearchParamsInput = Record<string, string | string[] | undefined>;

type DecimalLike = { toString(): string } | number | string | null | undefined;

export type SubmissionContentInput = {
  textAnswer?: string;
  fileUrl?: string;
};

export type SubmissionFilters = {
  search?: string;
  courseId?: string;
  tutorId?: string;
  studentId?: string;
  assignmentId?: string;
  gradingStatus?: "graded" | "ungraded" | "late" | "on-time";
};

export type ManagedSubmission = {
  id: string;
  assignmentId: string;
  studentId: string;
  enrollmentId: string;
  content: string | null;
  fileUrl: string | null;
  submittedAt: Date;
  score: number | null;
  feedback: string | null;
  gradedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SubmissionAssignmentSummary = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  maxScore: number | null;
  course: AssignmentCourseSummary;
};

export type SubmissionListItem = ManagedSubmission & {
  status: AssignmentSubmissionStatus;
  isLate: boolean;
  assignment: SubmissionAssignmentSummary;
  student: AssignmentStudentSummary;
};

export type HomeworkSummary = {
  totalAssignments: number;
  submittedCount: number;
  gradedCount: number;
  pendingCount: number;
  lateCount: number;
  completionRate: number;
};

type StudentProfileRecord = {
  id: string;
};

type AssignmentForSubmission = {
  id: string;
  courseId: string;
  maxScore: number | null;
};

type ActiveEnrollmentForSubmission = {
  id: string;
  studentId: string;
  courseId: string;
  status: EnrollmentStatus;
};

type SubmissionMutationRecord = ManagedSubmission & {
  assignmentCourseId: string;
  assignmentCourseTutorId: string;
  assignmentMaxScore: number | null;
  isEnrollmentConsistent: boolean;
};

type SubmissionUpsertData = {
  assignmentId: string;
  studentId: string;
  enrollmentId: string;
  content: string | null;
  fileUrl: string | null;
  submittedAt: Date;
};

type SubmissionUpdateData = {
  content: string | null;
  fileUrl: string | null;
  submittedAt: Date;
};

type SubmissionGradeData = {
  score: number;
  feedback: string | null;
  gradedAt: Date;
};

export type SubmissionWriteStore = {
  getStudentProfileByUserId(
    studentUserId: string,
  ): Promise<StudentProfileRecord | null>;
  getTutorProfileByUserId(tutorUserId: string): Promise<{ id: string } | null>;
  getAssignmentForSubmission(
    assignmentId: string,
  ): Promise<AssignmentForSubmission | null>;
  getActiveEnrollmentForStudent(
    courseId: string,
    studentId: string,
  ): Promise<ActiveEnrollmentForSubmission | null>;
  getSubmissionForStudentAssignment(
    studentId: string,
    assignmentId: string,
  ): Promise<SubmissionMutationRecord | null>;
  getSubmissionForMutation(
    submissionId: string,
  ): Promise<SubmissionMutationRecord | null>;
  upsertSubmission(data: SubmissionUpsertData): Promise<ManagedSubmission>;
  updateSubmission(
    submissionId: string,
    data: SubmissionUpdateData,
  ): Promise<ManagedSubmission>;
  gradeSubmission(
    submissionId: string,
    data: SubmissionGradeData,
  ): Promise<ManagedSubmission>;
  runInTransaction<T>(
    callback: (store: SubmissionWriteStore) => Promise<T>,
  ): Promise<T>;
};

export type SubmissionManagementErrorCode =
  | "STUDENT_PROFILE_REQUIRED"
  | "TUTOR_PROFILE_REQUIRED"
  | "ASSIGNMENT_NOT_FOUND"
  | "ACTIVE_ENROLLMENT_REQUIRED"
  | "SUBMISSION_NOT_FOUND"
  | "SUBMISSION_ALREADY_GRADED"
  | "FORBIDDEN"
  | "INVALID_ENROLLMENT_LINK"
  | "SCORE_EXCEEDS_MAX_SCORE";

export class SubmissionManagementError extends Error {
  constructor(
    readonly code: SubmissionManagementErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SubmissionManagementError";
  }
}

type PrismaSubmissionClient = Pick<
  PrismaClient,
  "assignment" | "enrollment" | "studentProfile" | "submission" | "tutorProfile"
>;

function firstValue(value: string | string[] | undefined): string | undefined {
  const selected = Array.isArray(value) ? value[0] : value;

  return selected === "" ? undefined : selected;
}

function decimalToNumber(value: DecimalLike): number | null {
  return value === null || value === undefined ? null : Number(value);
}

function mapManagedSubmission(row: {
  id: string;
  assignmentId: string;
  studentId: string;
  enrollmentId: string;
  content: string | null;
  fileUrl: string | null;
  submittedAt: Date;
  score: DecimalLike;
  feedback: string | null;
  gradedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ManagedSubmission {
  return {
    id: row.id,
    assignmentId: row.assignmentId,
    studentId: row.studentId,
    enrollmentId: row.enrollmentId,
    content: row.content,
    fileUrl: row.fileUrl,
    submittedAt: row.submittedAt,
    score: decimalToNumber(row.score),
    feedback: row.feedback,
    gradedAt: row.gradedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapSubmissionMutationRecord(row: {
  id: string;
  assignmentId: string;
  studentId: string;
  enrollmentId: string;
  content: string | null;
  fileUrl: string | null;
  submittedAt: Date;
  score: DecimalLike;
  feedback: string | null;
  gradedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  enrollment: {
    studentId: string;
    courseId: string;
  };
  assignment: {
    courseId: string;
    maxScore: DecimalLike;
    course: {
      tutorId: string;
    };
  };
}): SubmissionMutationRecord {
  return {
    ...mapManagedSubmission(row),
    assignmentCourseId: row.assignment.courseId,
    assignmentCourseTutorId: row.assignment.course.tutorId,
    assignmentMaxScore: decimalToNumber(row.assignment.maxScore),
    isEnrollmentConsistent:
      row.enrollment.studentId === row.studentId &&
      row.enrollment.courseId === row.assignment.courseId,
  };
}

export function parseSubmissionFilters(
  params: SearchParamsInput,
): SubmissionFilters {
  const parsed: SubmissionFilterInput = submissionFilterSchema.parse({
    search: firstValue(params.search),
    courseId: firstValue(params.courseId) ?? firstValue(params.course),
    tutorId: firstValue(params.tutorId) ?? firstValue(params.tutor),
    studentId: firstValue(params.studentId) ?? firstValue(params.student),
    assignmentId:
      firstValue(params.assignmentId) ?? firstValue(params.assignment),
    gradingStatus:
      firstValue(params.gradingStatus) ??
      firstValue(params.status) ??
      firstValue(params.submissionStatus),
  });

  const gradingStatus =
    parsed.gradingStatus && parsed.gradingStatus !== "all"
      ? parsed.gradingStatus
      : undefined;

  return {
    search: normalizeSearchText(parsed.search),
    courseId: normalizeSearchText(parsed.courseId),
    tutorId: normalizeSearchText(parsed.tutorId),
    studentId: normalizeSearchText(parsed.studentId),
    assignmentId: normalizeSearchText(parsed.assignmentId),
    gradingStatus,
  };
}

function normalizeSubmissionContent(input: SubmissionContentInput): {
  content: string | null;
  fileUrl: string | null;
} {
  return {
    content: input.textAnswer?.trim() || null,
    fileUrl: input.fileUrl?.trim() || null,
  };
}

function assertScoreWithinMaxScore(
  score: number,
  maxScore: number | null,
): void {
  if (maxScore !== null && score > maxScore) {
    throw new SubmissionManagementError(
      "SCORE_EXCEEDS_MAX_SCORE",
      "Score cannot exceed assignment max score.",
    );
  }
}

function createPrismaSubmissionStore(
  client: PrismaSubmissionClient,
): SubmissionWriteStore {
  const store: SubmissionWriteStore = {
    async getStudentProfileByUserId(studentUserId) {
      return client.studentProfile.findUnique({
        where: { userId: studentUserId },
        select: { id: true },
      });
    },

    async getTutorProfileByUserId(tutorUserId) {
      return client.tutorProfile.findUnique({
        where: { userId: tutorUserId },
        select: { id: true },
      });
    },

    async getAssignmentForSubmission(assignmentId) {
      const row = await client.assignment.findUnique({
        where: { id: assignmentId },
        select: {
          id: true,
          courseId: true,
          maxScore: true,
        },
      });

      if (!row) {
        return null;
      }

      return {
        id: row.id,
        courseId: row.courseId,
        maxScore: decimalToNumber(row.maxScore),
      };
    },

    async getActiveEnrollmentForStudent(courseId, studentId) {
      return client.enrollment.findFirst({
        where: { courseId, studentId, status: EnrollmentStatus.ACTIVE },
        orderBy: { enrolledAt: "desc" },
        select: {
          id: true,
          studentId: true,
          courseId: true,
          status: true,
        },
      });
    },

    async getSubmissionForStudentAssignment(studentId, assignmentId) {
      const row = await client.submission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId,
          },
        },
        include: {
          enrollment: { select: { studentId: true, courseId: true } },
          assignment: {
            select: {
              courseId: true,
              maxScore: true,
              course: { select: { tutorId: true } },
            },
          },
        },
      });

      return row ? mapSubmissionMutationRecord(row) : null;
    },

    async getSubmissionForMutation(submissionId) {
      const row = await client.submission.findUnique({
        where: { id: submissionId },
        include: {
          enrollment: { select: { studentId: true, courseId: true } },
          assignment: {
            select: {
              courseId: true,
              maxScore: true,
              course: { select: { tutorId: true } },
            },
          },
        },
      });

      return row ? mapSubmissionMutationRecord(row) : null;
    },

    async upsertSubmission(data) {
      const row = await client.submission.upsert({
        where: {
          assignmentId_studentId: {
            assignmentId: data.assignmentId,
            studentId: data.studentId,
          },
        },
        update: {
          enrollmentId: data.enrollmentId,
          content: data.content,
          fileUrl: data.fileUrl,
          submittedAt: data.submittedAt,
        },
        create: data,
      });

      return mapManagedSubmission(row);
    },

    async updateSubmission(submissionId, data) {
      const row = await client.submission.update({
        where: { id: submissionId },
        data,
      });

      return mapManagedSubmission(row);
    },

    async gradeSubmission(submissionId, data) {
      const row = await client.submission.update({
        where: { id: submissionId },
        data,
      });

      return mapManagedSubmission(row);
    },

    async runInTransaction(callback) {
      return callback(store);
    },
  };

  return store;
}

const prismaSubmissionWriteStore: SubmissionWriteStore = {
  async getStudentProfileByUserId(studentUserId) {
    return createPrismaSubmissionStore(getDb()).getStudentProfileByUserId(
      studentUserId,
    );
  },
  async getTutorProfileByUserId(tutorUserId) {
    return createPrismaSubmissionStore(getDb()).getTutorProfileByUserId(
      tutorUserId,
    );
  },
  async getAssignmentForSubmission(assignmentId) {
    return createPrismaSubmissionStore(getDb()).getAssignmentForSubmission(
      assignmentId,
    );
  },
  async getActiveEnrollmentForStudent(courseId, studentId) {
    return createPrismaSubmissionStore(getDb()).getActiveEnrollmentForStudent(
      courseId,
      studentId,
    );
  },
  async getSubmissionForStudentAssignment(studentId, assignmentId) {
    return createPrismaSubmissionStore(getDb()).getSubmissionForStudentAssignment(
      studentId,
      assignmentId,
    );
  },
  async getSubmissionForMutation(submissionId) {
    return createPrismaSubmissionStore(getDb()).getSubmissionForMutation(
      submissionId,
    );
  },
  async upsertSubmission(data) {
    return createPrismaSubmissionStore(getDb()).upsertSubmission(data);
  },
  async updateSubmission(submissionId, data) {
    return createPrismaSubmissionStore(getDb()).updateSubmission(
      submissionId,
      data,
    );
  },
  async gradeSubmission(submissionId, data) {
    return createPrismaSubmissionStore(getDb()).gradeSubmission(
      submissionId,
      data,
    );
  },
  async runInTransaction(callback) {
    return getDb().$transaction(
      async (tx) =>
        callback(createPrismaSubmissionStore(tx as PrismaSubmissionClient)),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  },
};

export async function submitAssignment(
  studentUserId: string,
  assignmentId: string,
  input: SubmissionContentInput,
  store: SubmissionWriteStore = prismaSubmissionWriteStore,
): Promise<ManagedSubmission> {
  const parsed = submissionCreateSchema.parse({ assignmentId, ...input });

  return store.runInTransaction(async (tx) => {
    const [student, assignment] = await Promise.all([
      tx.getStudentProfileByUserId(studentUserId),
      tx.getAssignmentForSubmission(parsed.assignmentId),
    ]);

    if (!student) {
      throw new SubmissionManagementError(
        "STUDENT_PROFILE_REQUIRED",
        "A student profile is required to submit assignments.",
      );
    }

    if (!assignment) {
      throw new SubmissionManagementError(
        "ASSIGNMENT_NOT_FOUND",
        "Assignment not found.",
      );
    }

    const [enrollment, existingSubmission] = await Promise.all([
      tx.getActiveEnrollmentForStudent(assignment.courseId, student.id),
      tx.getSubmissionForStudentAssignment(student.id, assignment.id),
    ]);

    if (!enrollment) {
      throw new SubmissionManagementError(
        "ACTIVE_ENROLLMENT_REQUIRED",
        "Students can submit only for ACTIVE enrolled courses.",
      );
    }

    if (existingSubmission?.gradedAt) {
      throw new SubmissionManagementError(
        "SUBMISSION_ALREADY_GRADED",
        "Graded submissions cannot be modified by students.",
      );
    }

    const normalized = normalizeSubmissionContent(parsed);

    return tx.upsertSubmission({
      assignmentId: assignment.id,
      studentId: student.id,
      enrollmentId: enrollment.id,
      content: normalized.content,
      fileUrl: normalized.fileUrl,
      submittedAt: new Date(),
    });
  });
}

export async function updateSubmission(
  studentUserId: string,
  submissionId: string,
  input: SubmissionContentInput,
  store: SubmissionWriteStore = prismaSubmissionWriteStore,
): Promise<ManagedSubmission> {
  const parsed = submissionUpdateSchema.parse({ submissionId, ...input });

  return store.runInTransaction(async (tx) => {
    const [student, submission] = await Promise.all([
      tx.getStudentProfileByUserId(studentUserId),
      tx.getSubmissionForMutation(parsed.submissionId),
    ]);

    if (!student) {
      throw new SubmissionManagementError(
        "STUDENT_PROFILE_REQUIRED",
        "A student profile is required to update submissions.",
      );
    }

    if (!submission) {
      throw new SubmissionManagementError(
        "SUBMISSION_NOT_FOUND",
        "Submission not found.",
      );
    }

    if (submission.studentId !== student.id) {
      throw new SubmissionManagementError(
        "FORBIDDEN",
        "Students can edit only their own submissions.",
      );
    }

    if (submission.gradedAt) {
      throw new SubmissionManagementError(
        "SUBMISSION_ALREADY_GRADED",
        "Graded submissions cannot be modified by students.",
      );
    }

    const enrollment = await tx.getActiveEnrollmentForStudent(
      submission.assignmentCourseId,
      student.id,
    );

    if (!enrollment || !submission.isEnrollmentConsistent) {
      throw new SubmissionManagementError(
        "ACTIVE_ENROLLMENT_REQUIRED",
        "Students can update only submissions for ACTIVE enrolled courses.",
      );
    }

    const normalized = normalizeSubmissionContent(parsed);

    return tx.updateSubmission(parsed.submissionId, {
      ...normalized,
      submittedAt: new Date(),
    });
  });
}

export async function gradeSubmission(
  tutorUserId: string,
  submissionId: string,
  input: Omit<SubmissionGradeInput, "submissionId">,
  store: SubmissionWriteStore = prismaSubmissionWriteStore,
): Promise<ManagedSubmission> {
  const parsed = submissionGradeSchema.parse({ submissionId, ...input });
  const [tutor, submission] = await Promise.all([
    store.getTutorProfileByUserId(tutorUserId),
    store.getSubmissionForMutation(parsed.submissionId),
  ]);

  if (!tutor) {
    throw new SubmissionManagementError(
      "TUTOR_PROFILE_REQUIRED",
      "A tutor profile is required to grade submissions.",
    );
  }

  if (!submission) {
    throw new SubmissionManagementError(
      "SUBMISSION_NOT_FOUND",
      "Submission not found.",
    );
  }

  if (submission.assignmentCourseTutorId !== tutor.id) {
    throw new SubmissionManagementError(
      "FORBIDDEN",
      "Tutors can grade only submissions from their own courses.",
    );
  }

  if (!submission.isEnrollmentConsistent) {
    throw new SubmissionManagementError(
      "INVALID_ENROLLMENT_LINK",
      "Submission enrollment does not match the assignment course.",
    );
  }

  assertScoreWithinMaxScore(parsed.score, submission.assignmentMaxScore);

  return store.gradeSubmission(parsed.submissionId, {
    score: parsed.score,
    feedback: parsed.feedback || null,
    gradedAt: new Date(),
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

const submissionListSelect = {
  id: true,
  assignmentId: true,
  studentId: true,
  enrollmentId: true,
  content: true,
  fileUrl: true,
  submittedAt: true,
  score: true,
  feedback: true,
  gradedAt: true,
  createdAt: true,
  updatedAt: true,
  student: {
    select: studentSummarySelect,
  },
  assignment: {
    select: {
      id: true,
      title: true,
      instructions: true,
      dueAt: true,
      maxScore: true,
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
    },
  },
} satisfies Prisma.SubmissionSelect;

type SubmissionListRow = Prisma.SubmissionGetPayload<{
  select: typeof submissionListSelect;
}>;

function mapStudentSummary(row: SubmissionListRow["student"]): AssignmentStudentSummary {
  return {
    id: row.id,
    name: row.user.name,
    email: row.user.email,
    displayName: row.displayName,
    gradeLevel: row.gradeLevel,
  };
}

function mapSubmissionListItem(row: SubmissionListRow): SubmissionListItem {
  const status = deriveAssignmentSubmissionStatus(row, row.assignment.dueAt);
  const late = isSubmissionLate(row, row.assignment.dueAt);

  return {
    ...mapManagedSubmission(row),
    status,
    isLate: late,
    assignment: {
      id: row.assignment.id,
      title: row.assignment.title,
      description: row.assignment.instructions,
      dueDate: row.assignment.dueAt,
      maxScore: decimalToNumber(row.assignment.maxScore),
      course: {
        id: row.assignment.course.id,
        title: row.assignment.course.title,
        subject: row.assignment.course.subject,
        tutor: {
          id: row.assignment.course.tutor.id,
          name: row.assignment.course.tutor.user.name,
          email: row.assignment.course.tutor.user.email,
        },
      },
    },
    student: mapStudentSummary(row.student),
  };
}

function buildSubmissionWhere(
  filters: SubmissionFilters,
  base: Prisma.SubmissionWhereInput = {},
): Prisma.SubmissionWhereInput {
  const and: Prisma.SubmissionWhereInput[] = [base];

  if (filters.search) {
    and.push({
      OR: [
        { assignment: { title: { contains: filters.search, mode: "insensitive" } } },
        { assignment: { course: { title: { contains: filters.search, mode: "insensitive" } } } },
        { assignment: { course: { subject: { name: { contains: filters.search, mode: "insensitive" } } } } },
        { student: { displayName: { contains: filters.search, mode: "insensitive" } } },
        { student: { user: { name: { contains: filters.search, mode: "insensitive" } } } },
        { student: { user: { email: { contains: filters.search, mode: "insensitive" } } } },
      ],
    });
  }

  if (filters.courseId) {
    and.push({ assignment: { courseId: filters.courseId } });
  }

  if (filters.tutorId) {
    and.push({ assignment: { course: { tutorId: filters.tutorId } } });
  }

  if (filters.studentId) {
    and.push({ studentId: filters.studentId });
  }

  if (filters.assignmentId) {
    and.push({ assignmentId: filters.assignmentId });
  }

  if (filters.gradingStatus === "graded") {
    and.push({ gradedAt: { not: null } });
  }

  if (filters.gradingStatus === "ungraded") {
    and.push({ gradedAt: null });
  }

  if (filters.gradingStatus === "late") {
    and.push({ assignment: { dueAt: { not: null } } });
  }

  return { AND: and };
}

function matchesSubmissionDerivedFilter(
  item: SubmissionListItem,
  status: SubmissionFilters["gradingStatus"],
): boolean {
  if (status === "late") {
    return item.isLate;
  }

  if (status === "on-time") {
    return !item.isLate;
  }

  return true;
}

async function getTutorProfileId(tutorUserId: string): Promise<string | null> {
  const tutor = await getDb().tutorProfile.findUnique({
    where: { userId: tutorUserId },
    select: { id: true },
  });

  return tutor?.id ?? null;
}

export async function getSubmissionForStudentAssignment(
  studentId: string,
  assignmentId: string,
): Promise<SubmissionListItem | null> {
  const row = await getDb().submission.findFirst({
    where: {
      assignmentId,
      studentId,
      assignment: {
        course: {
          enrollments: {
            some: { studentId, status: EnrollmentStatus.ACTIVE },
          },
        },
      },
    },
    select: submissionListSelect,
  });

  return row ? mapSubmissionListItem(row) : null;
}

export async function getTutorAssignmentSubmissions(
  tutorUserId: string,
  assignmentId: string,
  filters: SubmissionFilters = {},
): Promise<SubmissionListItem[]> {
  const tutorId = await getTutorProfileId(tutorUserId);

  if (!tutorId) {
    return [];
  }

  const rows = await getDb().submission.findMany({
    where: buildSubmissionWhere(filters, {
      assignmentId,
      assignment: { course: { tutorId } },
    }),
    orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
    select: submissionListSelect,
  });

  return rows
    .map(mapSubmissionListItem)
    .filter((item) =>
      matchesSubmissionDerivedFilter(item, filters.gradingStatus),
    );
}

export async function getTutorSubmissionById(
  tutorUserId: string,
  submissionId: string,
): Promise<SubmissionListItem | null> {
  const tutorId = await getTutorProfileId(tutorUserId);

  if (!tutorId) {
    return null;
  }

  const row = await getDb().submission.findFirst({
    where: { id: submissionId, assignment: { course: { tutorId } } },
    select: submissionListSelect,
  });

  return row ? mapSubmissionListItem(row) : null;
}

export async function getParentChildSubmission(
  parentUserId: string,
  studentId: string,
  assignmentId: string,
): Promise<SubmissionListItem | null> {
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
    return null;
  }

  return getSubmissionForStudentAssignment(studentId, assignmentId);
}

export async function getAdminSubmissions(
  filters: SubmissionFilters = {},
): Promise<SubmissionListItem[]> {
  const rows = await getDb().submission.findMany({
    where: buildSubmissionWhere(filters),
    orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
    take: 200,
    select: submissionListSelect,
  });

  return rows
    .map(mapSubmissionListItem)
    .filter((item) =>
      matchesSubmissionDerivedFilter(item, filters.gradingStatus),
    );
}

export async function getAdminSubmissionFilterOptions(): Promise<{
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

export async function getHomeworkSummaryForStudent(
  studentId: string,
  courseId?: string,
): Promise<HomeworkSummary> {
  const rows = await getDb().assignment.findMany({
    where: {
      ...(courseId ? { courseId } : {}),
      course: {
        enrollments: {
          some: { studentId, status: EnrollmentStatus.ACTIVE },
        },
      },
    },
    select: {
      id: true,
      dueAt: true,
      submissions: {
        where: { studentId },
        take: 1,
        select: {
          submittedAt: true,
          gradedAt: true,
        },
      },
    },
  });

  const totalAssignments = rows.length;
  const submissions = rows.flatMap((row) =>
    row.submissions.map((submission) => ({
      ...submission,
      dueAt: row.dueAt,
    })),
  );
  const submittedCount = submissions.length;
  const gradedCount = submissions.filter((submission) =>
    Boolean(submission.gradedAt),
  ).length;
  const lateCount = submissions.filter(
    (submission) =>
      submission.dueAt &&
      submission.submittedAt.getTime() > submission.dueAt.getTime(),
  ).length;

  return {
    totalAssignments,
    submittedCount,
    gradedCount,
    pendingCount: Math.max(totalAssignments - submittedCount, 0),
    lateCount,
    completionRate:
      totalAssignments === 0
        ? 0
        : Math.round((submittedCount / totalAssignments) * 100),
  };
}
