import {
  CourseStatus,
  EnrollmentStatus,
  UserRole,
  type UserRole as UserRoleType,
} from "./generated/prisma/enums";
import { getDb } from "./db";

export type PermissionUser = {
  id: string;
  role: UserRoleType;
  studentProfileId?: string | null;
  parentProfileId?: string | null;
  tutorProfileId?: string | null;
};

type CourseAccess = {
  id: string;
  status: CourseStatus;
  tutorId: string;
};

type EnrollmentAccess = {
  id: string;
  studentId: string;
  courseId: string;
  tutorId: string;
  status: EnrollmentStatus;
};

type CourseOwnerAccess = {
  courseId: string;
  tutorId: string;
};

type SubmissionAccess = {
  studentId: string;
  courseId: string;
  tutorId: string;
  isEnrollmentConsistent: boolean;
};

type PaymentAccess = {
  payerId: string;
  courseId: string;
  courseTutorId: string;
  enrollmentStudentId: string | null;
  enrollmentCourseId: string | null;
};

export type PermissionStore = {
  getCourse(courseId: string): Promise<CourseAccess | null>;
  hasTutorCourse(tutorId: string, courseId: string): Promise<boolean>;
  hasTutorStudentEnrollment(
    tutorId: string,
    studentId: string,
    courseId?: string,
  ): Promise<boolean>;
  hasStudentCourseEnrollment(
    studentId: string,
    courseId: string,
  ): Promise<boolean>;
  hasActiveParentStudentLink(
    parentId: string,
    studentId: string,
  ): Promise<boolean>;
  hasParentCourseEnrollment(
    parentId: string,
    courseId: string,
  ): Promise<boolean>;
  getEnrollmentAccess(enrollmentId: string): Promise<EnrollmentAccess | null>;
  getSessionAccess(sessionId: string): Promise<CourseOwnerAccess | null>;
  getAssignmentAccess(assignmentId: string): Promise<CourseOwnerAccess | null>;
  getSubmissionAccess(submissionId: string): Promise<SubmissionAccess | null>;
  getPaymentAccess(paymentId: string): Promise<PaymentAccess | null>;
};

const visibleEnrollmentStatuses = [
  EnrollmentStatus.ACTIVE,
  EnrollmentStatus.COMPLETED,
] as const;

export const prismaPermissionStore: PermissionStore = {
  async getCourse(courseId) {
    return getDb().course.findUnique({
      where: { id: courseId },
      select: { id: true, status: true, tutorId: true },
    });
  },

  async hasTutorCourse(tutorId, courseId) {
    const count = await getDb().course.count({
      where: { id: courseId, tutorId },
    });

    return count > 0;
  },

  async hasTutorStudentEnrollment(tutorId, studentId, courseId) {
    const count = await getDb().enrollment.count({
      where: {
        studentId,
        ...(courseId ? { courseId } : {}),
        status: { in: [...visibleEnrollmentStatuses] },
        course: { tutorId },
      },
    });

    return count > 0;
  },

  async hasStudentCourseEnrollment(studentId, courseId) {
    const count = await getDb().enrollment.count({
      where: {
        studentId,
        courseId,
        status: { in: [...visibleEnrollmentStatuses] },
      },
    });

    return count > 0;
  },

  async hasActiveParentStudentLink(parentId, studentId) {
    const count = await getDb().parentStudentLink.count({
      where: { parentId, studentId, isActive: true, endedAt: null },
    });

    return count > 0;
  },

  async hasParentCourseEnrollment(parentId, courseId) {
    const count = await getDb().enrollment.count({
      where: {
        courseId,
        status: { in: [...visibleEnrollmentStatuses] },
        student: {
          parentLinks: {
            some: {
              parentId,
              isActive: true,
              endedAt: null,
            },
          },
        },
      },
    });

    return count > 0;
  },

  async getEnrollmentAccess(enrollmentId) {
    const enrollment = await getDb().enrollment.findUnique({
      where: { id: enrollmentId },
      select: {
        id: true,
        studentId: true,
        courseId: true,
        status: true,
        course: { select: { tutorId: true } },
      },
    });

    if (!enrollment) {
      return null;
    }

    return {
      id: enrollment.id,
      studentId: enrollment.studentId,
      courseId: enrollment.courseId,
      tutorId: enrollment.course.tutorId,
      status: enrollment.status,
    };
  },

  async getSessionAccess(sessionId) {
    const session = await getDb().lessonSession.findUnique({
      where: { id: sessionId },
      select: {
        courseId: true,
        course: { select: { tutorId: true } },
      },
    });

    if (!session) {
      return null;
    }

    return {
      courseId: session.courseId,
      tutorId: session.course.tutorId,
    };
  },

  async getAssignmentAccess(assignmentId) {
    const assignment = await getDb().assignment.findUnique({
      where: { id: assignmentId },
      select: {
        courseId: true,
        course: { select: { tutorId: true } },
      },
    });

    if (!assignment) {
      return null;
    }

    return {
      courseId: assignment.courseId,
      tutorId: assignment.course.tutorId,
    };
  },

  async getSubmissionAccess(submissionId) {
    const submission = await getDb().submission.findUnique({
      where: { id: submissionId },
      select: {
        studentId: true,
        enrollment: { select: { studentId: true, courseId: true } },
        assignment: {
          select: {
            courseId: true,
            course: { select: { tutorId: true } },
          },
        },
      },
    });

    if (!submission) {
      return null;
    }

    return {
      studentId: submission.studentId,
      courseId: submission.assignment.courseId,
      tutorId: submission.assignment.course.tutorId,
      isEnrollmentConsistent:
        submission.enrollment.studentId === submission.studentId &&
        submission.enrollment.courseId === submission.assignment.courseId,
    };
  },

  async getPaymentAccess(paymentId) {
    const payment = await getDb().payment.findUnique({
      where: { id: paymentId },
      select: {
        payerId: true,
        courseId: true,
        course: { select: { tutorId: true } },
        enrollment: { select: { studentId: true, courseId: true } },
      },
    });

    if (!payment) {
      return null;
    }

    return {
      payerId: payment.payerId,
      courseId: payment.courseId,
      courseTutorId: payment.course.tutorId,
      enrollmentStudentId: payment.enrollment?.studentId ?? null,
      enrollmentCourseId: payment.enrollment?.courseId ?? null,
    };
  },
};

