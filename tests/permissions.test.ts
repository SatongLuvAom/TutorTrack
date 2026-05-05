import { describe, expect, it } from "vitest";
import {
  CourseStatus,
  EnrollmentStatus,
  UserRole,
} from "../lib/generated/prisma/enums";
import { getDashboardPathForRole } from "../lib/roles";
import {
  canAccessAdminDashboard,
  canAccessParentDashboard,
  canAccessStudentDashboard,
  canAccessTutorDashboard,
  canArchiveCourse,
  canCancelEnrollment,
  canCreateParentChildEnrollment,
  canCreateStudentEnrollment,
  canEditCourse,
  canEditStudentProgress,
  canGradeSubmission,
  canManageAssignment,
  canManageAnyCourse,
  canManageEnrollmentStatus,
  canManageSession,
  canPublishCourse,
  canViewParentChild,
  canVerifyPayment,
  canViewCourse,
  canViewEnrollment,
  canViewTutorCourseEnrollments,
  canViewPayment,
  canViewStudent,
  canViewStudentProgress,
  isAdmin,
  isParent,
  isStudent,
  isTutor,
  type PermissionStore,
  type PermissionUser,
} from "../lib/permissions";

const admin: PermissionUser = {
  id: "user-admin",
  role: UserRole.ADMIN,
};

const tutorOne: PermissionUser = {
  id: "user-tutor-1",
  role: UserRole.TUTOR,
  tutorProfileId: "tutor-1",
};

const tutorTwo: PermissionUser = {
  id: "user-tutor-2",
  role: UserRole.TUTOR,
  tutorProfileId: "tutor-2",
};

const studentOne: PermissionUser = {
  id: "user-student-1",
  role: UserRole.STUDENT,
  studentProfileId: "student-1",
};

const studentTwo: PermissionUser = {
  id: "user-student-2",
  role: UserRole.STUDENT,
  studentProfileId: "student-2",
};

const parentOne: PermissionUser = {
  id: "user-parent-1",
  role: UserRole.PARENT,
  parentProfileId: "parent-1",
};

const parentTwo: PermissionUser = {
  id: "user-parent-2",
  role: UserRole.PARENT,
  parentProfileId: "parent-2",
};

const inactiveLinkedParent: PermissionUser = {
  id: "user-parent-inactive",
  role: UserRole.PARENT,
  parentProfileId: "parent-inactive",
};

function createPermissionStore(): PermissionStore {
  const courses = new Map([
    [
      "course-1",
      {
        id: "course-1",
        status: CourseStatus.DRAFT,
        tutorId: "tutor-1",
      },
    ],
    [
      "course-2",
      {
        id: "course-2",
        status: CourseStatus.DRAFT,
        tutorId: "tutor-2",
      },
    ],
    [
      "course-public",
      {
        id: "course-public",
        status: CourseStatus.PUBLISHED,
        tutorId: "tutor-2",
      },
    ],
  ]);

  const tutorStudentEnrollments = new Set(["tutor-1:student-1:course-1"]);
  const studentCourseEnrollments = new Set(["student-1:course-1"]);
  const parentStudentLinks = new Set(["parent-1:student-1"]);
  const parentCourseEnrollments = new Set(["parent-1:course-1"]);

  return {
    async getCourse(courseId) {
      return courses.get(courseId) ?? null;
    },
    async hasTutorCourse(tutorId, courseId) {
      return courses.get(courseId)?.tutorId === tutorId;
    },
    async hasTutorStudentEnrollment(tutorId, studentId, courseId) {
      if (courseId) {
        return tutorStudentEnrollments.has(`${tutorId}:${studentId}:${courseId}`);
      }

      return Array.from(tutorStudentEnrollments).some((value) =>
        value.startsWith(`${tutorId}:${studentId}:`),
      );
    },
    async hasStudentCourseEnrollment(studentId, courseId) {
      return studentCourseEnrollments.has(`${studentId}:${courseId}`);
    },
    async hasActiveParentStudentLink(parentId, studentId) {
      return parentStudentLinks.has(`${parentId}:${studentId}`);
    },
    async hasParentCourseEnrollment(parentId, courseId) {
      return parentCourseEnrollments.has(`${parentId}:${courseId}`);
    },
    async getEnrollmentAccess(enrollmentId) {
      if (enrollmentId === "enrollment-2") {
        return {
          id: "enrollment-2",
          studentId: "student-2",
          courseId: "course-2",
          tutorId: "tutor-2",
          status: EnrollmentStatus.ACTIVE,
        };
      }

      if (enrollmentId !== "enrollment-1") {
        return null;
      }

      return {
        id: "enrollment-1",
        studentId: "student-1",
        courseId: "course-1",
        tutorId: "tutor-1",
        status: EnrollmentStatus.PENDING,
      };
    },
    async getSessionAccess(sessionId) {
      if (sessionId !== "session-1") {
        return null;
      }

      return { courseId: "course-1", tutorId: "tutor-1" };
    },
    async getAssignmentAccess(assignmentId) {
      if (assignmentId !== "assignment-1") {
        return null;
      }

      return { courseId: "course-1", tutorId: "tutor-1" };
    },
    async getSubmissionAccess(submissionId) {
      if (submissionId === "submission-inconsistent") {
        return {
          studentId: "student-1",
          courseId: "course-1",
          tutorId: "tutor-1",
          isEnrollmentConsistent: false,
        };
      }

      if (submissionId !== "submission-1") {
        return null;
      }

      return {
        studentId: "student-1",
        courseId: "course-1",
        tutorId: "tutor-1",
        isEnrollmentConsistent: true,
      };
    },
    async getPaymentAccess(paymentId) {
      if (paymentId === "payment-inconsistent") {
        return {
          payerId: "other-payer",
          courseId: "course-1",
          courseTutorId: "tutor-1",
          enrollmentStudentId: "student-1",
          enrollmentCourseId: "course-2",
        };
      }

      if (paymentId !== "payment-1") {
        return null;
      }

      return {
        payerId: "user-parent-1",
        courseId: "course-1",
        courseTutorId: "tutor-1",
        enrollmentStudentId: "student-1",
        enrollmentCourseId: "course-1",
      };
    },
  };
}

