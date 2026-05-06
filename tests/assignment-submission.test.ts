import { describe, expect, it } from "vitest";
import { EnrollmentStatus } from "../lib/generated/prisma/enums";
import { assignmentCreateSchema } from "../lib/validators/assignment";
import { submissionCreateSchema } from "../lib/validators/submission";
import {
  createAssignment,
  deriveAssignmentSubmissionStatus,
  isSubmissionLate,
  updateAssignment,
  type AssignmentWriteStore,
} from "../services/assignment.service";
import {
  gradeSubmission,
  submitAssignment,
  updateSubmission,
  type ManagedSubmission,
  type SubmissionWriteStore,
} from "../services/submission.service";

const now = new Date("2026-05-05T02:00:00.000Z");
const dueDate = new Date("2026-05-12T10:00:00.000Z");

function makeAssignmentStore(): AssignmentWriteStore {
  const tutorsByUser = new Map([
    ["tutor-user-1", { id: "tutor-1" }],
    ["tutor-user-2", { id: "tutor-2" }],
  ]);
  const courses = new Map([
    ["course-1", { id: "course-1", tutorId: "tutor-1" }],
    ["course-2", { id: "course-2", tutorId: "tutor-2" }],
  ]);
  const assignments = new Map([
    [
      "assignment-1",
      {
        id: "assignment-1",
        courseId: "course-1",
        courseTutorId: "tutor-1",
        maxScore: 100,
      },
    ],
    [
      "assignment-2",
      {
        id: "assignment-2",
        courseId: "course-2",
        courseTutorId: "tutor-2",
        maxScore: 100,
      },
    ],
  ]);
  let nextAssignment = 3;

  return {
    async getTutorProfileByUserId(tutorUserId) {
      return tutorsByUser.get(tutorUserId) ?? null;
    },
    async getCourseAccess(courseId) {
      return courses.get(courseId) ?? null;
    },
    async getAssignmentForMutation(assignmentId) {
      return assignments.get(assignmentId) ?? null;
    },
    async createAssignment(data) {
      const course = courses.get(data.courseId);

      if (!course) {
        throw new Error("missing course");
      }

      const assignment = {
        id: `assignment-${nextAssignment++}`,
        courseId: data.courseId,
        courseTutorId: course.tutorId,
        maxScore: data.maxScore,
      };
      assignments.set(assignment.id, assignment);

      return {
        id: assignment.id,
        courseId: data.courseId,
        title: data.title,
        description: data.instructions,
        dueDate: data.dueAt,
        maxScore: data.maxScore,
        createdAt: now,
        updatedAt: now,
      };
    },
    async updateAssignment(assignmentId, data) {
      const assignment = assignments.get(assignmentId);

      if (!assignment) {
        throw new Error("missing assignment");
      }

      assignments.set(assignmentId, {
        ...assignment,
        maxScore: data.maxScore,
      });

      return {
        id: assignmentId,
        courseId: assignment.courseId,
        title: data.title,
        description: data.instructions,
        dueDate: data.dueAt,
        maxScore: data.maxScore,
        createdAt: now,
        updatedAt: now,
      };
    },
  };
}

function makeManagedSubmission(
  input: Partial<ManagedSubmission> & {
    id: string;
    assignmentId: string;
    studentId: string;
    enrollmentId: string;
  },
): ManagedSubmission {
  return {
    content: "Initial answer",
    fileUrl: null,
    submittedAt: now,
    score: null,
    feedback: null,
    gradedAt: null,
    createdAt: now,
    updatedAt: now,
    ...input,
  };
}