function hasTutorProfile(user: PermissionUser): user is PermissionUser & {
  tutorProfileId: string;
} {
  return Boolean(user.tutorProfileId);
}

function hasStudentProfile(user: PermissionUser): user is PermissionUser & {
  studentProfileId: string;
} {
  return Boolean(user.studentProfileId);
}

function hasParentProfile(user: PermissionUser): user is PermissionUser & {
  parentProfileId: string;
} {
  return Boolean(user.parentProfileId);
}

export function isAdmin(
  user: PermissionUser | null | undefined,
): user is PermissionUser & { role: typeof UserRole.ADMIN } {
  return user?.role === UserRole.ADMIN;
}

export function isTutor(
  user: PermissionUser | null | undefined,
): user is PermissionUser & { role: typeof UserRole.TUTOR } {
  return user?.role === UserRole.TUTOR;
}

export function isStudent(
  user: PermissionUser | null | undefined,
): user is PermissionUser & { role: typeof UserRole.STUDENT } {
  return user?.role === UserRole.STUDENT;
}

export function isParent(
  user: PermissionUser | null | undefined,
): user is PermissionUser & { role: typeof UserRole.PARENT } {
  return user?.role === UserRole.PARENT;
}

export function canAccessAdminDashboard(
  user: PermissionUser | null | undefined,
): boolean {
  return isAdmin(user);
}

export function canAccessTutorDashboard(
  user: PermissionUser | null | undefined,
): boolean {
  return isTutor(user);
}

export function canAccessStudentDashboard(
  user: PermissionUser | null | undefined,
): boolean {
  return isStudent(user);
}

export function canAccessParentDashboard(
  user: PermissionUser | null | undefined,
): boolean {
  return isParent(user);
}

export async function canViewStudent(
  user: PermissionUser | null | undefined,
  studentId: string,
  store: PermissionStore = prismaPermissionStore,
): Promise<boolean> {
  if (!user) {
    return false;
  }

  if (isAdmin(user)) {
    return true;
  }

  if (isStudent(user) && hasStudentProfile(user)) {
    return user.studentProfileId === studentId;
  }

  if (isParent(user) && hasParentProfile(user)) {
    return store.hasActiveParentStudentLink(user.parentProfileId, studentId);
  }

  if (isTutor(user) && hasTutorProfile(user)) {
    return store.hasTutorStudentEnrollment(user.tutorProfileId, studentId);
  }

  return false;
}

export async function canViewStudentProgress(
  user: PermissionUser | null | undefined,
  studentId: string,
  courseId?: string,
  store: PermissionStore = prismaPermissionStore,
): Promise<boolean> {
  if (!user) {
    return false;
  }

  if (isAdmin(user)) {
    return true;
  }

  if (isStudent(user) && hasStudentProfile(user)) {
    if (user.studentProfileId !== studentId) {
      return false;
    }

    return courseId
      ? store.hasStudentCourseEnrollment(studentId, courseId)
      : true;
  }

  if (isParent(user) && hasParentProfile(user)) {
    const canViewLinkedStudent = await store.hasActiveParentStudentLink(
      user.parentProfileId,
      studentId,
    );

    if (!canViewLinkedStudent) {
      return false;
    }

    return courseId
      ? store.hasStudentCourseEnrollment(studentId, courseId)
      : true;
  }

  if (isTutor(user) && hasTutorProfile(user)) {
    return store.hasTutorStudentEnrollment(
      user.tutorProfileId,
      studentId,
      courseId,
    );
  }

  return false;
}

