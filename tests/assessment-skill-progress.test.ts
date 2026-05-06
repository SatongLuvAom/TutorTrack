import { describe, expect, it } from "vitest";
import {
  AssessmentType,
  EnrollmentStatus,
  SkillLevel,
} from "../lib/generated/prisma/enums";
import { assessmentCreateSchema } from "../lib/validators/assessment";
import { skillProgressUpdateSchema } from "../lib/validators/skill-progress";
import {
  bulkRecordAssessmentScores,
  createAssessment,
  updateAssessment,
  type AssessmentWriteStore,
} from "../services/assessment.service";
import {
  mapSkillLevelToScore,
  updateStudentSkillProgress,
  type SkillProgressSummary,
  type SkillProgressWriteStore,
} from "../services/skill-progress.service";

const takenAt = new Date("2026-05-05T03:00:00.000Z");

type AssessmentSeedRow = {
  id: string;
  courseId: string;
  studentId: string;
  enrollmentId: string;
  title: string;
  type: AssessmentType;
  takenAt: Date;
  maxScore: number;
  score: number | null;
  note: string | null;
};

function makeAssessmentStore(): AssessmentWriteStore & { rowCount: () => number } {
  const tutorsByUser = new Map([
    ["tutor-user-1", { id: "tutor-1" }],
    ["tutor-user-2", { id: "tutor-2" }],
  ]);
  const courses = new Map([
    ["course-1", { id: "course-1", tutorId: "tutor-1" }],
    ["course-2", { id: "course-2", tutorId: "tutor-2" }],
  ]);
  const enrollments = new Map([
    [
      "course-1:student-1",
      { id: "enrollment-1", studentId: "student-1", courseId: "course-1", status: EnrollmentStatus.ACTIVE },
    ],
    [
      "course-1:student-2",
      { id: "enrollment-2", studentId: "student-2", courseId: "course-1", status: EnrollmentStatus.PENDING },
    ],
    [
      "course-2:student-3",
      { id: "enrollment-3", studentId: "student-3", courseId: "course-2", status: EnrollmentStatus.ACTIVE },
    ],
  ]);
  const assessments = new Map<string, AssessmentSeedRow>([
    [
      "assessment-1",
      {
        id: "assessment-1",
        courseId: "course-1",
        studentId: "student-1",
        enrollmentId: "enrollment-1",
        title: "Algebra quiz",
        type: AssessmentType.QUIZ,
        takenAt,
        maxScore: 100,
        score: 80,
        note: null,
      },
    ],
    [
      "assessment-2",
      {
        id: "assessment-2",
        courseId: "course-2",
        studentId: "student-3",
        enrollmentId: "enrollment-3",
        title: "Geometry quiz",
        type: AssessmentType.QUIZ,
        takenAt,
        maxScore: 100,
        score: null,
        note: null,
      },
    ],
  ]);
  let nextAssessment = 3;

  const store: AssessmentWriteStore & { rowCount: () => number } = {
    async getTutorProfileByUserId(tutorUserId) {
      return tutorsByUser.get(tutorUserId) ?? null;
    },
    async getCourseAccess(courseId) {
      return courses.get(courseId) ?? null;
    },
    async getAssessmentForMutation(assessmentId) {
      const row = assessments.get(assessmentId);
      const course = row ? courses.get(row.courseId) : null;

      if (!row || !course) {
        return null;
      }

      return {
        id: row.id,
        courseId: row.courseId,
        title: row.title,
        type: row.type,
        takenAt: row.takenAt,
        maxScore: row.maxScore,
        courseTutorId: course.tutorId,
      };
    },
    async getActiveEnrollmentsForCourse(courseId) {
      return Array.from(enrollments.values())
        .filter(
          (enrollment) =>
            enrollment.courseId === courseId &&
            enrollment.status === EnrollmentStatus.ACTIVE,
        )
        .map((enrollment) => ({
          id: enrollment.id,
          studentId: enrollment.studentId,
          courseId: enrollment.courseId,
        }));
    },
    async getActiveEnrollmentForStudent(courseId, studentId) {
      const enrollment = enrollments.get(`${courseId}:${studentId}`);

      return enrollment?.status === EnrollmentStatus.ACTIVE
        ? {
            id: enrollment.id,
            studentId: enrollment.studentId,
            courseId: enrollment.courseId,
          }
        : null;
    },
    async countAssessmentGroup(group) {
      return Array.from(assessments.values()).filter(
        (row) =>
          row.courseId === group.courseId &&
          row.title === group.title &&
          row.type === group.type &&
          row.takenAt.getTime() === group.takenAt?.getTime() &&
          row.maxScore === group.maxScore,
      ).length;
    },
    async getGroupScoreValues(group) {
      return Array.from(assessments.values())
        .filter(
          (row) =>
            row.courseId === group.courseId &&
            row.title === group.title &&
            row.type === group.type &&
            row.takenAt.getTime() === group.takenAt?.getTime() &&
            row.maxScore === group.maxScore &&
            row.score !== null,
        )
        .map((row) => row.score ?? 0);
    },
    async createAssessmentRows(rows) {
      const ids = rows.map((row) => {
        const id = `assessment-${nextAssessment++}`;
        assessments.set(id, { id, ...row });
        return id;
      });

      return ids[0] ?? "";
    },
    async updateAssessmentGroup(group, data) {
      for (const [id, row] of assessments) {
        if (
          row.courseId === group.courseId &&
          row.title === group.title &&
          row.type === group.type &&
          row.takenAt.getTime() === group.takenAt?.getTime() &&
          row.maxScore === group.maxScore
        ) {
          assessments.set(id, { ...row, ...data });
        }
      }
    },
    async recordAssessmentScore(group, data) {
      const entry = Array.from(assessments.entries()).find(
        ([, row]) =>
          row.courseId === group.courseId &&
          row.title === group.title &&
          row.type === group.type &&
          row.takenAt.getTime() === group.takenAt?.getTime() &&
          row.maxScore === group.maxScore &&
          row.studentId === data.studentId,
      );

      if (entry) {
        const [id, row] = entry;
        assessments.set(id, { ...row, ...data });
        return;
      }

      const id = `assessment-${nextAssessment++}`;
      assessments.set(id, {
        id,
        courseId: group.courseId,
        title: group.title,
        type: group.type,
        takenAt: group.takenAt ?? takenAt,
        maxScore: group.maxScore,
        studentId: data.studentId,
        enrollmentId: data.enrollmentId,
        score: data.score,
        note: data.note,
      });
    },
    async runInTransaction(callback) {
      return callback(store);
    },
    rowCount() {
      return assessments.size;
    },
  };

  return store;
}

