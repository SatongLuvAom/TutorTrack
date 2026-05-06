import {
  AttendanceStatus,
  EnrollmentStatus,
  Prisma,
  SessionStatus,
  type PrismaClient,
} from "@/lib/generated/prisma/client";
import { getDb } from "@/lib/db";
import {
  attendanceFilterSchema,
  bulkAttendanceMarkSchema,
  type AttendanceFilterInput,
  type AttendanceMarkInput,
  type BulkAttendanceMarkInput,
} from "@/lib/validators/attendance";
import { normalizeSearchText } from "@/services/marketplace-utils";

type SearchParamsInput = Record<string, string | string[] | undefined>;

export type AttendanceFilters = {
  search?: string;
  courseId?: string;
  studentId?: string;
  sessionId?: string;
  status?: AttendanceStatus;
};

export type AttendanceStudentSummary = {
  id: string;
  name: string;
  email: string;
  displayName: string | null;
  gradeLevel: string | null;
};

export type AttendanceCourseSummary = {
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

export type AttendanceSessionSummary = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date | null;
  status: SessionStatus;
  course: AttendanceCourseSummary;
};

export type ManagedAttendance = {
  id: string;
  sessionId: string;
  studentId: string;
  enrollmentId: string;
  status: AttendanceStatus;
  markedAt: Date;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SessionAttendanceItem = {
  enrollmentId: string;
  student: AttendanceStudentSummary;
  attendance: ManagedAttendance | null;
};

export type AttendanceListItem = ManagedAttendance & {
  student: AttendanceStudentSummary;
  session: AttendanceSessionSummary;
};

export type AttendanceSummary = {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
};

type SessionForAttendance = {
  id: string;
  courseId: string;
  courseTutorId: string;
  status: SessionStatus;
};

type ActiveEnrollmentForAttendance = {
  id: string;
  studentId: string;
  courseId: string;
  status: EnrollmentStatus;
};

type AttendanceUpsertData = {
  sessionId: string;
  studentId: string;
  enrollmentId: string;
  status: AttendanceStatus;
  note: string | null;
  markedAt: Date;
};

export type AttendanceWriteStore = {
  getSessionForAttendance(
    sessionId: string,
  ): Promise<SessionForAttendance | null>;
  getActiveEnrollmentForStudent(
    courseId: string,
    studentId: string,
  ): Promise<ActiveEnrollmentForAttendance | null>;
  upsertAttendance(data: AttendanceUpsertData): Promise<ManagedAttendance>;
  runInTransaction<T>(
    callback: (store: AttendanceWriteStore) => Promise<T>,
  ): Promise<T>;
};

export type AttendanceManagementErrorCode =
  | "SESSION_NOT_FOUND"
  | "SESSION_CANCELLED"
  | "ACTIVE_ENROLLMENT_REQUIRED"
  | "EMPTY_ATTENDANCE";

export class AttendanceManagementError extends Error {
  constructor(
    readonly code: AttendanceManagementErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AttendanceManagementError";
  }
}

type PrismaAttendanceClient = Pick<
  PrismaClient,
  "attendance" | "enrollment" | "lessonSession"
>;

function firstValue(value: string | string[] | undefined): string | undefined {
  const selected = Array.isArray(value) ? value[0] : value;

  return selected === "" ? undefined : selected;
}

export function parseAttendanceFilters(
  params: SearchParamsInput,
): AttendanceFilters {
  const parsed: AttendanceFilterInput = attendanceFilterSchema.parse({
    search: firstValue(params.search),
    courseId: firstValue(params.courseId) ?? firstValue(params.course),
    studentId: firstValue(params.studentId) ?? firstValue(params.student),
    sessionId: firstValue(params.sessionId) ?? firstValue(params.session),
    status: firstValue(params.status),
  });

  return {
    search: normalizeSearchText(parsed.search),
    courseId: normalizeSearchText(parsed.courseId),
    studentId: normalizeSearchText(parsed.studentId),
    sessionId: normalizeSearchText(parsed.sessionId),
    status: parsed.status,
  };
}

function mapManagedAttendance(row: ManagedAttendance): ManagedAttendance {
  return {
    id: row.id,
    sessionId: row.sessionId,
    studentId: row.studentId,
    enrollmentId: row.enrollmentId,
    status: row.status,
    markedAt: row.markedAt,
    note: row.note,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function createPrismaAttendanceStore(
  client: PrismaAttendanceClient,
): AttendanceWriteStore {
  const store: AttendanceWriteStore = {
    async getSessionForAttendance(sessionId) {
      const session = await client.lessonSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          courseId: true,
          status: true,
          course: { select: { tutorId: true } },
        },
      });

      if (!session) {
        return null;
      }

      return {
        id: session.id,
        courseId: session.courseId,
        status: session.status,
        courseTutorId: session.course.tutorId,
      };
    },

    async getActiveEnrollmentForStudent(courseId, studentId) {
      return client.enrollment.findFirst({
        where: {
          courseId,
          studentId,
          status: EnrollmentStatus.ACTIVE,
        },
        orderBy: { enrolledAt: "desc" },
        select: {
          id: true,
          studentId: true,
          courseId: true,
          status: true,
        },
      });
    },

    async upsertAttendance(data) {
      const row = await client.attendance.upsert({
        where: {
          sessionId_studentId: {
            sessionId: data.sessionId,
            studentId: data.studentId,
          },
        },
        update: {
          enrollmentId: data.enrollmentId,
          status: data.status,
          note: data.note,
          markedAt: data.markedAt,
        },
        create: data,
      });

      return mapManagedAttendance(row);
    },

    async runInTransaction(callback) {
      return callback(store);
    },
  };

  return store;
}