export async function canEditStudentProgress(
  user: PermissionUser | null | undefined,
  studentId: string,
  courseId: string,
  store: PermissionStore = prismaPermissionStore,
): Promise<boolean> {
  if (!user) {
    return false;
  }

  if (isAdmin(user)) {
    return true;
  }

  if (!isTutor(user) || !hasTutorProfile(user)) {
    return false;
  }

  return store.hasTutorStudentEnrollment(
    user.tutorProfileId,
    studentId,
    courseId,
  );
}

export async function canViewCourse(
  user: PermissionUser | null | undefined,
  courseId: string,
  store: PermissionStore = prismaPermissionStore,
): Promise<boolean> {
  const course = await store.getCourse(courseId);

  if (!course) {
    return false;
  }

  if (course.status === CourseStatus.PUBLISHED || isAdmin(user)) {
    return true;
  }

  if (!user) {
    return false;
  }

  if (isTutor(user) && hasTutorProfile(user)) {
    return course.tutorId === user.tutorProfileId;
  }

  if (isStudent(user) && hasStudentProfile(user)) {
    return store.hasStudentCourseEnrollment(user.studentProfileId, courseId);
  }

  if (isParent(user) && hasParentProfile(user)) {
    return store.hasParentCourseEnrollment(user.parentProfileId, courseId);
  }

  return false;
}

export async function canEditCourse(
  user: PermissionUser | null | undefined,
  courseId: string,
  store: PermissionStore = prismaPermissionStore,
): Promise<boolean> {
  if (!user) {
    return false;
  }

  if (isAdmin(user)) {
    return true;
  }

  if (!isTutor(user) || !hasTutorProfile(user)) {
    return false;
  }

  return store.hasTutorCourse(user.tutorProfileId, courseId);
}

export function canManageAnyCourse(
  user: PermissionUser | null | undefined,
): boolean {
  return isAdmin(user);
}

export function canPublishCourse(
  user: PermissionUser | null | undefined,
  courseId: string,
  store: PermissionStore = prismaPermissionStore,
): Promise<boolean> {
  return canEditCourse(user, courseId, store);
}

export function canArchiveCourse(
  user: PermissionUser | null | undefined,
  courseId: string,
  store: PermissionStore = prismaPermissionStore,
): Promise<boolean> {
  return canEditCourse(user, courseId, store);
}

export function canManageTutor(
  user: PermissionUser | null | undefined,
  tutorId: string,
): boolean {
  if (!user) {
    return false;
  }

  return isAdmin(user) || (isTutor(user) && user.tutorProfileId === tutorId);
}

export async function canViewEnrollment(
  user: PermissionUser | null | undefined,
  enrollmentId: string,
  store: PermissionStore = prismaPermissionStore,
): Promise<boolean> {
  if (!user) {
    return false;
  }

  if (isAdmin(user)) {
    return true;
  }

  const enrollment = await store.getEnrollmentAccess(enrollmentId);
  if (!enrollment) {
    return false;
  }

  if (isTutor(user) && hasTutorProfile(user)) {
    return enrollment.tutorId === user.tutorProfileId;
  }

  if (isStudent(user) && hasStudentProfile(user)) {
    return enrollment.studentId === user.studentProfileId;
  }

  if (isParent(user) && hasParentProfile(user)) {
    return store.hasActiveParentStudentLink(
      user.parentProfileId,
      enrollment.studentId,
    );
  }

  return false;
}

export async function canCreateStudentEnrollment(
  user: PermissionUser | null | undefined,
  courseId: string,
  store: PermissionStore = prismaPermissionStore,
): Promise<boolean> {
  if (!isStudent(user) || !hasStudentProfile(user)) {
    return false;
  }

  const course = await store.getCourse(courseId);

  return course?.status === CourseStatus.PUBLISHED;
}

export async function canCreateParentChildEnrollment(
  user: PermissionUser | null | undefined,
  studentId: string,
  courseId: string,
  store: PermissionStore = prismaPermissionStore,
): Promise<boolean> {
  if (!isParent(user) || !hasParentProfile(user)) {
    return false;
  }

  const [course, hasActiveLink] = await Promise.all([
    store.getCourse(courseId),
    store.hasActiveParentStudentLink(user.parentProfileId, studentId),
  ]);

  return hasActiveLink && course?.status === CourseStatus.PUBLISHED;
}

