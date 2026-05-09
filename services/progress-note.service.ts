import {
  EnrollmentStatus,
  Prisma,
  UserRole,
  type PrismaClient,
} from "@/lib/generated/prisma/client";
import { getDb } from "@/lib/db";
import {
  progressNoteCreateSchema,
  type ProgressNoteCreateInput,
} from "@/lib/validators/progress";

export type ProgressNoteSummary = {
  id: string;
  courseId: string;
  studentId: string;
  enrollmentId: string;
  tutorId: string;
  note: string;
  strengths: string | null;
  weaknesses: string | null;
  recommendedNextSteps: string | null;
  tutorName: string;
  createdAt: Date;
  updatedAt: Date;
};

type TutorRecord = {
  id: string;
};

type ProgressNoteActorRecord = {
  id: string;
  role: UserRole;
  tutorProfileId: string | null;
};

type CourseRecord = {
  id: string;
  tutorId: string;
};

type ActiveEnrollmentRecord = {
  id: string;
  studentId: string;
  courseId: string;
};

type ProgressNoteCreateData = {
  courseId: string;
  studentId: string;
  enrollmentId: string;
  tutorId: string;
  note: string;
  strengths: string | null;
  weaknesses: string | null;
  recommendedNextSteps: string | null;
};

export type ProgressNoteWriteStore = {
  getActorByUserId(userId: string): Promise<ProgressNoteActorRecord | null>;
  getTutorProfileByUserId(tutorUserId: string): Promise<TutorRecord | null>;
  getCourse(courseId: string): Promise<CourseRecord | null>;
  getActiveEnrollment(
    studentId: string,
    courseId: string,
  ): Promise<ActiveEnrollmentRecord | null>;
  createProgressNote(data: ProgressNoteCreateData): Promise<ProgressNoteSummary>;
  runInTransaction<T>(
    callback: (store: ProgressNoteWriteStore) => Promise<T>,
  ): Promise<T>;
};

export type ProgressNoteManagementErrorCode =
  | "TUTOR_PROFILE_REQUIRED"
  | "COURSE_NOT_FOUND"
  | "FORBIDDEN"
  | "ACTIVE_ENROLLMENT_REQUIRED";

export class ProgressNoteManagementError extends Error {
  constructor(
    readonly code: ProgressNoteManagementErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ProgressNoteManagementError";
  }
}

type PrismaProgressNoteClient = Pick<
  PrismaClient,
  "course" | "enrollment" | "progressNote" | "tutorProfile" | "user"
>;

const progressNoteSelect = {
  id: true,
  courseId: true,
  studentId: true,
  enrollmentId: true,
  tutorId: true,
  note: true,
  strengths: true,
  weaknesses: true,
  recommendedNextSteps: true,
  createdAt: true,
  updatedAt: true,
  tutor: {
    select: {
      user: { select: { name: true } },
    },
  },
} satisfies Prisma.ProgressNoteSelect;

type ProgressNoteRow = Prisma.ProgressNoteGetPayload<{
  select: typeof progressNoteSelect;
}>;

function mapProgressNote(row: ProgressNoteRow): ProgressNoteSummary {
  return {
    id: row.id,
    courseId: row.courseId,
    studentId: row.studentId,
    enrollmentId: row.enrollmentId,
    tutorId: row.tutorId,
    note: row.note,
    strengths: row.strengths,
    weaknesses: row.weaknesses,
    recommendedNextSteps: row.recommendedNextSteps,
    tutorName: row.tutor.user.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function buildRequiredNote(input: ProgressNoteCreateInput): string {
  return (
    input.behaviorNote ||
    input.parentSummary ||
    input.nextPlan ||
    input.strengths ||
    input.weaknesses ||
    "Progress note"
  );
}

function buildRecommendedNextSteps(input: ProgressNoteCreateInput): string | null {
  const steps = [
    input.nextPlan ? `Next plan: ${input.nextPlan}` : null,
    input.parentSummary ? `Parent summary: ${input.parentSummary}` : null,
  ].filter((value): value is string => Boolean(value));

  return steps.length > 0 ? steps.join("\n") : null;
}

function createPrismaProgressNoteStore(
  client: PrismaProgressNoteClient,
): ProgressNoteWriteStore {
  const store: ProgressNoteWriteStore = {
    async getActorByUserId(userId) {
      const user = await client.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          tutorProfile: { select: { id: true } },
        },
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        role: user.role,
        tutorProfileId: user.tutorProfile?.id ?? null,
      };
    },

    async getTutorProfileByUserId(tutorUserId) {
      return client.tutorProfile.findUnique({
        where: { userId: tutorUserId },
        select: { id: true },
      });
    },

    async getCourse(courseId) {
      return client.course.findUnique({
        where: { id: courseId },
        select: { id: true, tutorId: true },
      });
    },

    async getActiveEnrollment(studentId, courseId) {
      return client.enrollment.findFirst({
        where: { studentId, courseId, status: EnrollmentStatus.ACTIVE },
        orderBy: { enrolledAt: "desc" },
        select: { id: true, studentId: true, courseId: true },
      });
    },

    async createProgressNote(data) {
      const row = await client.progressNote.create({
        data,
        select: progressNoteSelect,
      });

      return mapProgressNote(row);
    },

    async runInTransaction(callback) {
      return callback(store);
    },
  };

  return store;
}