describe("role helpers", () => {
  it("identifies each TutorTrack role", () => {
    expect(isAdmin(admin)).toBe(true);
    expect(isTutor(tutorOne)).toBe(true);
    expect(isStudent(studentOne)).toBe(true);
    expect(isParent(parentOne)).toBe(true);
  });

  it("maps each role to its dashboard path", () => {
    expect(getDashboardPathForRole(UserRole.ADMIN)).toBe("/dashboard/admin");
    expect(getDashboardPathForRole(UserRole.TUTOR)).toBe("/dashboard/tutor");
    expect(getDashboardPathForRole(UserRole.STUDENT)).toBe(
      "/dashboard/student",
    );
    expect(getDashboardPathForRole(UserRole.PARENT)).toBe("/dashboard/parent");
  });
});

describe("dashboard access helpers", () => {
  it("allows only the matching role for each dashboard", () => {
    expect(canAccessAdminDashboard(admin)).toBe(true);
    expect(canAccessTutorDashboard(tutorOne)).toBe(true);
    expect(canAccessStudentDashboard(studentOne)).toBe(true);
    expect(canAccessParentDashboard(parentOne)).toBe(true);
    expect(canAccessAdminDashboard(tutorOne)).toBe(false);
    expect(canAccessStudentDashboard(undefined)).toBe(false);
  });
});

