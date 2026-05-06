import {
  CourseStatus,
  EnrollmentStatus,
  Prisma,
  SessionStatus,
} from "@/lib/generated/prisma/client";
import { getDb } from "@/lib/db";
import {
  sessionCreateSchema,
  sessionFilterSchema,
  sessionUpdateSchema,
  type SessionCreateInput,
  type SessionFilterInput,
  type SessionUpdateInput,
} from "@/lib/validators/session";
import { normalizeSearchText } from "@/services/marketplace-utils";

type SearchParamsInput = Record<string, string | string[] | undefined>;

export type SessionFilters = {
  search?: string;
  courseId?: string;
  tutorId?: string;
  status?: SessionStatus;
};

export type SessionCourseSummary = {
  id: string;
  title: string;
  status: CourseStatus;
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

export type ManagedSession = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date | null;
  meetingUrl: string | null;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
  course: SessionCourseSummary;
  stats: {
    activeEnrollmentCount: number;
    attendanceCount: number;
  };
};

export type SessionCourseOption = {
  id: string;
  title: string;
  status: CourseStatus;
  subjectName: string;
};

export type SessionWriteRecord = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date | null;
  meetingUrl: string | null;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
  courseTutorId: string;
  courseStatus: CourseStatus;
};

type CourseAccessRecord = {
  id: string;
  tutorId: string;
  status: CourseStatus;
};

type SessionCreateData = {
  courseId: string;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date;
  meetingUrl: string | null;
  status: SessionStatus;
};

type SessionUpdateData = {
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date;
  meetingUrl: string | null;
};

type SessionStatusData = {
  status: SessionStatus;
};

export type SessionWriteStore = {
  getTutorProfileByUserId(tutorUserId: string): Promise<{ id: string } | null>;
  getCourseAccess(courseId: string): Promise<CourseAccessRecord | null>;
  createSession(data: SessionCreateData): Promise<SessionWriteRecord>;
  getSessionAccess(sessionId: string): Promise<SessionWriteRecord | null>;
  updateSession(
    sessionId: string,
    data: SessionUpdateData,
  ): Promise<SessionWriteRecord>;
  updateSessionStatus(
    sessionId: string,
    data: SessionStatusData,
  ): Promise<SessionWriteRecord>;
};

export type SessionManagementErrorCode =
  | "TUTOR_PROFILE_REQUIRED"
  | "COURSE_NOT_FOUND"
  | "COURSE_NOT_PUBLISHED"
  | "SESSION_NOT_FOUND"
  | "FORBIDDEN"
  | "ONLY_SCHEDULED_CAN_BE_EDITED"
  | "INVALID_STATUS_TRANSITION";

export class SessionManagementError extends Error {
  constructor(
    readonly code: SessionManagementErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SessionManagementError";
  }
}

function firstValue(value: string | string[] | undefined): string | undefined {
  const selected = Array.isArray(value) ? value[0] : value;

  return selected === "" ? undefined : selected;
}

export function parseSessionFilters(params: SearchParamsInput): SessionFilters {
  const parsed: SessionFilterInput = sessionFilterSchema.parse({
    search: firstValue(params.search),
    courseId: firstValue(params.courseId) ?? firstValue(params.course),
    tutorId: firstValue(params.tutorId) ?? firstValue(params.tutor),
    status: firstValue(params.status),
  });

  return {
    search: normalizeSearchText(parsed.search),
    courseId: normalizeSearchText(parsed.courseId),
    tutorId: normalizeSearchText(parsed.tutorId),
    status: parsed.status,
  };
}

export function buildSessionCreateData(
  input: SessionCreateInput,
): SessionCreateData {
  const parsed = sessionCreateSchema.parse(input);

  return {
    courseId: parsed.courseId,
    title: parsed.title,
    description: parsed.description || null,
    startsAt: parsed.scheduledStart,
    endsAt: parsed.scheduledEnd,
    meetingUrl: parsed.meetingLink || null,
    status: SessionStatus.SCHEDULED,
  };
}