function makeSkillStore(): SkillProgressWriteStore & { count: () => number } {
  const tutorsByUser = new Map([
    ["tutor-user-1", { id: "tutor-1" }],
    ["tutor-user-2", { id: "tutor-2" }],
  ]);
  const courses = new Map([
    ["course-1", { id: "course-1", tutorId: "tutor-1" }],
    ["course-2", { id: "course-2", tutorId: "tutor-2" }],
  ]);
  const skills = new Map([
    ["skill-1", { id: "skill-1", courseId: "course-1", courseTutorId: "tutor-1" }],
    ["skill-2", { id: "skill-2", courseId: "course-2", courseTutorId: "tutor-2" }],
  ]);
  const enrollments = new Map([
    [
      "course-1:student-1",
      { id: "enrollment-1", studentId: "student-1", courseId: "course-1", status: EnrollmentStatus.ACTIVE },
    ],
    [
      "course-1:student-2",
      { id: "enrollment-2", studentId: "student-2", courseId: "course-1", status: EnrollmentStatus.PENDING },
    ],
  ]);
  const progress = new Map<string, SkillProgressSummary>();
  let nextProgress = 1;

  const store: SkillProgressWriteStore & { count: () => number } = {
    async getTutorProfileByUserId(tutorUserId) {
      return tutorsByUser.get(tutorUserId) ?? null;
    },
    async getCourseAccess(courseId) {
      return courses.get(courseId) ?? null;
    },
    async getSkillAccess(skillId) {
      return skills.get(skillId) ?? null;
    },
    async getActiveEnrollmentForStudent(courseId, studentId) {
      const enrollment = enrollments.get(`${courseId}:${studentId}`);

      return enrollment?.status === EnrollmentStatus.ACTIVE
        ? {
            id: enrollment.id,
            studentId: enrollment.studentId,
            courseId: enrollment.courseId,
          }
        : null;
    },
    async upsertStudentSkillProgress(data) {
      const key = `${data.skillId}:${data.studentId}`;
      const row = {
        id: progress.get(key)?.id ?? `progress-${nextProgress++}`,
        skillId: data.skillId,
        studentId: data.studentId,
        enrollmentId: data.enrollmentId,
        level: data.level,
        score: mapSkillLevelToScore(data.level),
        note: data.note,
        evaluatedAt: data.evaluatedAt,
        updatedAt: data.evaluatedAt,
      };
      progress.set(key, row);

      return row;
    },
    async runInTransaction(callback) {
      return callback(store);
    },
    count() {
      return progress.size;
    },
  };

  return store;
}

describe("assessment validation", () => {
  it("requires title, assessment type, max score, and date", () => {
    expect(
      assessmentCreateSchema.safeParse({
        title: "",
        type: AssessmentType.QUIZ,
        maxScore: 100,
        takenAt,
      }).success,
    ).toBe(false);
    expect(
      assessmentCreateSchema.safeParse({
        title: "Quiz",
        type: "WRONG",
        maxScore: 100,
        takenAt,
      }).success,
    ).toBe(false);
  });
});