describe("permission helpers", () => {
  it("allows admin access across protected resources", async () => {
    const store = createPermissionStore();

    await expect(canEditCourse(admin, "course-2", store)).resolves.toBe(true);
    await expect(canPublishCourse(admin, "course-2", store)).resolves.toBe(
      true,
    );
    await expect(canArchiveCourse(admin, "course-2", store)).resolves.toBe(
      true,
    );
    await expect(
      canManageEnrollmentStatus(admin, "enrollment-1", store),
    ).resolves.toBe(true);
    await expect(canViewPayment(admin, "payment-1", store)).resolves.toBe(true);
    expect(canManageAnyCourse(admin)).toBe(true);
    expect(canVerifyPayment(admin)).toBe(true);
  });

  it("enforces tutor course ownership", async () => {
    const store = createPermissionStore();

    await expect(canViewCourse(tutorOne, "course-1", store)).resolves.toBe(
      true,
    );
    await expect(canViewCourse(tutorOne, "course-2", store)).resolves.toBe(
      false,
    );
    await expect(canViewCourse(null, "course-public", store)).resolves.toBe(
      true,
    );
    await expect(canEditCourse(tutorOne, "course-1", store)).resolves.toBe(
      true,
    );
    await expect(canEditCourse(tutorOne, "course-2", store)).resolves.toBe(
      false,
    );
    await expect(canEditCourse(tutorTwo, "course-1", store)).resolves.toBe(
      false,
    );
    await expect(canPublishCourse(tutorOne, "course-1", store)).resolves.toBe(
      true,
    );
    await expect(canPublishCourse(tutorOne, "course-2", store)).resolves.toBe(
      false,
    );
    await expect(canArchiveCourse(tutorOne, "course-1", store)).resolves.toBe(
      true,
    );
    await expect(canArchiveCourse(tutorOne, "course-2", store)).resolves.toBe(
      false,
    );
    await expect(
      canViewTutorCourseEnrollments(tutorOne, "course-1", store),
    ).resolves.toBe(true);
    await expect(
      canViewTutorCourseEnrollments(tutorOne, "course-2", store),
    ).resolves.toBe(false);
    expect(canManageAnyCourse(tutorOne)).toBe(false);
  });

  it("allows tutors to access enrolled students only for their own courses", async () => {
    const store = createPermissionStore();

    await expect(canViewStudent(tutorOne, "student-1", store)).resolves.toBe(
      true,
    );
    await expect(canViewStudent(tutorOne, "student-2", store)).resolves.toBe(
      false,
    );
    await expect(
      canEditStudentProgress(tutorOne, "student-1", "course-1", store),
    ).resolves.toBe(true);
    await expect(
      canEditStudentProgress(tutorOne, "student-1", "course-2", store),
    ).resolves.toBe(false);
  });

  it("allows tutors to manage sessions, assignments, and grading for own courses", async () => {
    const store = createPermissionStore();

    await expect(canManageSession(tutorOne, "session-1", store)).resolves.toBe(
      true,
    );
    await expect(
      canManageAssignment(tutorOne, "assignment-1", store),
    ).resolves.toBe(true);
    await expect(
      canGradeSubmission(tutorOne, "submission-1", store),
    ).resolves.toBe(true);
    await expect(
      canGradeSubmission(tutorOne, "submission-inconsistent", store),
    ).resolves.toBe(false);
    await expect(canManageSession(tutorTwo, "session-1", store)).resolves.toBe(
      false,
    );
  });

  it("allows students to access only their own data", async () => {
    const store = createPermissionStore();

    await expect(canViewStudent(studentOne, "student-1", store)).resolves.toBe(
      true,
    );
    await expect(canViewStudent(studentOne, "student-2", store)).resolves.toBe(
      false,
    );
    await expect(
      canViewStudentProgress(studentOne, "student-2", "course-1", store),
    ).resolves.toBe(false);
    await expect(
      canViewEnrollment(studentOne, "enrollment-1", store),
    ).resolves.toBe(true);
    await expect(
      canCreateStudentEnrollment(studentOne, "course-public", store),
    ).resolves.toBe(true);
    await expect(
      canCreateStudentEnrollment(studentOne, "course-1", store),
    ).resolves.toBe(false);
    await expect(
      canCancelEnrollment(studentOne, "enrollment-1", store),
    ).resolves.toBe(true);
    await expect(
      canCancelEnrollment(studentTwo, "enrollment-1", store),
    ).resolves.toBe(false);
    await expect(canViewPayment(studentOne, "payment-1", store)).resolves.toBe(
      true,
    );
    await expect(canViewStudent(studentTwo, "student-1", store)).resolves.toBe(
      false,
    );
    await expect(canEditCourse(studentOne, "course-1", store)).resolves.toBe(
      false,
    );
    await expect(canPublishCourse(studentOne, "course-1", store)).resolves.toBe(
      false,
    );
    await expect(canArchiveCourse(studentOne, "course-1", store)).resolves.toBe(
      false,
    );
    expect(canManageAnyCourse(studentOne)).toBe(false);
  });

  it("allows parents through active ParentStudentLink records", async () => {
    const store = createPermissionStore();

    await expect(canViewStudent(parentOne, "student-1", store)).resolves.toBe(
      true,
    );
    await expect(
      canViewStudentProgress(parentOne, "student-1", "course-1", store),
    ).resolves.toBe(true);
    await expect(
      canViewStudentProgress(parentOne, "student-1", "course-2", store),
    ).resolves.toBe(false);
    await expect(
      canViewEnrollment(parentOne, "enrollment-1", store),
    ).resolves.toBe(true);
    await expect(canViewParentChild(parentOne, "student-1", store)).resolves.toBe(
      true,
    );
    await expect(
      canCreateParentChildEnrollment(
        parentOne,
        "student-1",
        "course-public",
        store,
      ),
    ).resolves.toBe(true);
    await expect(
      canCreateParentChildEnrollment(parentOne, "student-2", "course-public", store),
    ).resolves.toBe(false);
    await expect(
      canCancelEnrollment(parentOne, "enrollment-1", store),
    ).resolves.toBe(true);
    await expect(canViewPayment(parentOne, "payment-1", store)).resolves.toBe(
      true,
    );
    await expect(
      canViewPayment(parentOne, "payment-inconsistent", store),
    ).resolves.toBe(false);
    await expect(
      canViewStudent(inactiveLinkedParent, "student-1", store),
    ).resolves.toBe(false);
    await expect(
      canViewStudentProgress(
        inactiveLinkedParent,
        "student-1",
        "course-1",
        store,
      ),
    ).resolves.toBe(false);
  });

  it("blocks parents from unrelated student records", async () => {
    const store = createPermissionStore();

    await expect(canViewStudent(parentOne, "student-2", store)).resolves.toBe(
      false,
    );
    await expect(canViewStudent(parentTwo, "student-1", store)).resolves.toBe(
      false,
    );
    await expect(
      canViewStudentProgress(parentTwo, "student-1", "course-1", store),
    ).resolves.toBe(false);
    await expect(canEditCourse(parentOne, "course-1", store)).resolves.toBe(
      false,
    );
    await expect(canPublishCourse(parentOne, "course-1", store)).resolves.toBe(
      false,
    );
    await expect(canArchiveCourse(parentOne, "course-1", store)).resolves.toBe(
      false,
    );
    expect(canManageAnyCourse(parentOne)).toBe(false);
  });

  it("blocks unauthenticated access in permission helpers", async () => {
    const store = createPermissionStore();

    await expect(canViewStudent(null, "student-1", store)).resolves.toBe(false);
    await expect(canEditCourse(undefined, "course-1", store)).resolves.toBe(
      false,
    );
    expect(canVerifyPayment(null)).toBe(false);
  });
});