export function buildSessionUpdateData(
  input: SessionUpdateInput,
): SessionUpdateData {
  const parsed = sessionUpdateSchema.parse(input);

  return {
    title: parsed.title,
    description: parsed.description || null,
    startsAt: parsed.scheduledStart,
    endsAt: parsed.scheduledEnd,
    meetingUrl: parsed.meetingLink || null,
  };
}

function mapSessionWriteRecord(
  row: Omit<SessionWriteRecord, "courseTutorId" | "courseStatus"> & {
    course: { tutorId: string; status: CourseStatus };
  },
): SessionWriteRecord {
  return {
    id: row.id,
    courseId: row.courseId,
    title: row.title,
    description: row.description,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    meetingUrl: row.meetingUrl,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    courseTutorId: row.course.tutorId,
    courseStatus: row.course.status,
  };
}

const prismaSessionWriteStore: SessionWriteStore = {
  async getTutorProfileByUserId(tutorUserId) {
    return getDb().tutorProfile.findUnique({
      where: { userId: tutorUserId },
      select: { id: true },
    });
  },

  async getCourseAccess(courseId) {
    return getDb().course.findUnique({
      where: { id: courseId },
      select: { id: true, tutorId: true, status: true },
    });
  },

  async createSession(data) {
    const row = await getDb().lessonSession.create({
      data,
      include: { course: { select: { tutorId: true, status: true } } },
    });

    return mapSessionWriteRecord(row);
  },

  async getSessionAccess(sessionId) {
    const row = await getDb().lessonSession.findUnique({
      where: { id: sessionId },
      include: { course: { select: { tutorId: true, status: true } } },
    });

    return row ? mapSessionWriteRecord(row) : null;
  },

  async updateSession(sessionId, data) {
    const row = await getDb().lessonSession.update({
      where: { id: sessionId },
      data,
      include: { course: { select: { tutorId: true, status: true } } },
    });

    return mapSessionWriteRecord(row);
  },

  async updateSessionStatus(sessionId, data) {
    const row = await getDb().lessonSession.update({
      where: { id: sessionId },
      data,
      include: { course: { select: { tutorId: true, status: true } } },
    });

    return mapSessionWriteRecord(row);
  },
};

async function getRequiredTutorProfileId(
  tutorUserId: string,
  store: SessionWriteStore,
): Promise<string> {
  const tutor = await store.getTutorProfileByUserId(tutorUserId);

  if (!tutor) {
    throw new SessionManagementError(
      "TUTOR_PROFILE_REQUIRED",
      "A tutor profile is required to manage sessions.",
    );
  }

  return tutor.id;
}

async function getTutorOwnedPublishedCourse(
  tutorUserId: string,
  courseId: string,
  store: SessionWriteStore,
): Promise<CourseAccessRecord> {
  const [tutorId, course] = await Promise.all([
    getRequiredTutorProfileId(tutorUserId, store),
    store.getCourseAccess(courseId),
  ]);

  if (!course) {
    throw new SessionManagementError("COURSE_NOT_FOUND", "Course not found.");
  }

  if (course.tutorId !== tutorId) {
    throw new SessionManagementError(
      "FORBIDDEN",
      "You do not have permission to manage sessions for this course.",
    );
  }

  if (course.status !== CourseStatus.PUBLISHED) {
    throw new SessionManagementError(
      "COURSE_NOT_PUBLISHED",
      "Sessions can be created only for published courses.",
    );
  }

  return course;
}

async function getTutorOwnedSession(
  tutorUserId: string,
  sessionId: string,
  store: SessionWriteStore,
): Promise<SessionWriteRecord> {
  const [tutorId, session] = await Promise.all([
    getRequiredTutorProfileId(tutorUserId, store),
    store.getSessionAccess(sessionId),
  ]);

  if (!session) {
    throw new SessionManagementError(
      "SESSION_NOT_FOUND",
      "Session not found.",
    );
  }

  if (session.courseTutorId !== tutorId) {
    throw new SessionManagementError(
      "FORBIDDEN",
      "You do not have permission to manage this session.",
    );
  }

  return session;
}

export function canTransitionSessionStatus(
  from: SessionStatus,
  to: SessionStatus,
): boolean {
  if (from === to) {
    return true;
  }

  if (from === SessionStatus.SCHEDULED) {
    return to === SessionStatus.COMPLETED || to === SessionStatus.CANCELLED;
  }

  return false;
}

