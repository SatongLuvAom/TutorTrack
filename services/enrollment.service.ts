import {
  CourseStatus,
  CourseType,
  EnrollmentStatus,
  Prisma,
  TutorVerificationStatus,
  type PrismaClient,
} from "@/lib/generated/prisma/client";
import { getDb } from "@/lib/db";
import {
  enrollmentFilterSchema,
  type EnrollmentFilterInput,
} from "@/lib/validators/enrollment";
import { normalizeSearchText } from "@/services/marketplace-utils";

type SearchParamsInput = Record<string, string | string[] | undefined>;

const capacityStatuses = [
  EnrollmentStatus.PENDING,
  EnrollmentStatus.ACTIVE,
] as const;

export type EnrollmentFilters = {
  search?: string;
  courseId?: string;
  tutorId?: string;
  studentId?: string;
  status?: EnrollmentStatus;
};

export type EnrollmentCourseSummary = {
  id: string;
  title: string;
  type: CourseType;
  priceCents: number;
  maxStudents: number | null;
  totalSessions: number;
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

export type EnrollmentStudentSummary = {
  id: string;
  name: string;
  email: string;
  displayName: string | null;
  gradeLevel: string | null;
};

export type EnrollmentParentSummary = {
  id: string;
  name: string;
  email: string;
  relationship: string | null;
};

export type EnrollmentListItem = {
  id: string;
  status: EnrollmentStatus;
  enrolledAt: Date;
  completedAt: Date | null;
  cancelledAt: Date | null;
  course: EnrollmentCourseSummary;
};

export type TutorCourseEnrollmentItem = {
  id: string;
  status: EnrollmentStatus;
  enrolledAt: Date;
  student: EnrollmentStudentSummary;
  parents: EnrollmentParentSummary[];
};

export type TutorEnrollmentItem = TutorCourseEnrollmentItem & {
  course: Pick<EnrollmentCourseSummary, "id" | "title" | "subject" | "type">;
};

export type AdminEnrollmentItem = TutorCourseEnrollmentItem & {
  completedAt: Date | null;
  cancelledAt: Date | null;
  course: EnrollmentCourseSummary;
};

export type EnrollmentCourseOption = {
  id: string;
  title: string;
  subjectName: string;
  tutorName: string;
  priceCents: number;
};

export type ParentChildOption = {
  studentId: string;
  name: string;
  email: string;
  gradeLevel: string | null;
  currentEnrollment: EnrollmentStatusSummary | null;
};

export type EnrollmentStatusSummary = {
  id: string;
  status: EnrollmentStatus;
  enrolledAt: Date;
};

export type ManagedEnrollment = {
  id: string;
  studentId: string;
  courseId: string;
  status: EnrollmentStatus;
  enrolledAt: Date;
  completedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type CourseForEnrollment = {
  id: string;
  status: CourseStatus;
  capacity: number | null;
};

type EnrollmentMutationRecord = ManagedEnrollment & {
  courseTutorId: string;
};

type EnrollmentStatusData = {
  status: EnrollmentStatus;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
};

type EnrollmentCreateData = {
  studentId: string;
  courseId: string;
  status: EnrollmentStatus;
};

export type EnrollmentWriteStore = {
  getStudentProfileByUserId(
    studentUserId: string,
  ): Promise<{ id: string } | null>;
  getParentProfileByUserId(
    parentUserId: string,
  ): Promise<{ id: string } | null>;
  hasActiveParentStudentLink(
    parentId: string,
    studentId: string,
  ): Promise<boolean>;
  getCourseForEnrollment(courseId: string): Promise<CourseForEnrollment | null>;
  countPendingActiveEnrollments(courseId: string): Promise<number>;
  getPendingOrActiveEnrollment(
    studentId: string,
    courseId: string,
  ): Promise<ManagedEnrollment | null>;
  createEnrollment(data: EnrollmentCreateData): Promise<ManagedEnrollment>;
  getEnrollmentForMutation(
    enrollmentId: string,
  ): Promise<EnrollmentMutationRecord | null>;
  updateEnrollmentStatus(
    enrollmentId: string,
    data: EnrollmentStatusData,
  ): Promise<ManagedEnrollment>;
  runInTransaction<T>(
    callback: (store: EnrollmentWriteStore) => Promise<T>,
  ): Promise<T>;
};

export type EnrollmentManagementErrorCode =
  | "STUDENT_PROFILE_REQUIRED"
  | "PARENT_PROFILE_REQUIRED"
  | "PARENT_CHILD_LINK_REQUIRED"
  | "COURSE_NOT_FOUND"
  | "COURSE_NOT_PUBLISHED"
  | "DUPLICATE_ENROLLMENT"
  | "COURSE_FULL"
  | "ENROLLMENT_NOT_FOUND"
  | "FORBIDDEN"
  | "INVALID_STATUS_TRANSITION"
  | "ONLY_PENDING_CAN_BE_CANCELLED";

export class EnrollmentManagementError extends Error {
  constructor(
    readonly code: EnrollmentManagementErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "EnrollmentManagementError";
  }
}

type PrismaEnrollmentClient = Pick<
  PrismaClient,
  "course" | "enrollment" | "parentProfile" | "parentStudentLink" | "studentProfile"
>;

function firstValue(value: string | string[] | undefined): string | undefined {
  const selected = Array.isArray(value) ? value[0] : value;

  return selected === "" ? undefined : selected;
}

export function parseEnrollmentFilters(
  params: SearchParamsInput,
): EnrollmentFilters {
  const parsed: EnrollmentFilterInput = enrollmentFilterSchema.parse({
    search: firstValue(params.search),
    courseId: firstValue(params.courseId) ?? firstValue(params.course),
    tutorId: firstValue(params.tutorId) ?? firstValue(params.tutor),
    studentId: firstValue(params.studentId) ?? firstValue(params.student),
    status: firstValue(params.status),
  });

  return {
    search: normalizeSearchText(parsed.search),
    courseId: normalizeSearchText(parsed.courseId),
    tutorId: normalizeSearchText(parsed.tutorId),
    studentId: normalizeSearchText(parsed.studentId),
    status: parsed.status,
  };
}

function mapManagedEnrollment(row: ManagedEnrollment): ManagedEnrollment {
  return {
    id: row.id,
    studentId: row.studentId,
    courseId: row.courseId,
    status: row.status,
    enrolledAt: row.enrolledAt,
    completedAt: row.completedAt,
    cancelledAt: row.cancelledAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function createPrismaEnrollmentStore(
  client: PrismaEnrollmentClient,
): EnrollmentWriteStore {
  const store: EnrollmentWriteStore = {
    async getStudentProfileByUserId(studentUserId) {
      return client.studentProfile.findUnique({
        where: { userId: studentUserId },
        select: { id: true },
      });
    },

    async getParentProfileByUserId(parentUserId) {
      return client.parentProfile.findUnique({
        where: { userId: parentUserId },
        select: { id: true },
      });
    },

    async hasActiveParentStudentLink(parentId, studentId) {
      const count = await client.parentStudentLink.count({
        where: { parentId, studentId, isActive: true, endedAt: null },
      });

      return count > 0;
    },

    async getCourseForEnrollment(courseId) {
      return client.course.findUnique({
        where: { id: courseId },
        select: { id: true, status: true, capacity: true },
      });
    },

    async countPendingActiveEnrollments(courseId) {
      return client.enrollment.count({
        where: {
          courseId,
          status: { in: [...capacityStatuses] },
        },
      });
    },

    async getPendingOrActiveEnrollment(studentId, courseId) {
      return client.enrollment.findFirst({
        where: {
          studentId,
          courseId,
          status: { in: [...capacityStatuses] },
        },
        orderBy: { createdAt: "desc" },
      });
    },

    async createEnrollment(data) {
      const row = await client.enrollment.create({
        data,
      });

      return mapManagedEnrollment(row);
    },

    async getEnrollmentForMutation(enrollmentId) {
      const row = await client.enrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          course: {
            select: {
              tutorId: true,
            },
          },
        },
      });

      if (!row) {
        return null;
      }

      return {
        ...mapManagedEnrollment(row),
        courseTutorId: row.course.tutorId,
      };
    },

    async updateEnrollmentStatus(enrollmentId, data) {
      const row = await client.enrollment.update({
        where: { id: enrollmentId },
        data,
      });

      return mapManagedEnrollment(row);
    },

    async runInTransaction(callback) {
      return callback(store);
    },
  };

  return store;
}

export const prismaEnrollmentWriteStore: EnrollmentWriteStore = {
  async getStudentProfileByUserId(studentUserId) {
    return createPrismaEnrollmentStore(getDb()).getStudentProfileByUserId(
      studentUserId,
    );
  },
  async getParentProfileByUserId(parentUserId) {
    return createPrismaEnrollmentStore(getDb()).getParentProfileByUserId(
      parentUserId,
    );
  },
  async hasActiveParentStudentLink(parentId, studentId) {
    return createPrismaEnrollmentStore(getDb()).hasActiveParentStudentLink(
      parentId,
      studentId,
    );
  },
  async getCourseForEnrollment(courseId) {
    return createPrismaEnrollmentStore(getDb()).getCourseForEnrollment(courseId);
  },
  async countPendingActiveEnrollments(courseId) {
    return createPrismaEnrollmentStore(getDb()).countPendingActiveEnrollments(
      courseId,
    );
  },
  async getPendingOrActiveEnrollment(studentId, courseId) {
    return createPrismaEnrollmentStore(getDb()).getPendingOrActiveEnrollment(
      studentId,
      courseId,
    );
  },
  async createEnrollment(data) {
    return createPrismaEnrollmentStore(getDb()).createEnrollment(data);
  },
  async getEnrollmentForMutation(enrollmentId) {
    return createPrismaEnrollmentStore(getDb()).getEnrollmentForMutation(
      enrollmentId,
    );
  },
  async updateEnrollmentStatus(enrollmentId, data) {
    return createPrismaEnrollmentStore(getDb()).updateEnrollmentStatus(
      enrollmentId,
      data,
    );
  },
  async runInTransaction(callback) {
    return getDb().$transaction(
      async (tx) =>
        callback(createPrismaEnrollmentStore(tx as PrismaEnrollmentClient)),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  },
};

function assertCanEnrollInCourse(
  course: CourseForEnrollment | null,
): asserts course is CourseForEnrollment {
  if (!course) {
    throw new EnrollmentManagementError("COURSE_NOT_FOUND", "Course not found.");
  }

  if (course.status !== CourseStatus.PUBLISHED) {
    throw new EnrollmentManagementError(
      "COURSE_NOT_PUBLISHED",
      "Only published courses can accept enrollments.",
    );
  }
}

async function assertCourseCapacity(
  course: CourseForEnrollment,
  store: EnrollmentWriteStore,
): Promise<void> {
  if (course.capacity === null) {
    return;
  }

  const usedSeats = await store.countPendingActiveEnrollments(course.id);

  if (usedSeats >= course.capacity) {
    throw new EnrollmentManagementError(
      "COURSE_FULL",
      "Course capacity has been reached.",
    );
  }
}

async function assertNoPendingOrActiveEnrollment(
  studentId: string,
  courseId: string,
  store: EnrollmentWriteStore,
): Promise<void> {
  const existing = await store.getPendingOrActiveEnrollment(studentId, courseId);

  if (existing) {
    throw new EnrollmentManagementError(
      "DUPLICATE_ENROLLMENT",
      "Student already has a pending or active enrollment for this course.",
    );
  }
}

async function createEnrollmentForStudentProfile(
  studentId: string,
  courseId: string,
  store: EnrollmentWriteStore,
): Promise<ManagedEnrollment> {
  return store.runInTransaction(async (tx) => {
    const course = await tx.getCourseForEnrollment(courseId);
    assertCanEnrollInCourse(course);
    await assertNoPendingOrActiveEnrollment(studentId, courseId, tx);
    await assertCourseCapacity(course, tx);

    return tx.createEnrollment({
      studentId,
      courseId,
      status: EnrollmentStatus.PENDING,
    });
  });
}

export async function checkExistingEnrollment(
  studentId: string,
  courseId: string,
  store: EnrollmentWriteStore = prismaEnrollmentWriteStore,
): Promise<ManagedEnrollment | null> {
  return store.getPendingOrActiveEnrollment(studentId, courseId);
}

export async function checkCourseCapacity(
  courseId: string,
  store: EnrollmentWriteStore = prismaEnrollmentWriteStore,
): Promise<{ capacity: number | null; usedSeats: number; hasSeat: boolean }> {
  const course = await store.getCourseForEnrollment(courseId);

  if (!course) {
    throw new EnrollmentManagementError("COURSE_NOT_FOUND", "Course not found.");
  }

  const usedSeats = await store.countPendingActiveEnrollments(courseId);

  return {
    capacity: course.capacity,
    usedSeats,
    hasSeat: course.capacity === null || usedSeats < course.capacity,
  };
}

export async function createStudentEnrollment(
  studentUserId: string,
  courseId: string,
  store: EnrollmentWriteStore = prismaEnrollmentWriteStore,
): Promise<ManagedEnrollment> {
  const student = await store.getStudentProfileByUserId(studentUserId);

  if (!student) {
    throw new EnrollmentManagementError(
      "STUDENT_PROFILE_REQUIRED",
      "Student profile is required to enroll.",
    );
  }

  return createEnrollmentForStudentProfile(student.id, courseId, store);
}

export async function createParentChildEnrollment(
  parentUserId: string,
  studentId: string,
  courseId: string,
  store: EnrollmentWriteStore = prismaEnrollmentWriteStore,
): Promise<ManagedEnrollment> {
  const parent = await store.getParentProfileByUserId(parentUserId);

  if (!parent) {
    throw new EnrollmentManagementError(
      "PARENT_PROFILE_REQUIRED",
      "Parent profile is required to enroll a child.",
    );
  }

  const isLinked = await store.hasActiveParentStudentLink(parent.id, studentId);

  if (!isLinked) {
    throw new EnrollmentManagementError(
      "PARENT_CHILD_LINK_REQUIRED",
      "Parent can enroll only active linked children.",
    );
  }

  return createEnrollmentForStudentProfile(studentId, courseId, store);
}

function assertCanCancelPending(
  enrollment: EnrollmentMutationRecord | null,
): asserts enrollment is EnrollmentMutationRecord {
  if (!enrollment) {
    throw new EnrollmentManagementError(
      "ENROLLMENT_NOT_FOUND",
      "Enrollment not found.",
    );
  }

  if (enrollment.status !== EnrollmentStatus.PENDING) {
    throw new EnrollmentManagementError(
      "ONLY_PENDING_CAN_BE_CANCELLED",
      "Only pending enrollments can be cancelled in this MVP.",
    );
  }
}

export async function cancelStudentEnrollment(
  studentUserId: string,
  enrollmentId: string,
  store: EnrollmentWriteStore = prismaEnrollmentWriteStore,
): Promise<ManagedEnrollment> {
  const [student, enrollment] = await Promise.all([
    store.getStudentProfileByUserId(studentUserId),
    store.getEnrollmentForMutation(enrollmentId),
  ]);

  if (!student) {
    throw new EnrollmentManagementError(
      "STUDENT_PROFILE_REQUIRED",
      "Student profile is required to cancel enrollment.",
    );
  }

  assertCanCancelPending(enrollment);

  if (enrollment.studentId !== student.id) {
    throw new EnrollmentManagementError(
      "FORBIDDEN",
      "Students can cancel only their own enrollments.",
    );
  }

  return store.updateEnrollmentStatus(enrollmentId, {
    status: EnrollmentStatus.CANCELLED,
    cancelledAt: new Date(),
  });
}

export async function cancelParentChildEnrollment(
  parentUserId: string,
  studentId: string,
  enrollmentId: string,
  store: EnrollmentWriteStore = prismaEnrollmentWriteStore,
): Promise<ManagedEnrollment> {
  const [parent, enrollment] = await Promise.all([
    store.getParentProfileByUserId(parentUserId),
    store.getEnrollmentForMutation(enrollmentId),
  ]);

  if (!parent) {
    throw new EnrollmentManagementError(
      "PARENT_PROFILE_REQUIRED",
      "Parent profile is required to cancel child enrollment.",
    );
  }

  assertCanCancelPending(enrollment);

  const isLinked = await store.hasActiveParentStudentLink(parent.id, studentId);

  if (!isLinked || enrollment.studentId !== studentId) {
    throw new EnrollmentManagementError(
      "FORBIDDEN",
      "Parents can cancel only pending enrollments for active linked children.",
    );
  }

  return store.updateEnrollmentStatus(enrollmentId, {
    status: EnrollmentStatus.CANCELLED,
    cancelledAt: new Date(),
  });
}

export function canTransitionEnrollmentStatus(
  from: EnrollmentStatus,
  to: EnrollmentStatus,
): boolean {
  if (from === to) {
    return true;
  }

  if (from === EnrollmentStatus.PENDING) {
    return to === EnrollmentStatus.ACTIVE || to === EnrollmentStatus.CANCELLED;
  }

  if (from === EnrollmentStatus.ACTIVE) {
    return to === EnrollmentStatus.COMPLETED || to === EnrollmentStatus.CANCELLED;
  }

  return false;
}

function buildEnrollmentStatusData(
  enrollment: EnrollmentMutationRecord,
  status: EnrollmentStatus,
): EnrollmentStatusData {
  if (!canTransitionEnrollmentStatus(enrollment.status, status)) {
    throw new EnrollmentManagementError(
      "INVALID_STATUS_TRANSITION",
      `Cannot change enrollment status from ${enrollment.status} to ${status}.`,
    );
  }

  if (status === EnrollmentStatus.ACTIVE) {
    return { status, cancelledAt: null };
  }

  if (status === EnrollmentStatus.COMPLETED) {
    return {
      status,
      completedAt: enrollment.completedAt ?? new Date(),
      cancelledAt: null,
    };
  }

  if (status === EnrollmentStatus.CANCELLED) {
    return {
      status,
      cancelledAt: enrollment.cancelledAt ?? new Date(),
    };
  }

  return { status };
}

export async function adminUpdateEnrollmentStatus(
  adminUserId: string,
  enrollmentId: string,
  status: EnrollmentStatus,
  store: EnrollmentWriteStore = prismaEnrollmentWriteStore,
): Promise<ManagedEnrollment> {
  if (!adminUserId) {
    throw new EnrollmentManagementError(
      "FORBIDDEN",
      "Admin user id is required.",
    );
  }

  const enrollment = await store.getEnrollmentForMutation(enrollmentId);

  if (!enrollment) {
    throw new EnrollmentManagementError(
      "ENROLLMENT_NOT_FOUND",
      "Enrollment not found.",
    );
  }

  return store.updateEnrollmentStatus(
    enrollmentId,
    buildEnrollmentStatusData(enrollment, status),
  );
}

const courseSummarySelect = {
  id: true,
  title: true,
  type: true,
  priceCents: true,
  capacity: true,
  totalSessions: true,
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
} satisfies Prisma.CourseSelect;

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
  parentLinks: {
    where: { isActive: true, endedAt: null },
    select: {
      relationship: true,
      parent: {
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
} satisfies Prisma.StudentProfileSelect;

const enrollmentListSelect = {
  id: true,
  status: true,
  enrolledAt: true,
  completedAt: true,
  cancelledAt: true,
  course: {
    select: courseSummarySelect,
  },
} satisfies Prisma.EnrollmentSelect;

const tutorEnrollmentSelect = {
  id: true,
  status: true,
  enrolledAt: true,
  student: {
    select: studentSummarySelect,
  },
  course: {
    select: {
      id: true,
      title: true,
      type: true,
      subject: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
} satisfies Prisma.EnrollmentSelect;

const adminEnrollmentSelect = {
  id: true,
  status: true,
  enrolledAt: true,
  completedAt: true,
  cancelledAt: true,
  student: {
    select: studentSummarySelect,
  },
  course: {
    select: courseSummarySelect,
  },
} satisfies Prisma.EnrollmentSelect;

type CourseSummaryRow = Prisma.CourseGetPayload<{
  select: typeof courseSummarySelect;
}>;

type StudentSummaryRow = Prisma.StudentProfileGetPayload<{
  select: typeof studentSummarySelect;
}>;

type EnrollmentListRow = Prisma.EnrollmentGetPayload<{
  select: typeof enrollmentListSelect;
}>;

type TutorEnrollmentRow = Prisma.EnrollmentGetPayload<{
  select: typeof tutorEnrollmentSelect;
}>;

type AdminEnrollmentRow = Prisma.EnrollmentGetPayload<{
  select: typeof adminEnrollmentSelect;
}>;

function mapCourseSummary(row: CourseSummaryRow): EnrollmentCourseSummary {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    priceCents: row.priceCents,
    maxStudents: row.capacity,
    totalSessions: row.totalSessions,
    subject: row.subject,
    tutor: {
      id: row.tutor.id,
      name: row.tutor.user.name,
      email: row.tutor.user.email,
    },
  };
}

function mapStudentSummary(row: StudentSummaryRow): EnrollmentStudentSummary {
  return {
    id: row.id,
    name: row.user.name,
    email: row.user.email,
    displayName: row.displayName,
    gradeLevel: row.gradeLevel,
  };
}

function mapParentSummaries(row: StudentSummaryRow): EnrollmentParentSummary[] {
  return row.parentLinks.map((link) => ({
    id: link.parent.id,
    name: link.parent.user.name,
    email: link.parent.user.email,
    relationship: link.relationship,
  }));
}

function mapEnrollmentListItem(row: EnrollmentListRow): EnrollmentListItem {
  return {
    id: row.id,
    status: row.status,
    enrolledAt: row.enrolledAt,
    completedAt: row.completedAt,
    cancelledAt: row.cancelledAt,
    course: mapCourseSummary(row.course),
  };
}

function mapTutorEnrollmentItem(
  row: TutorEnrollmentRow,
): TutorEnrollmentItem {
  return {
    id: row.id,
    status: row.status,
    enrolledAt: row.enrolledAt,
    student: mapStudentSummary(row.student),
    parents: mapParentSummaries(row.student),
    course: row.course,
  };
}

function mapTutorCourseEnrollmentItem(
  row: TutorEnrollmentRow,
): TutorCourseEnrollmentItem {
  return {
    id: row.id,
    status: row.status,
    enrolledAt: row.enrolledAt,
    student: mapStudentSummary(row.student),
    parents: mapParentSummaries(row.student),
  };
}

function mapAdminEnrollmentItem(row: AdminEnrollmentRow): AdminEnrollmentItem {
  return {
    id: row.id,
    status: row.status,
    enrolledAt: row.enrolledAt,
    completedAt: row.completedAt,
    cancelledAt: row.cancelledAt,
    student: mapStudentSummary(row.student),
    parents: mapParentSummaries(row.student),
    course: mapCourseSummary(row.course),
  };
}

function buildEnrollmentWhere(
  filters: EnrollmentFilters,
  base: Prisma.EnrollmentWhereInput = {},
): Prisma.EnrollmentWhereInput {
  const and: Prisma.EnrollmentWhereInput[] = [base];

  if (filters.search) {
    and.push({
      OR: [
        { course: { title: { contains: filters.search, mode: "insensitive" } } },
        { course: { subject: { name: { contains: filters.search, mode: "insensitive" } } } },
        { course: { tutor: { user: { name: { contains: filters.search, mode: "insensitive" } } } } },
        { student: { displayName: { contains: filters.search, mode: "insensitive" } } },
        { student: { user: { name: { contains: filters.search, mode: "insensitive" } } } },
        { student: { user: { email: { contains: filters.search, mode: "insensitive" } } } },
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

  if (filters.status) {
    and.push({ status: filters.status });
  }

  return { AND: and };
}

export async function getStudentEnrollments(
  studentUserId: string,
): Promise<EnrollmentListItem[]> {
  const student = await getDb().studentProfile.findUnique({
    where: { userId: studentUserId },
    select: { id: true },
  });

  if (!student) {
    return [];
  }

  const rows = await getDb().enrollment.findMany({
    where: { studentId: student.id },
    orderBy: [{ enrolledAt: "desc" }, { createdAt: "desc" }],
    select: enrollmentListSelect,
  });

  return rows.map(mapEnrollmentListItem);
}

export async function getParentChildEnrollments(
  parentUserId: string,
  studentId: string,
): Promise<EnrollmentListItem[]> {
  const parent = await getDb().parentProfile.findUnique({
    where: { userId: parentUserId },
    select: { id: true },
  });

  if (!parent) {
    return [];
  }

  const isLinked = await getDb().parentStudentLink.count({
    where: {
      parentId: parent.id,
      studentId,
      isActive: true,
      endedAt: null,
    },
  });

  if (isLinked === 0) {
    return [];
  }

  const rows = await getDb().enrollment.findMany({
    where: { studentId },
    orderBy: [{ enrolledAt: "desc" }, { createdAt: "desc" }],
    select: enrollmentListSelect,
  });

  return rows.map(mapEnrollmentListItem);
}

export async function getTutorCourseEnrollments(
  tutorUserId: string,
  courseId: string,
  filters: EnrollmentFilters = {},
): Promise<TutorCourseEnrollmentItem[]> {
  const tutor = await getDb().tutorProfile.findUnique({
    where: { userId: tutorUserId },
    select: { id: true },
  });

  if (!tutor) {
    return [];
  }

  const rows = await getDb().enrollment.findMany({
    where: buildEnrollmentWhere(filters, {
      courseId,
      course: { tutorId: tutor.id },
    }),
    orderBy: [{ enrolledAt: "desc" }, { createdAt: "desc" }],
    select: tutorEnrollmentSelect,
  });

  return rows.map(mapTutorCourseEnrollmentItem);
}

export async function getTutorEnrollments(
  tutorUserId: string,
  filters: EnrollmentFilters = {},
): Promise<TutorEnrollmentItem[]> {
  const tutor = await getDb().tutorProfile.findUnique({
    where: { userId: tutorUserId },
    select: { id: true },
  });

  if (!tutor) {
    return [];
  }

  const rows = await getDb().enrollment.findMany({
    where: buildEnrollmentWhere(filters, { course: { tutorId: tutor.id } }),
    orderBy: [{ enrolledAt: "desc" }, { createdAt: "desc" }],
    select: tutorEnrollmentSelect,
  });

  return rows.map(mapTutorEnrollmentItem);
}

export async function getAdminEnrollments(
  filters: EnrollmentFilters = {},
): Promise<AdminEnrollmentItem[]> {
  const rows = await getDb().enrollment.findMany({
    where: buildEnrollmentWhere(filters),
    orderBy: [{ enrolledAt: "desc" }, { createdAt: "desc" }],
    select: adminEnrollmentSelect,
  });

  return rows.map(mapAdminEnrollmentItem);
}

export async function getStudentCourseEnrollmentStatus(
  studentUserId: string,
  courseId: string,
): Promise<EnrollmentStatusSummary | null> {
  const student = await getDb().studentProfile.findUnique({
    where: { userId: studentUserId },
    select: {
      enrollments: {
        where: { courseId },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          enrolledAt: true,
        },
      },
    },
  });

  return student?.enrollments[0] ?? null;
}

export async function getParentEnrollmentOptions(
  parentUserId: string,
  courseId: string,
): Promise<ParentChildOption[]> {
  const links = await getDb().parentStudentLink.findMany({
    where: {
      parent: { userId: parentUserId },
      isActive: true,
      endedAt: null,
    },
    orderBy: { createdAt: "asc" },
    select: {
      student: {
        select: {
          id: true,
          displayName: true,
          gradeLevel: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          enrollments: {
            where: { courseId },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              status: true,
              enrolledAt: true,
            },
          },
        },
      },
    },
  });

  return links.map((link) => ({
    studentId: link.student.id,
    name: link.student.displayName ?? link.student.user.name,
    email: link.student.user.email,
    gradeLevel: link.student.gradeLevel,
    currentEnrollment: link.student.enrollments[0] ?? null,
  }));
}

export async function getActiveParentChildren(
  parentUserId: string,
): Promise<ParentChildOption[]> {
  const links = await getDb().parentStudentLink.findMany({
    where: {
      parent: { userId: parentUserId },
      isActive: true,
      endedAt: null,
    },
    orderBy: { createdAt: "asc" },
    select: {
      student: {
        select: {
          id: true,
          displayName: true,
          gradeLevel: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return links.map((link) => ({
    studentId: link.student.id,
    name: link.student.displayName ?? link.student.user.name,
    email: link.student.user.email,
    gradeLevel: link.student.gradeLevel,
    currentEnrollment: null,
  }));
}

export async function getParentChildSummary(
  parentUserId: string,
  studentId: string,
): Promise<ParentChildOption | null> {
  const link = await getDb().parentStudentLink.findFirst({
    where: {
      parent: { userId: parentUserId },
      studentId,
      isActive: true,
      endedAt: null,
    },
    select: {
      student: {
        select: {
          id: true,
          displayName: true,
          gradeLevel: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!link) {
    return null;
  }

  return {
    studentId: link.student.id,
    name: link.student.displayName ?? link.student.user.name,
    email: link.student.user.email,
    gradeLevel: link.student.gradeLevel,
    currentEnrollment: null,
  };
}

export async function getPublishedCourseOptions(): Promise<
  EnrollmentCourseOption[]
> {
  const courses = await getDb().course.findMany({
    where: {
      status: CourseStatus.PUBLISHED,
      tutor: { verificationStatus: TutorVerificationStatus.APPROVED },
    },
    orderBy: [{ title: "asc" }],
    select: {
      id: true,
      title: true,
      priceCents: true,
      subject: { select: { name: true } },
      tutor: { select: { user: { select: { name: true } } } },
    },
  });

  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    subjectName: course.subject.name,
    tutorName: course.tutor.user.name,
    priceCents: course.priceCents,
  }));
}

export async function getAdminEnrollmentFilterOptions(): Promise<{
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
