import { describe, expect, it } from "vitest";
import { CourseStatus, CourseType } from "../lib/generated/prisma/enums";
import { courseCreateSchema } from "../lib/validators/course";
import {
  adminUpdateCourseStatus,
  archiveCourse,
  buildCourseCreateData,
  canTransitionCourseStatus,
  createCourse,
  publishCourse,
  restoreCourseToDraft,
  updateCourse,
  type CourseWriteStore,
  type ManagedCourse,
} from "../services/course.service";

const validCourseInput = {
  title: "Algebra Mastery",
  description: "Structured algebra course for exam preparation.",
  subjectId: "subject-1",
  level: "middle-school",
  courseType: CourseType.GROUP,
  price: 5200,
  maxStudents: 8,
  totalSessions: 12,
} as const;

function makeCourseStore(): CourseWriteStore {
  const courses = new Map<string, ManagedCourse>();
  let nextCourseNumber = 1;

  function getCourse(courseId: string): ManagedCourse {
    const course = courses.get(courseId);

    if (!course) {
      throw new Error(`Missing fake course ${courseId}`);
    }

    return course;
  }

  return {
    async getTutorProfileByUserId(tutorUserId) {
      if (tutorUserId === "tutor-user-1") {
        return { id: "tutor-1" };
      }

      if (tutorUserId === "tutor-user-2") {
        return { id: "tutor-2" };
      }

      return null;
    },

    async getSubjectById(subjectId) {
      return subjectId === "subject-1" ? { id: subjectId } : null;
    },

    async createCourse(data) {
      const now = new Date("2026-05-05T00:00:00.000Z");
      const course: ManagedCourse = {
        id: `course-${nextCourseNumber++}`,
        slug: data.slug,
        title: data.title,
        description: data.description,
        level: data.level,
        type: data.type,
        status: data.status,
        priceCents: data.priceCents,
        maxStudents: data.capacity,
        totalSessions: data.totalSessions,
        publishedAt: data.publishedAt,
        createdAt: now,
        updatedAt: now,
        subject: {
          id: data.subjectId,
          name: "Mathematics",
          slug: "mathematics",
        },
        tutor: {
          id: data.tutorId,
          name: data.tutorId === "tutor-1" ? "Tutor One" : "Tutor Two",
          email:
            data.tutorId === "tutor-1"
              ? "tutor1@tutortrack.test"
              : "tutor2@tutortrack.test",
        },
        stats: {
          enrollmentCount: 0,
          scheduledSessionCount: 0,
          assignmentCount: 0,
        },
      };

      courses.set(course.id, course);

      return course;
    },

    async getCourseAccess(courseId) {
      const course = courses.get(courseId);

      return course
        ? {
            id: course.id,
            tutorId: course.tutor.id,
            status: course.status,
            publishedAt: course.publishedAt,
          }
        : null;
    },

    async updateCourse(courseId, data) {
      const current = getCourse(courseId);
      const updated: ManagedCourse = {
        ...current,
        title: data.title,
        description: data.description,
        level: data.level,
        type: data.type,
        priceCents: data.priceCents,
        maxStudents: data.capacity,
        totalSessions: data.totalSessions,
        subject: {
          id: data.subjectId,
          name: "Mathematics",
          slug: "mathematics",
        },
        updatedAt: new Date("2026-05-05T01:00:00.000Z"),
      };

      courses.set(courseId, updated);

      return updated;
    },

    async updateCourseStatus(courseId, data) {
      const current = getCourse(courseId);
      const updated: ManagedCourse = {
        ...current,
        status: data.status,
        publishedAt:
          "publishedAt" in data ? (data.publishedAt ?? null) : current.publishedAt,
        updatedAt: new Date("2026-05-05T02:00:00.000Z"),
      };

      courses.set(courseId, updated);

      return updated;
    },
  };
}