function makeSubmissionStore(seed: ManagedSubmission[] = []) {
  const studentsByUser = new Map([
    ["student-user-1", { id: "student-1" }],
    ["student-user-2", { id: "student-2" }],
  ]);
  const tutorsByUser = new Map([
    ["tutor-user-1", { id: "tutor-1" }],
    ["tutor-user-2", { id: "tutor-2" }],
  ]);
  const assignments = new Map([
    ["assignment-1", { id: "assignment-1", courseId: "course-1", maxScore: 100 }],
    ["assignment-2", { id: "assignment-2", courseId: "course-2", maxScore: 50 }],
  ]);
  const courseTutors = new Map([
    ["course-1", "tutor-1"],
    ["course-2", "tutor-2"],
  ]);
  const enrollments = new Map([
    [
      "course-1:student-1",
      {
        id: "enrollment-1",
        studentId: "student-1",
        courseId: "course-1",
        status: EnrollmentStatus.ACTIVE,
      },
    ],
    [
      "course-1:student-2",
      {
        id: "enrollment-2",
        studentId: "student-2",
        courseId: "course-1",
        status: EnrollmentStatus.PENDING,
      },
    ],
    [
      "course-2:student-1",
      {
        id: "enrollment-3",
        studentId: "student-1",
        courseId: "course-2",
        status: EnrollmentStatus.ACTIVE,
      },
    ],
  ]);
  const submissions = new Map(
    seed.map((submission) => [
      `${submission.assignmentId}:${submission.studentId}`,
      submission,
    ]),
  );
  let nextSubmission = 1;

  function toMutationRecord(submission: ManagedSubmission) {
    const assignment = assignments.get(submission.assignmentId);
    const enrollment = Array.from(enrollments.values()).find(
      (candidate) => candidate.id === submission.enrollmentId,
    );

    if (!assignment || !enrollment) {
      throw new Error("invalid seed");
    }

    return {
      ...submission,
      assignmentCourseId: assignment.courseId,
      assignmentCourseTutorId: courseTutors.get(assignment.courseId) ?? "",
      assignmentMaxScore: assignment.maxScore,
      isEnrollmentConsistent:
        enrollment.studentId === submission.studentId &&
        enrollment.courseId === assignment.courseId,
    };
  }

  const store: SubmissionWriteStore & { count: () => number } = {
    async getStudentProfileByUserId(studentUserId) {
      return studentsByUser.get(studentUserId) ?? null;
    },
    async getTutorProfileByUserId(tutorUserId) {
      return tutorsByUser.get(tutorUserId) ?? null;
    },
    async getAssignmentForSubmission(assignmentId) {
      return assignments.get(assignmentId) ?? null;
    },
    async getActiveEnrollmentForStudent(courseId, studentId) {
      const enrollment = enrollments.get(`${courseId}:${studentId}`);

      return enrollment?.status === EnrollmentStatus.ACTIVE
        ? enrollment
        : null;
    },
    async getSubmissionForStudentAssignment(studentId, assignmentId) {
      const submission = submissions.get(`${assignmentId}:${studentId}`);

      return submission ? toMutationRecord(submission) : null;
    },
    async getSubmissionForMutation(submissionId) {
      const submission = Array.from(submissions.values()).find(
        (candidate) => candidate.id === submissionId,
      );

      return submission ? toMutationRecord(submission) : null;
    },
    async upsertSubmission(data) {
      const key = `${data.assignmentId}:${data.studentId}`;
      const existing = submissions.get(key);
      const submission = makeManagedSubmission({
        id: existing?.id ?? `submission-${nextSubmission++}`,
        assignmentId: data.assignmentId,
        studentId: data.studentId,
        enrollmentId: data.enrollmentId,
        content: data.content,
        fileUrl: data.fileUrl,
        submittedAt: data.submittedAt,
      });
      submissions.set(key, submission);

      return submission;
    },
    async updateSubmission(submissionId, data) {
      const entry = Array.from(submissions.entries()).find(
        ([, submission]) => submission.id === submissionId,
      );

      if (!entry) {
        throw new Error("missing submission");
      }

      const [key, current] = entry;
      const updated = {
        ...current,
        ...data,
        updatedAt: now,
      };
      submissions.set(key, updated);

      return updated;
    },
    async gradeSubmission(submissionId, data) {
      const entry = Array.from(submissions.entries()).find(
        ([, submission]) => submission.id === submissionId,
      );

      if (!entry) {
        throw new Error("missing submission");
      }

      const [key, current] = entry;
      const updated = {
        ...current,
        score: data.score,
        feedback: data.feedback,
        gradedAt: data.gradedAt,
        updatedAt: now,
      };
      submissions.set(key, updated);

      return updated;
    },
    async runInTransaction(callback) {
      return callback(store);
    },
    count() {
      return submissions.size;
    },
  };

  return store;
}

describe("assignment validation", () => {
  it("requires title, description, due date, and positive max score", () => {
    expect(
      assignmentCreateSchema.safeParse({
        title: "",
        description: "Practice problems",
        dueDate,
        maxScore: 100,
      }).success,
    ).toBe(false);
    expect(
      assignmentCreateSchema.safeParse({
        title: "Algebra homework",
        description: "Practice problems",
        dueDate,
        maxScore: 0,
      }).success,
    ).toBe(false);
  });
});

describe("assignment service", () => {
  it("lets a tutor create and edit assignments for own course", async () => {
    const store = makeAssignmentStore();

    const assignment = await createAssignment(
      "tutor-user-1",
      "course-1",
      {
        title: "Algebra practice",
        description: "Solve equations",
        dueDate,
        maxScore: 100,
      },
      store,
    );

    expect(assignment.courseId).toBe("course-1");
    await expect(
      updateAssignment(
        "tutor-user-1",
        "assignment-1",
        {
          title: "Updated homework",
          description: "Updated instructions",
          dueDate,
          maxScore: 80,
        },
        store,
      ),
    ).resolves.toMatchObject({ maxScore: 80 });
  });

  it("blocks tutors from creating or editing another tutor's assignment", async () => {
    const store = makeAssignmentStore();

    await expect(
      createAssignment(
        "tutor-user-1",
        "course-2",
        {
          title: "Unauthorized",
          description: "No access",
          dueDate,
          maxScore: 100,
        },
        store,
      ),
    ).rejects.toThrow("permission");
    await expect(
      updateAssignment(
        "tutor-user-1",
        "assignment-2",
        {
          title: "Unauthorized edit",
          description: "No access",
          dueDate,
          maxScore: 100,
        },
        store,
      ),
    ).rejects.toThrow("permission");
  });
});

