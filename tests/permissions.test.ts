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
  canCancelSession,
  canCreateAssignment,
  canCreateAssessment,
  canCreateProgressNote,
  canCompleteSession,
  canEditAssessment,
  canCreateParentChildEnrollment,
  canCreateStudentEnrollment,
  canCreateSession,
  canEditAssignment,
  canEditCourse,
  canEditSession,
  canEditStudentSkillProgress,
  canEditSubmission,
  canEditStudentProgress,
  canGradeSubmission,
  canMarkAttendance,
  canManageAssignment,
  canManageAnyCourse,
  canManageEnrollmentStatus,
  canManageSkillProgress,
  canManageSession,
  canPublishCourse,
  canSubmitAssignment,
  canRecordAssessmentScore,
  canViewAssignment,
  canViewAssignmentSubmissions,
  canViewAssessment,
  canViewSession,
  canViewSessionAttendance,
  canViewSubmission,
  canViewCourseSkillProgress,
  canViewParentChild,
  canVerifyPayment,
  canViewProgressReport,
  canViewCourse,
  canViewEnrollment,
  canViewTutorCourseEnrollments,
  canViewPayment,
  canViewStudent,
  canViewStudentAttendance,
  canViewStudentAssessments,
  canViewStudentAssignments,
  canViewStudentSkillProgress,
  canViewStudentProgress,
  canViewStudentSchedule,
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
  const tutorActiveStudentEnrollments = new Set(["tutor-1:student-1:course-1"]);
  const studentCourseEnrollments = new Set(["student-1:course-1"]);
  const studentActiveCourseEnrollments = new Set(["student-1:course-1"]);
  const parentStudentLinks = new Set(["parent-1:student-1"]);
  const parentCourseEnrollments = new Set(["parent-1:course-1"]);
  const parentActiveCourseEnrollments = new Set(["parent-1:course-1"]);

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
    async hasTutorActiveStudentEnrollment(tutorId, studentId, courseId) {
      if (courseId) {
        return tutorActiveStudentEnrollments.has(
          `${tutorId}:${studentId}:${courseId}`,
        );
      }

      return Array.from(tutorActiveStudentEnrollments).some((value) =>
        value.startsWith(`${tutorId}:${studentId}:`),
      );
    },
    async hasStudentCourseEnrollment(studentId, courseId) {
      return studentCourseEnrollments.has(`${studentId}:${courseId}`);
    },
    async hasStudentActiveCourseEnrollment(studentId, courseId) {
      return studentActiveCourseEnrollments.has(`${studentId}:${courseId}`);
    },
    async hasActiveParentStudentLink(parentId, studentId) {
      return parentStudentLinks.has(`${parentId}:${studentId}`);
    },
    async hasParentCourseEnrollment(parentId, courseId) {
      return parentCourseEnrollments.has(`${parentId}:${courseId}`);
    },
    async hasParentActiveCourseEnrollment(parentId, courseId) {
      return parentActiveCourseEnrollments.has(`${parentId}:${courseId}`);
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
    async getAssessmentAccess(assessmentId) {
      if (assessmentId === "assessment-inactive") {
        return {
          studentId: "student-1",
          courseId: "course-1",
          tutorId: "tutor-1",
          isEnrollmentConsistent: true,
          isActiveEnrollment: false,
        };
      }

      if (assessmentId !== "assessment-1") {
        return null;
      }

      return {
        studentId: "student-1",
        courseId: "course-1",
        tutorId: "tutor-1",
        isEnrollmentConsistent: true,
        isActiveEnrollment: true,
      };
    },
    async getSkillAccess(skillId) {
      if (skillId !== "skill-1") {
        return null;
      }

      return { courseId: "course-1", tutorId: "tutor-1" };
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
    await expect(canCreateSession(admin, "course-public", store)).resolves.toBe(
      true,
    );
    await expect(canEditSession(admin, "session-1", store)).resolves.toBe(true);
    await expect(
      canViewSessionAttendance(admin, "session-1", store),
    ).resolves.toBe(true);
    await expect(canViewPayment(admin, "payment-1", store)).resolves.toBe(true);
    await expect(canViewAssessment(admin, "assessment-1", store)).resolves.toBe(
      true,
    );
    await expect(
      canViewCourseSkillProgress(admin, "course-1", store),
    ).resolves.toBe(true);
    await expect(
      canViewProgressReport(admin, "student-1", "course-1", store),
    ).resolves.toBe(true);
    await expect(
      canCreateProgressNote(admin, "student-1", "course-1", store),
    ).resolves.toBe(true);
    await expect(
      canCreateProgressNote(admin, "student-2", "course-1", store),
    ).resolves.toBe(false);
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
    await expect(
      canCreateSession(tutorTwo, "course-public", store),
    ).resolves.toBe(true);
    await expect(
      canCreateSession(tutorOne, "course-public", store),
    ).resolves.toBe(false);
    await expect(canCreateSession(tutorOne, "course-1", store)).resolves.toBe(
      false,
    );
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
    await expect(
      canEditStudentSkillProgress(tutorOne, "student-1", "course-1", store),
    ).resolves.toBe(true);
    await expect(
      canEditStudentSkillProgress(tutorOne, "student-1", "course-2", store),
    ).resolves.toBe(false);
    await expect(
      canViewProgressReport(tutorOne, "student-1", "course-1", store),
    ).resolves.toBe(true);
    await expect(
      canViewProgressReport(tutorOne, "student-1", "course-2", store),
    ).resolves.toBe(false);
    await expect(
      canCreateProgressNote(tutorOne, "student-1", "course-1", store),
    ).resolves.toBe(true);
    await expect(
      canCreateProgressNote(tutorOne, "student-1", "course-2", store),
    ).resolves.toBe(false);
  });

  it("allows tutors to manage sessions, assignments, and grading for own courses", async () => {
    const store = createPermissionStore();

    await expect(canManageSession(tutorOne, "session-1", store)).resolves.toBe(
      true,
    );
    await expect(canViewSession(tutorOne, "session-1", store)).resolves.toBe(
      true,
    );
    await expect(canEditSession(tutorOne, "session-1", store)).resolves.toBe(
      true,
    );
    await expect(canCancelSession(tutorOne, "session-1", store)).resolves.toBe(
      true,
    );
    await expect(canCompleteSession(tutorOne, "session-1", store)).resolves.toBe(
      true,
    );
    await expect(
      canViewSessionAttendance(tutorOne, "session-1", store),
    ).resolves.toBe(true);
    await expect(canMarkAttendance(tutorOne, "session-1", store)).resolves.toBe(
      true,
    );
    await expect(
      canManageAssignment(tutorOne, "assignment-1", store),
    ).resolves.toBe(true);
    await expect(
      canCreateAssignment(tutorOne, "course-1", store),
    ).resolves.toBe(true);
    await expect(
      canCreateAssignment(tutorOne, "course-2", store),
    ).resolves.toBe(false);
    await expect(
      canEditAssignment(tutorOne, "assignment-1", store),
    ).resolves.toBe(true);
    await expect(
      canEditAssignment(tutorTwo, "assignment-1", store),
    ).resolves.toBe(false);
    await expect(
      canViewAssignmentSubmissions(tutorOne, "assignment-1", store),
    ).resolves.toBe(true);
    await expect(
      canViewAssignmentSubmissions(tutorTwo, "assignment-1", store),
    ).resolves.toBe(false);
    await expect(
      canGradeSubmission(tutorOne, "submission-1", store),
    ).resolves.toBe(true);
    await expect(
      canGradeSubmission(tutorOne, "submission-inconsistent", store),
    ).resolves.toBe(false);
    await expect(
      canCreateAssessment(tutorOne, "course-1", store),
    ).resolves.toBe(true);
    await expect(
      canCreateAssessment(tutorOne, "course-2", store),
    ).resolves.toBe(false);
    await expect(
      canEditAssessment(tutorOne, "assessment-1", store),
    ).resolves.toBe(true);
    await expect(
      canRecordAssessmentScore(tutorOne, "assessment-1", store),
    ).resolves.toBe(true);
    await expect(
      canEditAssessment(tutorTwo, "assessment-1", store),
    ).resolves.toBe(false);
    await expect(
      canManageSkillProgress(tutorOne, "course-1", store),
    ).resolves.toBe(true);
    await expect(
      canManageSkillProgress(tutorTwo, "course-1", store),
    ).resolves.toBe(false);
    await expect(canManageSession(tutorTwo, "session-1", store)).resolves.toBe(
      false,
    );
    await expect(canMarkAttendance(tutorTwo, "session-1", store)).resolves.toBe(
      false,
    );
    await expect(
      canViewSessionAttendance(tutorTwo, "session-1", store),
    ).resolves.toBe(false);
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
    await expect(canViewSession(studentOne, "session-1", store)).resolves.toBe(
      true,
    );
    await expect(
      canViewStudentSchedule(studentOne, "student-1", store),
    ).resolves.toBe(true);
    await expect(
      canViewStudentSchedule(studentOne, "student-2", store),
    ).resolves.toBe(false);
    await expect(
      canViewStudentAttendance(studentOne, "student-1", store),
    ).resolves.toBe(true);
    await expect(canMarkAttendance(studentOne, "session-1", store)).resolves.toBe(
      false,
    );
    await expect(
      canCreateStudentEnrollment(studentOne, "course-public", store),
    ).resolves.toBe(true);
    await expect(
      canViewAssignment(studentOne, "assignment-1", store),
    ).resolves.toBe(true);
    await expect(
      canSubmitAssignment(studentOne, "assignment-1", store),
    ).resolves.toBe(true);
    await expect(
      canSubmitAssignment(studentTwo, "assignment-1", store),
    ).resolves.toBe(false);
    await expect(
      canViewSubmission(studentOne, "submission-1", store),
    ).resolves.toBe(true);
    await expect(
      canViewSubmission(studentTwo, "submission-1", store),
    ).resolves.toBe(false);
    await expect(
      canEditSubmission(studentOne, "submission-1", store),
    ).resolves.toBe(true);
    await expect(
      canEditSubmission(studentTwo, "submission-1", store),
    ).resolves.toBe(false);
    await expect(
      canViewStudentAssignments(studentOne, "student-1", store),
    ).resolves.toBe(true);
    await expect(
      canViewStudentAssessments(studentOne, "student-1", store),
    ).resolves.toBe(true);
    await expect(
      canViewStudentSkillProgress(studentOne, "student-1", "course-1", store),
    ).resolves.toBe(true);
    await expect(
      canViewProgressReport(studentOne, "student-1", "course-1", store),
    ).resolves.toBe(true);
    await expect(
      canViewProgressReport(studentOne, "student-2", "course-1", store),
    ).resolves.toBe(false);
    await expect(
      canCreateProgressNote(studentOne, "student-1", "course-1", store),
    ).resolves.toBe(false);
    await expect(
      canViewAssessment(studentOne, "assessment-1", store),
    ).resolves.toBe(true);
    await expect(
      canViewAssessment(studentTwo, "assessment-1", store),
    ).resolves.toBe(false);
    await expect(
      canViewStudentAssignments(studentOne, "student-2", store),
    ).resolves.toBe(false);
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
    await expect(canViewSession(parentOne, "session-1", store)).resolves.toBe(
      true,
    );
    await expect(
      canViewAssignment(parentOne, "assignment-1", store),
    ).resolves.toBe(true);
    await expect(
      canViewAssignment(parentTwo, "assignment-1", store),
    ).resolves.toBe(false);
    await expect(
      canViewSubmission(parentOne, "submission-1", store),
    ).resolves.toBe(true);
    await expect(
      canViewSubmission(parentTwo, "submission-1", store),
    ).resolves.toBe(false);
    await expect(
      canViewStudentAssignments(parentOne, "student-1", store),
    ).resolves.toBe(true);
    await expect(
      canViewStudentAssessments(parentOne, "student-1", store),
    ).resolves.toBe(true);
    await expect(
      canViewStudentSkillProgress(parentOne, "student-1", "course-1", store),
    ).resolves.toBe(true);
    await expect(
      canViewProgressReport(parentOne, "student-1", "course-1", store),
    ).resolves.toBe(true);
    await expect(
      canCreateProgressNote(parentOne, "student-1", "course-1", store),
    ).resolves.toBe(false);
    await expect(
      canViewAssessment(parentOne, "assessment-1", store),
    ).resolves.toBe(true);
    await expect(
      canViewAssessment(parentOne, "assessment-inactive", store),
    ).resolves.toBe(false);
    await expect(
      canViewStudentAssignments(parentOne, "student-2", store),
    ).resolves.toBe(false);
    await expect(
      canViewStudentSchedule(parentOne, "student-1", store),
    ).resolves.toBe(true);
    await expect(
      canViewStudentAttendance(parentOne, "student-1", store),
    ).resolves.toBe(true);
    await expect(canMarkAttendance(parentOne, "session-1", store)).resolves.toBe(
      false,
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
    await expect(
      canViewStudentSchedule(parentTwo, "student-1", store),
    ).resolves.toBe(false);
    await expect(
      canViewStudentAttendance(parentTwo, "student-1", store),
    ).resolves.toBe(false);
    await expect(
      canViewStudentAssessments(parentTwo, "student-1", store),
    ).resolves.toBe(false);
    await expect(
      canViewStudentSkillProgress(parentTwo, "student-1", "course-1", store),
    ).resolves.toBe(false);
    await expect(
      canViewProgressReport(parentTwo, "student-1", "course-1", store),
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
    await expect(canViewSession(null, "session-1", store)).resolves.toBe(false);
    await expect(canMarkAttendance(null, "session-1", store)).resolves.toBe(
      false,
    );
    await expect(canViewAssessment(null, "assessment-1", store)).resolves.toBe(
      false,
    );
    await expect(
      canViewCourseSkillProgress(null, "course-1", store),
    ).resolves.toBe(false);
    await expect(
      canViewProgressReport(null, "student-1", "course-1", store),
    ).resolves.toBe(false);
    await expect(
      canCreateProgressNote(null, "student-1", "course-1", store),
    ).resolves.toBe(false);
    await expect(canEditCourse(undefined, "course-1", store)).resolves.toBe(
      false,
    );
    expect(canVerifyPayment(null)).toBe(false);
  });
});
