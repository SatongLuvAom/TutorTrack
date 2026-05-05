import { describe, expect, it } from "vitest";
import {
  CourseStatus,
  EnrollmentStatus,
} from "../lib/generated/prisma/enums";
import { enrollmentCreateSchema } from "../lib/validators/enrollment";
import {
  adminUpdateEnrollmentStatus,
  cancelParentChildEnrollment,
  cancelStudentEnrollment,
  canTransitionEnrollmentStatus,
  createParentChildEnrollment,
  createStudentEnrollment,
  parseEnrollmentFilters,
  type EnrollmentWriteStore,
  type ManagedEnrollment,
} from "../services/enrollment.service";

type FakeCourse = {
  id: string;
  status: CourseStatus;
  capacity: number | null;
  tutorId: string;
};

const now = new Date("2026-05-05T00:00:00.000Z");
const pendingOrActiveStatuses: EnrollmentStatus[] = [
  EnrollmentStatus.PENDING,
  EnrollmentStatus.ACTIVE,
];

function makeEnrollment(
  input: Pick<ManagedEnrollment, "studentId" | "courseId" | "status"> & {
    id?: string;
  },
): ManagedEnrollment {
  return {
    id: input.id ?? "enrollment-seed",
    studentId: input.studentId,
    courseId: input.courseId,
    status: input.status,
    enrolledAt: now,
    completedAt: null,
    cancelledAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function makeEnrollmentStore(seed: ManagedEnrollment[] = []): EnrollmentWriteStore {
  const courses = new Map<string, FakeCourse>([
    [
      "course-published",
      {
        id: "course-published",
        status: CourseStatus.PUBLISHED,
        capacity: 2,
        tutorId: "tutor-1",
      },
    ],
    [
      "course-draft",
      {
        id: "course-draft",
        status: CourseStatus.DRAFT,
        capacity: 2,
        tutorId: "tutor-1",
      },
    ],
    [
      "course-archived",
      {
        id: "course-archived",
        status: CourseStatus.ARCHIVED,
        capacity: 2,
        tutorId: "tutor-1",
      },
    ],
    [
      "course-full",
      {
        id: "course-full",
        status: CourseStatus.PUBLISHED,
        capacity: 1,
        tutorId: "tutor-1",
      },
    ],
  ]);
  const enrollments = new Map(seed.map((enrollment) => [enrollment.id, enrollment]));
  let nextEnrollment = 1;

  const store: EnrollmentWriteStore = {
    async getStudentProfileByUserId(studentUserId) {
      if (studentUserId === "student-user-1") {
        return { id: "student-1" };
      }

      if (studentUserId === "student-user-2") {
        return { id: "student-2" };
      }

      return null;
    },
    async getParentProfileByUserId(parentUserId) {
      if (parentUserId === "parent-user-1") {
        return { id: "parent-1" };
      }

      if (parentUserId === "parent-user-inactive") {
        return { id: "parent-inactive" };
      }

      return null;
    },
    async hasActiveParentStudentLink(parentId, studentId) {
      return parentId === "parent-1" && studentId === "student-1";
    },
    async getCourseForEnrollment(courseId) {
      const course = courses.get(courseId);

      return course
        ? {
            id: course.id,
            status: course.status,
            capacity: course.capacity,
          }
        : null;
    },
    async countPendingActiveEnrollments(courseId) {
      return Array.from(enrollments.values()).filter(
        (enrollment) =>
          enrollment.courseId === courseId &&
          pendingOrActiveStatuses.includes(enrollment.status),
      ).length;
    },
    async getPendingOrActiveEnrollment(studentId, courseId) {
      return (
        Array.from(enrollments.values()).find(
          (enrollment) =>
            enrollment.studentId === studentId &&
            enrollment.courseId === courseId &&
            pendingOrActiveStatuses.includes(enrollment.status),
        ) ?? null
      );
    },
    async createEnrollment(data) {
      const enrollment = makeEnrollment({
        id: `enrollment-${nextEnrollment++}`,
        studentId: data.studentId,
        courseId: data.courseId,
        status: data.status,
      });
      enrollments.set(enrollment.id, enrollment);

      return enrollment;
    },
    async getEnrollmentForMutation(enrollmentId) {
      const enrollment = enrollments.get(enrollmentId);

      if (!enrollment) {
        return null;
      }

      return {
        ...enrollment,
        courseTutorId: courses.get(enrollment.courseId)?.tutorId ?? "tutor-1",
      };
    },
    async updateEnrollmentStatus(enrollmentId, data) {
      const current = enrollments.get(enrollmentId);

      if (!current) {
        throw new Error("missing enrollment");
      }

      const updated: ManagedEnrollment = {
        ...current,
        ...data,
        updatedAt: new Date("2026-05-05T01:00:00.000Z"),
      };
      enrollments.set(enrollmentId, updated);

      return updated;
    },
    async runInTransaction(callback) {
      return callback(store);
    },
  };

  return store;
}

describe("enrollment validation", () => {
  it("requires a course id and parses filters safely", () => {
    expect(enrollmentCreateSchema.safeParse({ courseId: "" }).success).toBe(
      false,
    );
    expect(
      parseEnrollmentFilters({
        search: " algebra ",
        status: "bad-status",
      }),
    ).toEqual({ search: "algebra" });
  });
});

describe("enrollment service", () => {
  it("lets a student enroll self in a published course with PENDING status", async () => {
    const enrollment = await createStudentEnrollment(
      "student-user-1",
      "course-published",
      makeEnrollmentStore(),
    );

    expect(enrollment.studentId).toBe("student-1");
    expect(enrollment.status).toBe(EnrollmentStatus.PENDING);
  });

  it("rejects draft and archived courses", async () => {
    const store = makeEnrollmentStore();

    await expect(
      createStudentEnrollment("student-user-1", "course-draft", store),
    ).rejects.toThrow("published");
    await expect(
      createStudentEnrollment("student-user-1", "course-archived", store),
    ).rejects.toThrow("published");
  });

  it("prevents duplicate pending or active enrollments", async () => {
    const store = makeEnrollmentStore([
      makeEnrollment({
        id: "enrollment-existing",
        studentId: "student-1",
        courseId: "course-published",
        status: EnrollmentStatus.PENDING,
      }),
    ]);

    await expect(
      createStudentEnrollment("student-user-1", "course-published", store),
    ).rejects.toThrow("pending or active");
  });

  it("allows parents to enroll active linked children only", async () => {
    const store = makeEnrollmentStore();

    await expect(
      createParentChildEnrollment(
        "parent-user-1",
        "student-1",
        "course-published",
        store,
      ),
    ).resolves.toMatchObject({
      studentId: "student-1",
      status: EnrollmentStatus.PENDING,
    });

    await expect(
      createParentChildEnrollment(
        "parent-user-1",
        "student-2",
        "course-published",
        store,
      ),
    ).rejects.toThrow("active linked");
    await expect(
      createParentChildEnrollment(
        "parent-user-inactive",
        "student-1",
        "course-published",
        store,
      ),
    ).rejects.toThrow("active linked");
  });

  it("respects course capacity for pending and active enrollments", async () => {
    const store = makeEnrollmentStore([
      makeEnrollment({
        id: "enrollment-existing",
        studentId: "student-1",
        courseId: "course-full",
        status: EnrollmentStatus.ACTIVE,
      }),
    ]);

    await expect(
      createStudentEnrollment("student-user-2", "course-full", store),
    ).rejects.toThrow("capacity");
  });

  it("lets students and parents cancel only their own pending enrollments", async () => {
    const store = makeEnrollmentStore([
      makeEnrollment({
        id: "enrollment-student",
        studentId: "student-1",
        courseId: "course-published",
        status: EnrollmentStatus.PENDING,
      }),
      makeEnrollment({
        id: "enrollment-other",
        studentId: "student-2",
        courseId: "course-published",
        status: EnrollmentStatus.PENDING,
      }),
      makeEnrollment({
        id: "enrollment-active",
        studentId: "student-1",
        courseId: "course-full",
        status: EnrollmentStatus.ACTIVE,
      }),
    ]);

    await expect(
      cancelStudentEnrollment("student-user-1", "enrollment-student", store),
    ).resolves.toMatchObject({ status: EnrollmentStatus.CANCELLED });
    await expect(
      cancelStudentEnrollment("student-user-1", "enrollment-other", store),
    ).rejects.toThrow("own enrollments");
    await expect(
      cancelStudentEnrollment("student-user-1", "enrollment-active", store),
    ).rejects.toThrow("pending");
    await expect(
      cancelParentChildEnrollment(
        "parent-user-1",
        "student-2",
        "enrollment-other",
        store,
      ),
    ).rejects.toThrow("linked children");
  });

  it("allows admin enrollment status transitions only through valid paths", async () => {
    const store = makeEnrollmentStore([
      makeEnrollment({
        id: "enrollment-admin",
        studentId: "student-1",
        courseId: "course-published",
        status: EnrollmentStatus.PENDING,
      }),
    ]);

    expect(
      canTransitionEnrollmentStatus(
        EnrollmentStatus.PENDING,
        EnrollmentStatus.ACTIVE,
      ),
    ).toBe(true);
    expect(
      canTransitionEnrollmentStatus(
        EnrollmentStatus.CANCELLED,
        EnrollmentStatus.ACTIVE,
      ),
    ).toBe(false);

    const active = await adminUpdateEnrollmentStatus(
      "admin-user",
      "enrollment-admin",
      EnrollmentStatus.ACTIVE,
      store,
    );
    expect(active.status).toBe(EnrollmentStatus.ACTIVE);

    await expect(
      adminUpdateEnrollmentStatus(
        "admin-user",
        "enrollment-admin",
        EnrollmentStatus.PENDING,
        store,
      ),
    ).rejects.toThrow("Cannot change enrollment status");
  });
});
