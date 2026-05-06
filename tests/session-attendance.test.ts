import { describe, expect, it } from "vitest";
import {
  AttendanceStatus,
  CourseStatus,
  EnrollmentStatus,
  SessionStatus,
} from "../lib/generated/prisma/enums";
import { sessionCreateSchema } from "../lib/validators/session";
import {
  canTransitionSessionStatus,
  cancelSession,
  completeSession,
  createSession,
  updateSession,
  type SessionWriteRecord,
  type SessionWriteStore,
} from "../services/session.service";
import {
  bulkMarkAttendance,
  type AttendanceWriteStore,
  type ManagedAttendance,
} from "../services/attendance.service";

const now = new Date("2026-05-05T02:00:00.000Z");
const start = new Date("2026-05-05T10:00:00.000Z");
const end = new Date("2026-05-05T11:00:00.000Z");

type FakeCourse = {
  id: string;
  tutorId: string;
  status: CourseStatus;
};

function makeSessionRecord(
  input: Partial<SessionWriteRecord> & {
    id: string;
    courseId: string;
    courseTutorId: string;
    courseStatus: CourseStatus;
  },
): SessionWriteRecord {
  return {
    title: "Algebra lesson",
    description: null,
    startsAt: start,
    endsAt: end,
    meetingUrl: null,
    status: SessionStatus.SCHEDULED,
    createdAt: now,
    updatedAt: now,
    ...input,
  };
}

function makeSessionStore(
  seed: SessionWriteRecord[] = [],
): SessionWriteStore {
  const courses = new Map<string, FakeCourse>([
    [
      "course-published",
      {
        id: "course-published",
        tutorId: "tutor-1",
        status: CourseStatus.PUBLISHED,
      },
    ],
    [
      "course-other",
      {
        id: "course-other",
        tutorId: "tutor-2",
        status: CourseStatus.PUBLISHED,
      },
    ],
    [
      "course-draft",
      {
        id: "course-draft",
        tutorId: "tutor-1",
        status: CourseStatus.DRAFT,
      },
    ],
    [
      "course-archived",
      {
        id: "course-archived",
        tutorId: "tutor-1",
        status: CourseStatus.ARCHIVED,
      },
    ],
  ]);
  const sessions = new Map(seed.map((session) => [session.id, session]));
  let nextSession = 1;

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
    async getCourseAccess(courseId) {
      return courses.get(courseId) ?? null;
    },
    async createSession(data) {
      const course = courses.get(data.courseId);

      if (!course) {
        throw new Error("missing course");
      }

      const session = makeSessionRecord({
        id: `session-${nextSession++}`,
        courseId: data.courseId,
        title: data.title,
        description: data.description,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        meetingUrl: data.meetingUrl,
        status: data.status,
        courseTutorId: course.tutorId,
        courseStatus: course.status,
      });
      sessions.set(session.id, session);

      return session;
    },
    async getSessionAccess(sessionId) {
      return sessions.get(sessionId) ?? null;
    },
    async updateSession(sessionId, data) {
      const current = sessions.get(sessionId);

      if (!current) {
        throw new Error("missing session");
      }

      const updated = { ...current, ...data, updatedAt: now };
      sessions.set(sessionId, updated);

      return updated;
    },
    async updateSessionStatus(sessionId, data) {
      const current = sessions.get(sessionId);

      if (!current) {
        throw new Error("missing session");
      }

      const updated = { ...current, ...data, updatedAt: now };
      sessions.set(sessionId, updated);

      return updated;
    },
  };
}

