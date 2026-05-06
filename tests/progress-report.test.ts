import { describe, expect, it } from "vitest";
import {
  AssessmentType,
  AttendanceStatus,
  SkillLevel,
} from "../lib/generated/prisma/enums";
import {
  calculateProgressReportFromSnapshot,
  calculateWeightedProgressScore,
  type ProgressReportSnapshot,
} from "../services/progress.service";
import {
  createProgressNote,
  type ProgressNoteSummary,
  type ProgressNoteWriteStore,
} from "../services/progress-note.service";

const baseDate = new Date("2026-05-06T03:00:00.000Z");
const dueDate = new Date("2026-05-05T03:00:00.000Z");
const lateSubmittedAt = new Date("2026-05-05T06:00:00.000Z");
const onTimeSubmittedAt = new Date("2026-05-04T03:00:00.000Z");

function makeSnapshot(
  overrides: Partial<ProgressReportSnapshot> = {},
): ProgressReportSnapshot {
  return {
    studentId: "student-1",
    courseId: "course-1",
    courseTitle: "Math for Grade 10",
    tutorName: "Tutor One",
    subjectName: "Mathematics",
    attendanceRecords: [
      { status: AttendanceStatus.PRESENT },
      { status: AttendanceStatus.LATE },
      { status: AttendanceStatus.EXCUSED },
      { status: AttendanceStatus.ABSENT },
    ],
    homeworkRecords: [
      {
        id: "assignment-1",
        dueAt: dueDate,
        submission: { submittedAt: onTimeSubmittedAt, gradedAt: baseDate },
      },
      {
        id: "assignment-2",
        dueAt: dueDate,
        submission: { submittedAt: lateSubmittedAt, gradedAt: null },
      },
      {
        id: "assignment-3",
        dueAt: null,
        submission: { submittedAt: onTimeSubmittedAt, gradedAt: baseDate },
      },
      { id: "assignment-4", dueAt: dueDate, submission: null },
    ],
    assessmentRecords: [
      {
        id: "assessment-1",
        title: "Quiz 1",
        type: AssessmentType.QUIZ,
        score: 80,
        maxScore: 100,
        takenAt: new Date("2026-05-01T03:00:00.000Z"),
      },
      {
        id: "assessment-2",
        title: "Mock exam",
        type: AssessmentType.MOCK_EXAM,
        score: 18,
        maxScore: 20,
        takenAt: new Date("2026-05-02T03:00:00.000Z"),
      },
    ],
    skillRecords: [
      {
        skillId: "skill-1",
        skillName: "Linear equations",
        skillDescription: null,
        level: SkillLevel.GOOD,
        note: "Accurate setup",
        updatedAt: baseDate,
      },
      {
        skillId: "skill-2",
        skillName: "Quadratic graphs",
        skillDescription: null,
        level: SkillLevel.EXCELLENT,
        note: "Strong graph reading",
        updatedAt: baseDate,
      },
      {
        skillId: "skill-3",
        skillName: "Word problems",
        skillDescription: null,
        level: SkillLevel.BASIC,
        note: "Needs more practice",
        updatedAt: baseDate,
      },
    ],
    latestTutorNote: {
      id: "note-1",
      note: "Consistent effort",
      strengths: "Improves after feedback",
      weaknesses: "Multi-step word problems",
      recommendedNextSteps: "Practice timed mixed problems.",
      tutorName: "Tutor One",
      createdAt: baseDate,
    },
    ...overrides,
  };
}

function makeProgressNoteStore(): ProgressNoteWriteStore & {
  count: () => number;
} {
  const notes: ProgressNoteSummary[] = [];

  const store: ProgressNoteWriteStore & { count: () => number } = {
    async getTutorProfileByUserId(tutorUserId) {
      if (tutorUserId === "tutor-user-1") {
        return { id: "tutor-1" };
      }

      if (tutorUserId === "tutor-user-2") {
        return { id: "tutor-2" };
      }

      return null;
    },
    async getCourse(courseId) {
      if (courseId === "course-1") {
        return { id: "course-1", tutorId: "tutor-1" };
      }

      if (courseId === "course-2") {
        return { id: "course-2", tutorId: "tutor-2" };
      }

      return null;
    },
    async getActiveEnrollment(studentId, courseId) {
      if (studentId === "student-1" && courseId === "course-1") {
        return { id: "enrollment-1", studentId, courseId };
      }

      return null;
    },
    async createProgressNote(data) {
      const note: ProgressNoteSummary = {
        id: `note-${notes.length + 1}`,
        courseId: data.courseId,
        studentId: data.studentId,
        enrollmentId: data.enrollmentId,
        tutorId: data.tutorId,
        note: data.note,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        recommendedNextSteps: data.recommendedNextSteps,
        tutorName: "Tutor One",
        createdAt: baseDate,
        updatedAt: baseDate,
      };
      notes.push(note);

      return note;
    },
    async runInTransaction(callback) {
      return callback(store);
    },
    count() {
      return notes.length;
    },
  };

  return store;
}