function buildSessionStatusData(
  session: SessionWriteRecord,
  status: SessionStatus,
): SessionStatusData {
  if (!canTransitionSessionStatus(session.status, status)) {
    throw new SessionManagementError(
      "INVALID_STATUS_TRANSITION",
      `Cannot change session status from ${session.status} to ${status}.`,
    );
  }

  return { status };
}

export async function createSession(
  tutorUserId: string,
  input: SessionCreateInput,
  store: SessionWriteStore = prismaSessionWriteStore,
): Promise<SessionWriteRecord> {
  const data = buildSessionCreateData(input);
  await getTutorOwnedPublishedCourse(tutorUserId, data.courseId, store);

  return store.createSession(data);
}

export async function updateSession(
  tutorUserId: string,
  sessionId: string,
  input: SessionUpdateInput,
  store: SessionWriteStore = prismaSessionWriteStore,
): Promise<SessionWriteRecord> {
  const session = await getTutorOwnedSession(tutorUserId, sessionId, store);

  if (session.status !== SessionStatus.SCHEDULED) {
    throw new SessionManagementError(
      "ONLY_SCHEDULED_CAN_BE_EDITED",
      "Only scheduled sessions can be edited.",
    );
  }

  return store.updateSession(sessionId, buildSessionUpdateData(input));
}

async function updateTutorSessionStatus(
  tutorUserId: string,
  sessionId: string,
  status: SessionStatus,
  store: SessionWriteStore,
): Promise<SessionWriteRecord> {
  const session = await getTutorOwnedSession(tutorUserId, sessionId, store);

  return store.updateSessionStatus(
    sessionId,
    buildSessionStatusData(session, status),
  );
}

export function cancelSession(
  tutorUserId: string,
  sessionId: string,
  store: SessionWriteStore = prismaSessionWriteStore,
): Promise<SessionWriteRecord> {
  return updateTutorSessionStatus(
    tutorUserId,
    sessionId,
    SessionStatus.CANCELLED,
    store,
  );
}

export function completeSession(
  tutorUserId: string,
  sessionId: string,
  store: SessionWriteStore = prismaSessionWriteStore,
): Promise<SessionWriteRecord> {
  return updateTutorSessionStatus(
    tutorUserId,
    sessionId,
    SessionStatus.COMPLETED,
    store,
  );
}

export async function adminUpdateSessionStatus(
  sessionId: string,
  status: SessionStatus,
  store: SessionWriteStore = prismaSessionWriteStore,
): Promise<SessionWriteRecord> {
  const session = await store.getSessionAccess(sessionId);

  if (!session) {
    throw new SessionManagementError(
      "SESSION_NOT_FOUND",
      "Session not found.",
    );
  }

  return store.updateSessionStatus(
    sessionId,
    buildSessionStatusData(session, status),
  );
}