function makeAttendanceRecord(
  input: Pick<ManagedAttendance, "sessionId" | "studentId" | "enrollmentId" | "status"> & {
    id?: string;
    note?: string | null;
  },
): ManagedAttendance {
  return {
    id: input.id ?? "attendance-seed",
    sessionId: input.sessionId,
    studentId: input.studentId,
    enrollmentId: input.enrollmentId,
    status: input.status,
    markedAt: now,
    note: input.note ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

function makeAttendanceStore() {
  const sessions = new Map([
    [
      "session-1",
      {
        id: "session-1",
        courseId: "course-published",
        courseTutorId: "tutor-1",
        status: SessionStatus.SCHEDULED,
      },
    ],
    [
      "session-cancelled",
      {
        id: "session-cancelled",
        courseId: "course-published",
        courseTutorId: "tutor-1",
        status: SessionStatus.CANCELLED,
      },
    ],
  ]);
  const enrollments = new Map([
    [
      "course-published:student-1",
      {
        id: "enrollment-1",
        studentId: "student-1",
        courseId: "course-published",
        status: EnrollmentStatus.ACTIVE,
      },
    ],
    [
      "course-published:student-2",
      {
        id: "enrollment-2",
        studentId: "student-2",
        courseId: "course-published",
        status: EnrollmentStatus.PENDING,
      },
    ],
    [
      "course-other:student-3",
      {
        id: "enrollment-3",
        studentId: "student-3",
        courseId: "course-other",
        status: EnrollmentStatus.ACTIVE,
      },
    ],
  ]);
  const attendance = new Map<string, ManagedAttendance>();
  let nextAttendance = 1;

  const store: AttendanceWriteStore & { count: () => number } = {
    async getSessionForAttendance(sessionId) {
      return sessions.get(sessionId) ?? null;
    },
    async getActiveEnrollmentForStudent(courseId, studentId) {
      const enrollment = enrollments.get(`${courseId}:${studentId}`);

      return enrollment?.status === EnrollmentStatus.ACTIVE ? enrollment : null;
    },
    async upsertAttendance(data) {
      const key = `${data.sessionId}:${data.studentId}`;
      const existing = attendance.get(key);
      const row = makeAttendanceRecord({
        id: existing?.id ?? `attendance-${nextAttendance++}`,
        sessionId: data.sessionId,
        studentId: data.studentId,
        enrollmentId: data.enrollmentId,
        status: data.status,
        note: data.note,
      });
      attendance.set(key, row);

      return row;
    },
    async runInTransaction(callback) {
      return callback(store);
    },
    count() {
      return attendance.size;
    },
  };

  return store;
}

describe("session validation", () => {
  it("requires scheduledEnd to be after scheduledStart", () => {
    expect(
      sessionCreateSchema.safeParse({
        courseId: "course-published",
        title: "Algebra",
        scheduledStart: end,
        scheduledEnd: start,
      }).success,
    ).toBe(false);
  });
});

describe("session service", () => {
  it("lets a tutor create a scheduled session for own published course", async () => {
    const session = await createSession(
      "tutor-user-1",
      {
        courseId: "course-published",
        title: "Algebra foundations",
        scheduledStart: start,
        scheduledEnd: end,
      },
      makeSessionStore(),
    );

    expect(session.courseId).toBe("course-published");
    expect(session.status).toBe(SessionStatus.SCHEDULED);
  });

  it("blocks sessions for another tutor, draft courses, and archived courses", async () => {
    const store = makeSessionStore();

    await expect(
      createSession(
        "tutor-user-1",
        {
          courseId: "course-other",
          title: "Other course",
          scheduledStart: start,
          scheduledEnd: end,
        },
        store,
      ),
    ).rejects.toThrow("permission");
    await expect(
      createSession(
        "tutor-user-1",
        {
          courseId: "course-draft",
          title: "Draft course",
          scheduledStart: start,
          scheduledEnd: end,
        },
        store,
      ),
    ).rejects.toThrow("published");
    await expect(
      createSession(
        "tutor-user-1",
        {
          courseId: "course-archived",
          title: "Archived course",
          scheduledStart: start,
          scheduledEnd: end,
        },
        store,
      ),
    ).rejects.toThrow("published");
  });

  it("lets tutors edit and transition only their own scheduled sessions", async () => {
    const store = makeSessionStore([
      makeSessionRecord({
        id: "session-1",
        courseId: "course-published",
        courseTutorId: "tutor-1",
        courseStatus: CourseStatus.PUBLISHED,
      }),
    ]);

    await expect(
      updateSession(
        "tutor-user-1",
        "session-1",
        {
          title: "Updated session",
          scheduledStart: start,
          scheduledEnd: end,
        },
        store,
      ),
    ).resolves.toMatchObject({ title: "Updated session" });
    await expect(
      completeSession("tutor-user-1", "session-1", store),
    ).resolves.toMatchObject({ status: SessionStatus.COMPLETED });
    await expect(
      cancelSession("tutor-user-1", "session-1", store),
    ).rejects.toThrow("Cannot change session status");
    expect(
      canTransitionSessionStatus(
        SessionStatus.SCHEDULED,
        SessionStatus.CANCELLED,
      ),
    ).toBe(true);
    expect(
      canTransitionSessionStatus(
        SessionStatus.COMPLETED,
        SessionStatus.SCHEDULED,
      ),
    ).toBe(false);
  });

  it("blocks tutors from editing or changing another tutor's session", async () => {
    const store = makeSessionStore([
      makeSessionRecord({
        id: "session-other-tutor",
        courseId: "course-other",
        courseTutorId: "tutor-2",
        courseStatus: CourseStatus.PUBLISHED,
      }),
    ]);

    await expect(
      updateSession(
        "tutor-user-1",
        "session-other-tutor",
        {
          title: "Unauthorized edit",
          scheduledStart: start,
          scheduledEnd: end,
        },
        store,
      ),
    ).rejects.toThrow("permission");
    await expect(
      completeSession("tutor-user-1", "session-other-tutor", store),
    ).rejects.toThrow("permission");
    await expect(
      cancelSession("tutor-user-1", "session-other-tutor", store),
    ).rejects.toThrow("permission");
  });
});

describe("attendance service", () => {
  it("marks attendance only for active enrolled students", async () => {
    const store = makeAttendanceStore();

    await expect(
      bulkMarkAttendance(
        {
          sessionId: "session-1",
          records: [
            { studentId: "student-1", status: AttendanceStatus.PRESENT },
          ],
        },
        store,
      ),
    ).resolves.toHaveLength(1);
    await expect(
      bulkMarkAttendance(
        {
          sessionId: "session-1",
          records: [{ studentId: "student-2", status: AttendanceStatus.LATE }],
        },
        store,
      ),
    ).rejects.toThrow("active enrolled");
  });

  it("does not mark an active student from a different course", async () => {
    await expect(
      bulkMarkAttendance(
        {
          sessionId: "session-1",
          records: [
            { studentId: "student-3", status: AttendanceStatus.PRESENT },
          ],
        },
        makeAttendanceStore(),
      ),
    ).rejects.toThrow("active enrolled");
  });

  it("uses upsert so repeated attendance marking does not create duplicates", async () => {
    const store = makeAttendanceStore();

    const first = await bulkMarkAttendance(
      {
        sessionId: "session-1",
        records: [{ studentId: "student-1", status: AttendanceStatus.PRESENT }],
      },
      store,
    );
    const second = await bulkMarkAttendance(
      {
        sessionId: "session-1",
        records: [{ studentId: "student-1", status: AttendanceStatus.LATE }],
      },
      store,
    );

    expect(first[0].id).toBe(second[0].id);
    expect(second[0].status).toBe(AttendanceStatus.LATE);
    expect(store.count()).toBe(1);
  });

  it("does not mark attendance for cancelled sessions", async () => {
    await expect(
      bulkMarkAttendance(
        {
          sessionId: "session-cancelled",
          records: [
            { studentId: "student-1", status: AttendanceStatus.PRESENT },
          ],
        },
        makeAttendanceStore(),
      ),
    ).rejects.toThrow("cancelled");
  });
});