describe("progress report calculation", () => {
  it("calculates the deterministic weighted score from full data", () => {
    const report = calculateProgressReportFromSnapshot(makeSnapshot(), baseDate);

    expect(report.attendanceRate).toBe(56.25);
    expect(report.homeworkCompletionRate).toBe(75);
    expect(report.assessmentAverage).toBe(85);
    expect(report.skillAverage).toBe(75);
    expect(report.behaviorScore).toBe(80);
    expect(report.progressScore).toBe(75);
    expect(report.homework).toMatchObject({
      totalAssignments: 4,
      submittedAssignments: 3,
      gradedAssignments: 2,
      missingAssignments: 1,
      lateSubmissions: 1,
    });
    expect(report.dataCompleteness.completenessScore).toBe(100);
  });

  it("does not divide by zero when report data is missing", () => {
    const report = calculateProgressReportFromSnapshot(
      makeSnapshot({
        attendanceRecords: [],
        homeworkRecords: [],
        assessmentRecords: [],
        skillRecords: [],
        latestTutorNote: null,
      }),
      baseDate,
    );

    expect(report.attendanceRate).toBeNull();
    expect(report.homeworkCompletionRate).toBeNull();
    expect(report.assessmentAverage).toBeNull();
    expect(report.skillAverage).toBeNull();
    expect(report.progressScore).toBe(3.5);
    expect(report.dataCompleteness).toMatchObject({
      hasAttendanceData: false,
      hasHomeworkData: false,
      hasAssessmentData: false,
      hasSkillData: false,
      hasTutorNote: false,
      completenessScore: 0,
    });
  });

  it("keeps recommendations deterministic from thresholds", () => {
    const report = calculateProgressReportFromSnapshot(
      makeSnapshot({
        attendanceRecords: [{ status: AttendanceStatus.ABSENT }],
        homeworkRecords: [{ id: "assignment-1", dueAt: dueDate, submission: null }],
        assessmentRecords: [
          {
            id: "assessment-low",
            title: "Quiz low",
            type: AssessmentType.QUIZ,
            score: 20,
            maxScore: 100,
            takenAt: baseDate,
          },
        ],
        skillRecords: [
          {
            skillId: "skill-low",
            skillName: "Fractions",
            skillDescription: null,
            level: SkillLevel.NEEDS_WORK,
            note: null,
            updatedAt: baseDate,
          },
        ],
        latestTutorNote: null,
      }),
      baseDate,
    );

    expect(report.recommendedNextSteps).toContain(
      "Improve attendance consistency for upcoming lessons.",
    );
    expect(report.recommendedNextSteps).toContain(
      "Complete pending assignments before adding new homework.",
    );
    expect(report.recommendedNextSteps).toContain(
      "Review weak assessment topics before the next quiz.",
    );
    expect(report.recommendedNextSteps).toContain(
      "Focus practice on the weakest tracked skills.",
    );
  });

  it("calculates the weighted formula with missing components as zero", () => {
    expect(
      calculateWeightedProgressScore({
        attendanceRate: null,
        homeworkCompletionRate: 80,
        assessmentAverage: 90,
        skillAverage: null,
        behaviorScore: 70,
      }),
    ).toBe(55);
  });
});

describe("progress note service", () => {
  it("lets a tutor create a progress note for an active student in own course", async () => {
    const store = makeProgressNoteStore();

    const note = await createProgressNote(
      "tutor-user-1",
      "student-1",
      "course-1",
      {
        strengths: "Strong algebra setup",
        weaknesses: "Needs word problem practice",
        behaviorNote: "Engaged in class",
        nextPlan: "Practice mixed timed problems",
      },
      store,
    );

    expect(note.note).toBe("Engaged in class");
    expect(note.recommendedNextSteps).toBe(
      "Next plan: Practice mixed timed problems",
    );
    expect(store.count()).toBe(1);
  });

  it("blocks tutors from creating progress notes for unrelated courses or inactive enrollments", async () => {
    const store = makeProgressNoteStore();

    await expect(
      createProgressNote(
        "tutor-user-2",
        "student-1",
        "course-1",
        { behaviorNote: "No access" },
        store,
      ),
    ).rejects.toThrow("own courses");
    await expect(
      createProgressNote(
        "tutor-user-1",
        "student-2",
        "course-1",
        { behaviorNote: "Inactive" },
        store,
      ),
    ).rejects.toThrow("ACTIVE enrolled");
  });
});