describe("assessment service", () => {
  it("lets a tutor create assessments for own course active students", async () => {
    const store = makeAssessmentStore();

    await expect(
      createAssessment(
        "tutor-user-1",
        "course-1",
        {
          title: "New quiz",
          type: AssessmentType.QUIZ,
          maxScore: 50,
          takenAt,
        },
        store,
      ),
    ).resolves.toMatch(/^assessment-/);
    expect(store.rowCount()).toBe(3);
  });

  it("blocks tutors from creating or editing another tutor's assessment", async () => {
    const store = makeAssessmentStore();

    await expect(
      createAssessment(
        "tutor-user-1",
        "course-2",
        {
          title: "No access",
          type: AssessmentType.QUIZ,
          maxScore: 50,
          takenAt,
        },
        store,
      ),
    ).rejects.toThrow("permission");
    await expect(
      updateAssessment(
        "tutor-user-1",
        "assessment-2",
        {
          title: "No access",
          type: AssessmentType.QUIZ,
          maxScore: 50,
          takenAt,
        },
        store,
      ),
    ).rejects.toThrow("permission");
  });

  it("records scores only for active enrolled students and validates max score", async () => {
    const store = makeAssessmentStore();

    await expect(
      bulkRecordAssessmentScores("tutor-user-1", "assessment-1", {
        scores: [{ studentId: "student-1", score: 90, note: "Strong" }],
      }, store),
    ).resolves.toBeUndefined();
    await expect(
      bulkRecordAssessmentScores("tutor-user-1", "assessment-1", {
        scores: [{ studentId: "student-2", score: 40 }],
      }, store),
    ).rejects.toThrow("ACTIVE enrolled");
    await expect(
      bulkRecordAssessmentScores("tutor-user-1", "assessment-1", {
        scores: [{ studentId: "student-1", score: 120 }],
      }, store),
    ).rejects.toThrow("max score");
  });

  it("rejects max score edits below existing scores", async () => {
    await expect(
      updateAssessment(
        "tutor-user-1",
        "assessment-1",
        {
          title: "Algebra quiz",
          type: AssessmentType.QUIZ,
          maxScore: 70,
          takenAt,
        },
        makeAssessmentStore(),
      ),
    ).rejects.toThrow("max score");
  });
});

describe("skill progress validation", () => {
  it("requires a valid skill level", () => {
    expect(
      skillProgressUpdateSchema.safeParse({
        studentId: "student-1",
        courseId: "course-1",
        skillId: "skill-1",
        level: "ADVANCED",
      }).success,
    ).toBe(false);
  });
});

describe("skill progress service", () => {
  it("maps skill levels to deterministic scores", () => {
    expect(mapSkillLevelToScore(SkillLevel.NEEDS_WORK)).toBe(25);
    expect(mapSkillLevelToScore(SkillLevel.BASIC)).toBe(50);
    expect(mapSkillLevelToScore(SkillLevel.GOOD)).toBe(75);
    expect(mapSkillLevelToScore(SkillLevel.EXCELLENT)).toBe(100);
  });

  it("lets a tutor update skill progress for active enrolled students", async () => {
    const store = makeSkillStore();

    const first = await updateStudentSkillProgress(
      "tutor-user-1",
      "student-1",
      "course-1",
      "skill-1",
      { level: SkillLevel.GOOD, note: "Improving" },
      store,
    );
    const second = await updateStudentSkillProgress(
      "tutor-user-1",
      "student-1",
      "course-1",
      "skill-1",
      { level: SkillLevel.EXCELLENT, note: "Excellent" },
      store,
    );

    expect(first.id).toBe(second.id);
    expect(second.score).toBe(100);
    expect(store.count()).toBe(1);
  });

  it("blocks skill updates for another tutor, unrelated skill, or non-active enrollment", async () => {
    const store = makeSkillStore();

    await expect(
      updateStudentSkillProgress(
        "tutor-user-2",
        "student-1",
        "course-1",
        "skill-1",
        { level: SkillLevel.GOOD },
        store,
      ),
    ).rejects.toThrow("permission");
    await expect(
      updateStudentSkillProgress(
        "tutor-user-1",
        "student-1",
        "course-1",
        "skill-2",
        { level: SkillLevel.GOOD },
        store,
      ),
    ).rejects.toThrow("Skill does not belong");
    await expect(
      updateStudentSkillProgress(
        "tutor-user-1",
        "student-2",
        "course-1",
        "skill-1",
        { level: SkillLevel.GOOD },
        store,
      ),
    ).rejects.toThrow("ACTIVE enrolled");
  });
});