describe("submission validation", () => {
  it("requires either text answer or file URL", () => {
    expect(
      submissionCreateSchema.safeParse({
        assignmentId: "assignment-1",
        textAnswer: "",
        fileUrl: "",
      }).success,
    ).toBe(false);
  });

  it("allows only http or https file URLs", () => {
    expect(
      submissionCreateSchema.safeParse({
        assignmentId: "assignment-1",
        fileUrl: "https://example.com/homework.pdf",
      }).success,
    ).toBe(true);
    expect(
      submissionCreateSchema.safeParse({
        assignmentId: "assignment-1",
        fileUrl: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });
});

describe("assignment submission status", () => {
  it("derives late submissions independently from grading state", () => {
    const lateSubmittedAt = new Date("2026-05-13T10:00:00.000Z");
    const gradedLateSubmission = {
      submittedAt: lateSubmittedAt,
      gradedAt: new Date("2026-05-14T10:00:00.000Z"),
    };

    expect(
      deriveAssignmentSubmissionStatus(
        { submittedAt: lateSubmittedAt, gradedAt: null },
        dueDate,
      ),
    ).toBe("LATE");
    expect(
      deriveAssignmentSubmissionStatus(gradedLateSubmission, dueDate),
    ).toBe("GRADED");
    expect(isSubmissionLate(gradedLateSubmission, dueDate)).toBe(true);
  });
});

describe("submission service", () => {
  it("lets an active enrolled student submit and resubmit once per assignment", async () => {
    const store = makeSubmissionStore();

    const first = await submitAssignment(
      "student-user-1",
      "assignment-1",
      { textAnswer: "First answer" },
      store,
    );
    const second = await submitAssignment(
      "student-user-1",
      "assignment-1",
      { textAnswer: "Updated answer" },
      store,
    );

    expect(first.id).toBe(second.id);
    expect(second.content).toBe("Updated answer");
    expect(store.count()).toBe(1);
  });

  it("blocks submissions without active enrollment", async () => {
    await expect(
      submitAssignment(
        "student-user-2",
        "assignment-1",
        { textAnswer: "Pending enrollment" },
        makeSubmissionStore(),
      ),
    ).rejects.toThrow("ACTIVE enrolled");
  });

  it("blocks student edits after a submission is graded", async () => {
    const store = makeSubmissionStore([
      makeManagedSubmission({
        id: "submission-graded",
        assignmentId: "assignment-1",
        studentId: "student-1",
        enrollmentId: "enrollment-1",
        score: 90,
        feedback: "Good work",
        gradedAt: now,
      }),
    ]);

    await expect(
      updateSubmission(
        "student-user-1",
        "submission-graded",
        { textAnswer: "Please change" },
        store,
      ),
    ).rejects.toThrow("Graded submissions");
  });

  it("blocks students from editing another student's submission", async () => {
    const store = makeSubmissionStore([
      makeManagedSubmission({
        id: "submission-owned-by-student-1",
        assignmentId: "assignment-1",
        studentId: "student-1",
        enrollmentId: "enrollment-1",
      }),
    ]);

    await expect(
      updateSubmission(
        "student-user-2",
        "submission-owned-by-student-1",
        { textAnswer: "Tampered answer" },
        store,
      ),
    ).rejects.toThrow("own submissions");
  });

  it("lets a tutor grade submissions for own course only and validates max score", async () => {
    const store = makeSubmissionStore([
      makeManagedSubmission({
        id: "submission-1",
        assignmentId: "assignment-1",
        studentId: "student-1",
        enrollmentId: "enrollment-1",
      }),
      makeManagedSubmission({
        id: "submission-2",
        assignmentId: "assignment-2",
        studentId: "student-1",
        enrollmentId: "enrollment-3",
      }),
    ]);

    await expect(
      gradeSubmission(
        "tutor-user-1",
        "submission-1",
        { score: 95, feedback: "Strong work" },
        store,
      ),
    ).resolves.toMatchObject({ score: 95, feedback: "Strong work" });
    await expect(
      gradeSubmission(
        "tutor-user-1",
        "submission-2",
        { score: 45 },
        store,
      ),
    ).rejects.toThrow("own courses");
    await expect(
      gradeSubmission(
        "tutor-user-1",
        "submission-1",
        { score: 120 },
        store,
      ),
    ).rejects.toThrow("max score");
  });
});