const sessionListSelect = {
  id: true,
  courseId: true,
  title: true,
  description: true,
  startsAt: true,
  endsAt: true,
  meetingUrl: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  course: {
    select: {
      id: true,
      title: true,
      status: true,
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
  attendances: {
    select: { id: true },
  },
} satisfies Prisma.LessonSessionSelect;

type SessionListRow = Prisma.LessonSessionGetPayload<{
  select: typeof sessionListSelect;
}>;

function mapSession(row: SessionListRow): ManagedSession {
  return {
    id: row.id,
    courseId: row.courseId,
    title: row.title,
    description: row.description,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    meetingUrl: row.meetingUrl,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    course: {
      id: row.course.id,
      title: row.course.title,
      status: row.course.status,
      subject: row.course.subject,
      tutor: {
        id: row.course.tutor.id,
        name: row.course.tutor.user.name,
        email: row.course.tutor.user.email,
      },
    },
    stats: {
      activeEnrollmentCount: row.course.enrollments.length,
      attendanceCount: row.attendances.length,
    },
  };
}

function buildSessionWhere(
  filters: SessionFilters,
  base: Prisma.LessonSessionWhereInput = {},
): Prisma.LessonSessionWhereInput {
  const and: Prisma.LessonSessionWhereInput[] = [base];

  if (filters.search) {
    and.push({
      OR: [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
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

  if (filters.status) {
    and.push({ status: filters.status });
  }

  return { AND: and };
}

export async function getTutorSessions(
  tutorUserId: string,
  filters: SessionFilters = {},
): Promise<ManagedSession[]> {
  const tutor = await getDb().tutorProfile.findUnique({
    where: { userId: tutorUserId },
    select: { id: true },
  });

  if (!tutor) {
    return [];
  }

  const rows = await getDb().lessonSession.findMany({
    where: buildSessionWhere(filters, { course: { tutorId: tutor.id } }),
    orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
    select: sessionListSelect,
  });

  return rows.map(mapSession);
}

export async function getTutorCourseSessions(
  tutorUserId: string,
  courseId: string,
  filters: SessionFilters = {},
): Promise<ManagedSession[]> {
  const tutor = await getDb().tutorProfile.findUnique({
    where: { userId: tutorUserId },
    select: { id: true },
  });

  if (!tutor) {
    return [];
  }

  const rows = await getDb().lessonSession.findMany({
    where: buildSessionWhere(filters, {
      courseId,
      course: { tutorId: tutor.id },
    }),
    orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
    select: sessionListSelect,
  });

  return rows.map(mapSession);
}

export async function getTutorSessionById(
  tutorUserId: string,
  sessionId: string,
): Promise<ManagedSession | null> {
  const tutor = await getDb().tutorProfile.findUnique({
    where: { userId: tutorUserId },
    select: { id: true },
  });

  if (!tutor) {
    return null;
  }

  const row = await getDb().lessonSession.findFirst({
    where: { id: sessionId, course: { tutorId: tutor.id } },
    select: sessionListSelect,
  });

  return row ? mapSession(row) : null;
}

export async function getStudentSchedule(
  studentUserId: string,
  filters: SessionFilters = {},
): Promise<ManagedSession[]> {
  const student = await getDb().studentProfile.findUnique({
    where: { userId: studentUserId },
    select: { id: true },
  });

  if (!student) {
    return [];
  }

  const rows = await getDb().lessonSession.findMany({
    where: buildSessionWhere(filters, {
      course: {
        enrollments: {
          some: { studentId: student.id, status: EnrollmentStatus.ACTIVE },
        },
      },
    }),
    orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
    select: sessionListSelect,
  });

  return rows.map(mapSession);
}

export async function getParentChildSchedule(
  parentUserId: string,
  studentId: string,
  filters: SessionFilters = {},
): Promise<ManagedSession[]> {
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

  const rows = await getDb().lessonSession.findMany({
    where: buildSessionWhere(filters, {
      course: {
        enrollments: {
          some: { studentId, status: EnrollmentStatus.ACTIVE },
        },
      },
    }),
    orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
    select: sessionListSelect,
  });

  return rows.map(mapSession);
}

export async function getAdminSessions(
  filters: SessionFilters = {},
): Promise<ManagedSession[]> {
  const rows = await getDb().lessonSession.findMany({
    where: buildSessionWhere(filters),
    orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
    select: sessionListSelect,
  });

  return rows.map(mapSession);
}

export async function getAdminSessionFilterOptions(): Promise<{
  courses: Array<{ id: string; title: string }>;
  tutors: Array<{ id: string; name: string; email: string }>;
}> {
  const [courses, tutors] = await Promise.all([
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
  ]);

  return {
    courses,
    tutors: tutors.map((tutor) => ({
      id: tutor.id,
      name: tutor.user.name,
      email: tutor.user.email,
    })),
  };
}

export async function getTutorSessionCourseOptions(
  tutorUserId: string,
  publishedOnly = false,
): Promise<SessionCourseOption[]> {
  const tutor = await getDb().tutorProfile.findUnique({
    where: { userId: tutorUserId },
    select: { id: true },
  });

  if (!tutor) {
    return [];
  }

  const courses = await getDb().course.findMany({
    where: {
      tutorId: tutor.id,
      ...(publishedOnly ? { status: CourseStatus.PUBLISHED } : {}),
    },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      status: true,
      subject: { select: { name: true } },
    },
  });

  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    status: course.status,
    subjectName: course.subject.name,
  }));
}