describe("course validation", () => {
  it("rejects invalid course inputs", () => {
    expect(
      courseCreateSchema.safeParse({
        ...validCourseInput,
        title: "",
      }).success,
    ).toBe(false);
    expect(
      courseCreateSchema.safeParse({
        ...validCourseInput,
        subjectId: "",
      }).success,
    ).toBe(false);
    expect(
      courseCreateSchema.safeParse({
        ...validCourseInput,
        price: -1,
      }).success,
    ).toBe(false);
    expect(
      courseCreateSchema.safeParse({
        ...validCourseInput,
        totalSessions: 0,
      }).success,
    ).toBe(false);
  });

  it("builds create data with DRAFT status by default", () => {
    const data = buildCourseCreateData(
      "tutor-1",
      validCourseInput,
      "algebra-mastery",
    );

    expect(data.status).toBe(CourseStatus.DRAFT);
    expect(data.priceCents).toBe(520000);
    expect(data.totalSessions).toBe(12);
  });
});

describe("course management service", () => {
  it("allows a tutor to create a draft course", async () => {
    const store = makeCourseStore();
    const course = await createCourse("tutor-user-1", validCourseInput, store);

    expect(course.status).toBe(CourseStatus.DRAFT);
    expect(course.tutor.id).toBe("tutor-1");
    expect(course.title).toBe("Algebra Mastery");
  });

  it("allows a tutor to edit only their own course", async () => {
    const store = makeCourseStore();
    const course = await createCourse("tutor-user-1", validCourseInput, store);

    await expect(
      updateCourse(
        "tutor-user-1",
        course.id,
        {
          ...validCourseInput,
          title: "Algebra Mastery Updated",
          maxStudents: 6,
        },
        store,
      ),
    ).resolves.toMatchObject({
      title: "Algebra Mastery Updated",
      maxStudents: 6,
    });

    await expect(
      updateCourse("tutor-user-2", course.id, validCourseInput, store),
    ).rejects.toThrow("permission");
  });

  it("allows admin status management for any course", async () => {
    const store = makeCourseStore();
    const course = await createCourse("tutor-user-1", validCourseInput, store);

    const published = await adminUpdateCourseStatus(
      course.id,
      CourseStatus.PUBLISHED,
      store,
    );

    expect(published.status).toBe(CourseStatus.PUBLISHED);
    expect(published.publishedAt).toBeInstanceOf(Date);
  });

  it("enforces course status transitions", async () => {
    const store = makeCourseStore();
    const course = await createCourse("tutor-user-1", validCourseInput, store);

    expect(
      canTransitionCourseStatus(CourseStatus.DRAFT, CourseStatus.PUBLISHED),
    ).toBe(true);
    expect(
      canTransitionCourseStatus(CourseStatus.ARCHIVED, CourseStatus.PUBLISHED),
    ).toBe(false);

    const published = await publishCourse("tutor-user-1", course.id, store);
    expect(published.status).toBe(CourseStatus.PUBLISHED);

    const archived = await archiveCourse("tutor-user-1", course.id, store);
    expect(archived.status).toBe(CourseStatus.ARCHIVED);

    const restored = await restoreCourseToDraft("tutor-user-1", course.id, store);
    expect(restored.status).toBe(CourseStatus.DRAFT);
    expect(restored.publishedAt).toBeNull();

    const republished = await publishCourse("tutor-user-1", course.id, store);
    expect(republished.status).toBe(CourseStatus.PUBLISHED);
    await archiveCourse("tutor-user-1", course.id, store);

    await expect(
      adminUpdateCourseStatus(course.id, CourseStatus.PUBLISHED, store),
    ).rejects.toThrow("Cannot change course status");
  });

  it("blocks tutors from publishing or archiving another tutor's course", async () => {
    const store = makeCourseStore();
    const course = await createCourse("tutor-user-1", validCourseInput, store);

    await expect(
      publishCourse("tutor-user-2", course.id, store),
    ).rejects.toThrow("permission");
    await expect(
      archiveCourse("tutor-user-2", course.id, store),
    ).rejects.toThrow("permission");
  });
});