export async function canCancelEnrollment(
  user: PermissionUser | null | undefined,
  enrollmentId: string,
  store: PermissionStore = prismaPermissionStore,
): Promise<boolean> {
  if (!user) {
    return false;
  }

  const enrollment = await store.getEnrollmentAccess(enrollmentId);

  if (!enrollment) {
    return false;
  }

  if (isAdmin(user)) {
    return true;
  }

  if (enrollment.status !== EnrollmentStatus.PENDING) {
    return false;
  }

  if (isStudent(user) && hasStudentProfile(user)) {
    return enrollment.studentId === user.studentProfileId;
  }

  if (isParent(user) && hasParentProfile(user)) {
    return store.hasActiveParentStudentLink(
      user.parentProfileId,
      enrollment.studentId,
    );
  }

  return false;
}

export async function canViewTutorCourseEnrollments(
  user: PermissionUser | null | undefined,
  courseId: string,
  store: PermissionStore = prismaPermissionStore,
): Promise<boolean> {
  if (!user) {
    return false;
  }

  if (isAdmin(user)) {
    return true;
  }

  if (!isTutor(user) || !hasTutorProfile(user)) {
    return false;
  }

  return store.hasTutorCourse(user.tutorProfileId, courseId);
}

export async function canManageEnrollmentStatus(
  user: PermissionUser | null | undefined,
  enrollmentId: string,
  store: PermissionStore = prismaPermissionStore,
): Promise<boolean> {
  if (!isAdmin(user)) {
    return false;
  }

  const enrollment = await store.getEnrollmentAccess(enrollmentId);

  return Boolean(enrollment);
}

export async function canViewParentChild(
  user: PermissionUser | null | undefined,
  studentId: string,
  store: PermissionStore = prismaPermissionStore,
): Promise<boolean> {
  if (!user) {
    return false;
  }

  if (isAdmin(user)) {
    return true;
  }

  if (!isParent(user) || !hasParentProfile(user)) {
    return false;
  }

  return store.hasActiveParentStudentLink(user.parentProfileId, studentId);
}

export async function canManageSession(
  user: PermissionUser | null | undefined,
  sessionId: string,
  store: PermissionStore = prismaPermissionStore,
): Promise<boolean> {
  if (!user) {
    return false;
  }

  if (isAdmin(user)) {
    return true;
  }

  if (!isTutor(user) || !hasTutorProfile(user)) {
    return false;
  }

  const session = await store.getSessionAccess(sessionId);
  return session?.tutorId === user.tutorProfileId;
}

export async function canManageAssignment(
  user: PermissionUser | null | undefined,
  assignmentId: string,
  store: PermissionStore = prismaPermissionStore,
): Promise<boolean> {
  if (!user) {
    return false;
  }

  if (isAdmin(user)) {
    return true;
  }

  if (!isTutor(user) || !hasTutorProfile(user)) {
    return false;
  }

  const assignment = await store.getAssignmentAccess(assignmentId);
  return assignment?.tutorId === user.tutorProfileId;
}

export async function canGradeSubmission(
  user: PermissionUser | null | undefined,
  submissionId: string,
  store: PermissionStore = prismaPermissionStore,
): Promise<boolean> {
  if (!user) {
    return false;
  }

  if (isAdmin(user)) {
    return true;
  }

  if (!isTutor(user) || !hasTutorProfile(user)) {
    return false;
  }

  const submission = await store.getSubmissionAccess(submissionId);
  return (
    submission?.tutorId === user.tutorProfileId &&
    submission.isEnrollmentConsistent
  );
}

export async function canViewPayment(
  user: PermissionUser | null | undefined,
  paymentId: string,
  store: PermissionStore = prismaPermissionStore,
): Promise<boolean> {
  if (!user) {
    return false;
  }

  if (isAdmin(user)) {
    return true;
  }

  const payment = await store.getPaymentAccess(paymentId);
  if (!payment) {
    return false;
  }

  const paymentEnrollmentMatchesCourse =
    !payment.enrollmentCourseId || payment.enrollmentCourseId === payment.courseId;

  if (payment.payerId === user.id) {
    return true;
  }

  if (isTutor(user) && hasTutorProfile(user)) {
    return (
      paymentEnrollmentMatchesCourse &&
      payment.courseTutorId === user.tutorProfileId
    );
  }

  if (isStudent(user) && hasStudentProfile(user)) {
    return (
      paymentEnrollmentMatchesCourse &&
      payment.enrollmentStudentId === user.studentProfileId
    );
  }

  if (
    isParent(user) &&
    hasParentProfile(user) &&
    payment.enrollmentStudentId
  ) {
    if (!paymentEnrollmentMatchesCourse) {
      return false;
    }

    return store.hasActiveParentStudentLink(
      user.parentProfileId,
      payment.enrollmentStudentId,
    );
  }

  return false;
}

export function canVerifyPayment(
  user: PermissionUser | null | undefined,
): boolean {
  return isAdmin(user);
}