export const prismaAttendanceWriteStore: AttendanceWriteStore = {
  async getSessionForAttendance(sessionId) {
    return createPrismaAttendanceStore(getDb()).getSessionForAttendance(
      sessionId,
    );
  },
  async getActiveEnrollmentForStudent(courseId, studentId) {
    return createPrismaAttendanceStore(getDb()).getActiveEnrollmentForStudent(
      courseId,
      studentId,
    );
  },
  async upsertAttendance(data) {
    return createPrismaAttendanceStore(getDb()).upsertAttendance(data);
  },
  async runInTransaction(callback) {
    return getDb().$transaction(
      async (tx) =>
        callback(createPrismaAttendanceStore(tx as PrismaAttendanceClient)),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  },
};

function assertMarkableSession(
  session: SessionForAttendance | null,
): asserts session is SessionForAttendance {
  if (!session) {
    throw new AttendanceManagementError(
      "SESSION_NOT_FOUND",
      "Session not found.",
    );
  }

  if (session.status === SessionStatus.CANCELLED) {
    throw new AttendanceManagementError(
      "SESSION_CANCELLED",
      "Attendance cannot be marked for a cancelled session.",
    );
  }
}

function normalizeAttendanceRecord(
  record: AttendanceMarkInput,
): AttendanceMarkInput {
  return {
    studentId: record.studentId,
    status: record.status,
    note: record.note || undefined,
  };
}

export async function bulkMarkAttendance(
  input: BulkAttendanceMarkInput,
  store: AttendanceWriteStore = prismaAttendanceWriteStore,
): Promise<ManagedAttendance[]> {
  const parsed = bulkAttendanceMarkSchema.parse(input);
  const records = parsed.records.map(normalizeAttendanceRecord);

  if (records.length === 0) {
    throw new AttendanceManagementError(
      "EMPTY_ATTENDANCE",
      "At least one attendance record is required.",
    );
  }

  return store.runInTransaction(async (tx) => {
    const session = await tx.getSessionForAttendance(parsed.sessionId);
    assertMarkableSession(session);

    const markedAt = new Date();
    const results: ManagedAttendance[] = [];

    for (const record of records) {
      const enrollment = await tx.getActiveEnrollmentForStudent(
        session.courseId,
        record.studentId,
      );

      if (!enrollment) {
        throw new AttendanceManagementError(
          "ACTIVE_ENROLLMENT_REQUIRED",
          "Attendance can be marked only for active enrolled students in this course.",
        );
      }

      results.push(
        await tx.upsertAttendance({
          sessionId: session.id,
          studentId: record.studentId,
          enrollmentId: enrollment.id,
          status: record.status,
          note: record.note || null,
          markedAt,
        }),
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

const attendanceListSelect = {
  id: true,
  sessionId: true,
  studentId: true,
  enrollmentId: true,
  status: true,
  markedAt: true,
  note: true,
  createdAt: true,
  updatedAt: true,
  student: {
    select: studentSummarySelect,
  },
  session: {
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      status: true,
      course: {
        select: {
          id: true,
          title: true,
          subject: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          tutor: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.AttendanceSelect;

type StudentSummaryRow = Prisma.StudentProfileGetPayload<{
  select: typeof studentSummarySelect;
}>;

type AttendanceListRow = Prisma.AttendanceGetPayload<{
  select: typeof attendanceListSelect;
}>;

function mapStudentSummary(row: StudentSummaryRow): AttendanceStudentSummary {
  return {
    id: row.id,
    name: row.user.name,
    email: row.user.email,
    displayName: row.displayName,
    gradeLevel: row.gradeLevel,
  };
}

function mapAttendanceListItem(row: AttendanceListRow): AttendanceListItem {
  return {
    id: row.id,
    sessionId: row.sessionId,
    studentId: row.studentId,
    enrollmentId: row.enrollmentId,
    status: row.status,
    markedAt: row.markedAt,
    note: row.note,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    student: mapStudentSummary(row.student),
    session: {
      id: row.session.id,
      title: row.session.title,
      startsAt: row.session.startsAt,
      endsAt: row.session.endsAt,
      status: row.session.status,
      course: {
        id: row.session.course.id,
        title: row.session.course.title,
        subject: row.session.course.subject,
        tutor: {
          id: row.session.course.tutor.id,
          name: row.session.course.tutor.user.name,
          email: row.session.course.tutor.user.email,
        },
      },
    },
  };
}

function buildAttendanceWhere(
  filters: AttendanceFilters,
  base: Prisma.AttendanceWhereInput = {},
): Prisma.AttendanceWhereInput {
  const and: Prisma.AttendanceWhereInput[] = [base];

  if (filters.search) {
    and.push({
      OR: [
        { session: { title: { contains: filters.search, mode: "insensitive" } } },
        { session: { course: { title: { contains: filters.search, mode: "insensitive" } } } },
        { session: { course: { subject: { name: { contains: filters.search, mode: "insensitive" } } } } },
        { student: { displayName: { contains: filters.search, mode: "insensitive" } } },
        { student: { user: { name: { contains: filters.search, mode: "insensitive" } } } },
        { student: { user: { email: { contains: filters.search, mode: "insensitive" } } } },
      ],
    });
  }

  if (filters.courseId) {
    and.push({ session: { courseId: filters.courseId } });
  }

  if (filters.studentId) {
    and.push({ studentId: filters.studentId });
  }

  if (filters.sessionId) {
    and.push({ sessionId: filters.sessionId });
  }

  if (filters.status) {
    and.push({ status: filters.status });
  }

  return { AND: and };
}

export async function getSessionAttendance(
  sessionId: string,
): Promise<SessionAttendanceItem[]> {
  const session = await getDb().lessonSession.findUnique({
    where: { id: sessionId },
    select: {
      course: {
        select: {
          enrollments: {
            where: { status: EnrollmentStatus.ACTIVE },
            orderBy: { enrolledAt: "asc" },
            select: {
              id: true,
              student: {
                select: {
                  ...studentSummarySelect,
                  attendances: {
                    where: { sessionId },
                    take: 1,
                    select: {
                      id: true,
                      sessionId: true,
                      studentId: true,
                      enrollmentId: true,
                      status: true,
                      markedAt: true,
                      note: true,
                      createdAt: true,
                      updatedAt: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session) {
    return [];
  }

  return session.course.enrollments.map((enrollment) => ({
    enrollmentId: enrollment.id,
    student: mapStudentSummary(enrollment.student),
    attendance: enrollment.student.attendances[0] ?? null,
  }));
}

export async function getStudentAttendance(
  studentUserId: string,
  filters: AttendanceFilters = {},
): Promise<AttendanceListItem[]> {
  const student = await getDb().studentProfile.findUnique({
    where: { userId: studentUserId },
    select: { id: true },
  });

  if (!student) {
    return [];
  }

  const rows = await getDb().attendance.findMany({
    where: buildAttendanceWhere(filters, { studentId: student.id }),
    orderBy: [{ markedAt: "desc" }, { createdAt: "desc" }],
    select: attendanceListSelect,
  });

  return rows.map(mapAttendanceListItem);
}

export async function getParentChildAttendance(
  parentUserId: string,
  studentId: string,
  filters: AttendanceFilters = {},
): Promise<AttendanceListItem[]> {
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

  const rows = await getDb().attendance.findMany({
    where: buildAttendanceWhere(filters, { studentId }),
    orderBy: [{ markedAt: "desc" }, { createdAt: "desc" }],
    select: attendanceListSelect,
  });

  return rows.map(mapAttendanceListItem);
}

export async function getAttendanceSummaryForStudent(
  studentId: string,
): Promise<AttendanceSummary> {
  const rows = await getDb().attendance.groupBy({
    by: ["status"],
    where: { studentId },
    _count: { _all: true },
  });

  const counts = {
    [AttendanceStatus.PRESENT]: 0,
    [AttendanceStatus.ABSENT]: 0,
    [AttendanceStatus.LATE]: 0,
    [AttendanceStatus.EXCUSED]: 0,
  };

  for (const row of rows) {
    counts[row.status] = row._count._all;
  }

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const attended =
    counts.PRESENT + counts.LATE + counts.EXCUSED;

  return {
    total,
    present: counts.PRESENT,
    absent: counts.ABSENT,
    late: counts.LATE,
    excused: counts.EXCUSED,
    attendanceRate: total === 0 ? 0 : Math.round((attended / total) * 100),
  };
}

export async function getAdminAttendance(
  filters: AttendanceFilters = {},
): Promise<AttendanceListItem[]> {
  const rows = await getDb().attendance.findMany({
    where: buildAttendanceWhere(filters),
    orderBy: [{ markedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
    select: attendanceListSelect,
  });

  return rows.map(mapAttendanceListItem);
}