const prismaProgressNoteWriteStore: ProgressNoteWriteStore = {
  async getActorByUserId(userId) {
    return createPrismaProgressNoteStore(getDb()).getActorByUserId(userId);
  },
  async getTutorProfileByUserId(tutorUserId) {
    return createPrismaProgressNoteStore(getDb()).getTutorProfileByUserId(
      tutorUserId,
    );
  },
  async getCourse(courseId) {
    return createPrismaProgressNoteStore(getDb()).getCourse(courseId);
  },
  async getActiveEnrollment(studentId, courseId) {
    return createPrismaProgressNoteStore(getDb()).getActiveEnrollment(
      studentId,
      courseId,
    );
  },
  async createProgressNote(data) {
    return createPrismaProgressNoteStore(getDb()).createProgressNote(data);
  },
  async runInTransaction(callback) {
    return getDb().$transaction((tx) =>
      callback(createPrismaProgressNoteStore(tx as PrismaProgressNoteClient)),
    );
  },
};

export async function createProgressNote(
  tutorUserId: string,
  studentId: string,
  courseId: string,
  input: ProgressNoteCreateInput,
  store: ProgressNoteWriteStore = prismaProgressNoteWriteStore,
): Promise<ProgressNoteSummary> {
  const parsed = progressNoteCreateSchema.parse(input);

  return store.runInTransaction(async (tx) => {
    const [actor, legacyTutor, course, enrollment] = await Promise.all([
      tx.getActorByUserId(tutorUserId),
      tx.getTutorProfileByUserId(tutorUserId),
      tx.getCourse(courseId),
      tx.getActiveEnrollment(studentId, courseId),
    ]);
    const tutorProfileId = actor?.tutorProfileId ?? legacyTutor?.id ?? null;

    if (!actor && !legacyTutor) {
      throw new ProgressNoteManagementError(
        "TUTOR_PROFILE_REQUIRED",
        "A tutor or admin account is required to create progress notes.",
      );
    }

    if (!course) {
      throw new ProgressNoteManagementError("COURSE_NOT_FOUND", "Course not found.");
    }

    if (
      actor?.role !== UserRole.ADMIN &&
      (!tutorProfileId || course.tutorId !== tutorProfileId)
    ) {
      throw new ProgressNoteManagementError(
        "FORBIDDEN",
        "Progress notes can be created only by admins or the course tutor.",
      );
    }

    if (!enrollment) {
      throw new ProgressNoteManagementError(
        "ACTIVE_ENROLLMENT_REQUIRED",
        "Progress notes can be created only for ACTIVE enrolled students.",
      );
    }

    return tx.createProgressNote({
      courseId,
      studentId,
      enrollmentId: enrollment.id,
      tutorId: tutorProfileId ?? course.tutorId,
      note: buildRequiredNote(parsed),
      strengths: parsed.strengths || null,
      weaknesses: parsed.weaknesses || null,
      recommendedNextSteps: buildRecommendedNextSteps(parsed),
    });
  });
}

export async function getLatestProgressNote(
  studentId: string,
  courseId: string,
): Promise<ProgressNoteSummary | null> {
  const row = await getDb().progressNote.findFirst({
    where: {
      studentId,
      courseId,
      enrollment: { status: EnrollmentStatus.ACTIVE },
    },
    orderBy: { createdAt: "desc" },
    select: progressNoteSelect,
  });

  return row ? mapProgressNote(row) : null;
}

export async function getProgressNotes(
  studentId: string,
  courseId: string,
): Promise<ProgressNoteSummary[]> {
  const rows = await getDb().progressNote.findMany({
    where: {
      studentId,
      courseId,
      enrollment: { status: EnrollmentStatus.ACTIVE },
    },
    orderBy: { createdAt: "desc" },
    select: progressNoteSelect,
  });

  return rows.map(mapProgressNote);
}

export async function getTutorProgressNotes(
  tutorUserId: string,
  studentId: string,
  courseId: string,
): Promise<ProgressNoteSummary[]> {
  const rows = await getDb().progressNote.findMany({
    where: {
      studentId,
      courseId,
      enrollment: { status: EnrollmentStatus.ACTIVE },
      course: { tutor: { userId: tutorUserId } },
    },
    orderBy: { createdAt: "desc" },
    select: progressNoteSelect,
  });

  return rows.map(mapProgressNote);
}

export async function getStudentProgressNotes(
  studentUserId: string,
  courseId: string,
): Promise<ProgressNoteSummary[]> {
  const student = await getDb().studentProfile.findUnique({
    where: { userId: studentUserId },
    select: { id: true },
  });

  if (!student) {
    return [];
  }

  return getProgressNotes(student.id, courseId);
}

export async function getParentChildProgressNotes(
  parentUserId: string,
  studentId: string,
  courseId: string,
): Promise<ProgressNoteSummary[]> {
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

  return getProgressNotes(studentId, courseId);
}
