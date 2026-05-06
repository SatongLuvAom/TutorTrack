import {
  AssessmentType,
  AttendanceStatus,
  EnrollmentStatus,
  SkillLevel,
} from "@/lib/generated/prisma/client";
import { getDb } from "@/lib/db";
import {
  canViewProgressReport,
  type PermissionUser,
} from "@/lib/permissions";
import { mapSkillLevelToScore } from "@/services/skill-progress.service";

type DecimalLike = { toString(): string } | number | string | null | undefined;

export type ProgressAttendanceRecord = {
  status: AttendanceStatus;
};

export type ProgressHomeworkRecord = {
  id: string;
  dueAt: Date | null;
  submission: {
    submittedAt: Date;
    gradedAt: Date | null;
  } | null;
};

export type ProgressAssessmentRecord = {
  id: string;
  title: string;
  type: AssessmentType;
  score: number | null;
  maxScore: number;
  takenAt: Date | null;
};

export type ProgressSkillRecord = {
  skillId: string;
  skillName: string;
  skillDescription: string | null;
  level: SkillLevel;
  note: string | null;
  updatedAt: Date;
};

export type ProgressReportNote = {
  id: string;
  note: string;
  strengths: string | null;
  weaknesses: string | null;
  recommendedNextSteps: string | null;
  tutorName: string;
  createdAt: Date;
};

export type ProgressReportSnapshot = {
  studentId: string;
  courseId: string;
  courseTitle: string;
  tutorName: string;
  subjectName: string;
  attendanceRecords: ProgressAttendanceRecord[];
  homeworkRecords: ProgressHomeworkRecord[];
  assessmentRecords: ProgressAssessmentRecord[];
  skillRecords: ProgressSkillRecord[];
  latestTutorNote: ProgressReportNote | null;
};

export type AttendanceProgressSummary = {
  totalAttendanceRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number | null;
};

export type HomeworkProgressSummary = {
  totalAssignments: number;
  submittedAssignments: number;
  gradedAssignments: number;
  missingAssignments: number;
  lateSubmissions: number;
  homeworkCompletionRate: number | null;
};

export type AssessmentProgressItem = ProgressAssessmentRecord & {
  percentage: number | null;
};

export type AssessmentTypeBreakdown = {
  totalAssessments: number;
  scoredAssessments: number;
  averagePercentage: number | null;
};

export type AssessmentProgressSummary = {
  totalAssessments: number;
  scoredAssessments: number;
  averagePercentage: number | null;
  latestAssessment: AssessmentProgressItem | null;
  assessmentBreakdownByType: Record<AssessmentType, AssessmentTypeBreakdown>;
};

export type SkillMatrixItem = {
  skillId: string;
  skillName: string;
  skillDescription: string | null;
  level: SkillLevel;
  score: number;
  note: string | null;
  updatedAt: Date;
};

export type SkillProgressSummary = {
  skillMatrix: SkillMatrixItem[];
  strongestSkills: SkillMatrixItem[];
  weakestSkills: SkillMatrixItem[];
  skillAverage: number | null;
};

export type ProgressDataCompleteness = {
  hasAttendanceData: boolean;
  hasHomeworkData: boolean;
  hasAssessmentData: boolean;
  hasSkillData: boolean;
  hasTutorNote: boolean;
  completenessScore: number;
};

export type ProgressReport = {
  studentId: string;
  courseId: string;
  courseTitle: string;
  tutorName: string;
  subjectName: string;
  progressScore: number;
  attendanceRate: number | null;
  homeworkCompletionRate: number | null;
  assessmentAverage: number | null;
  skillAverage: number | null;
  behaviorScore: number;
  attendance: AttendanceProgressSummary;
  homework: HomeworkProgressSummary;
  assessments: AssessmentProgressSummary;
  skillMatrix: SkillMatrixItem[];
  strengths: string[];
  weaknesses: string[];
  latestTutorNote: ProgressReportNote | null;
  recommendedNextSteps: string[];
  dataCompleteness: ProgressDataCompleteness;
  generatedAt: Date;
};

export type ProgressReportStore = {
  getPermissionUserById(userId: string): Promise<PermissionUser | null>;
  getProgressReportSnapshot(
    studentId: string,
    courseId: string,
  ): Promise<ProgressReportSnapshot | null>;
};

export type ProgressReportErrorCode = "FORBIDDEN";

export class ProgressReportError extends Error {
  constructor(
    readonly code: ProgressReportErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ProgressReportError";
  }
}

const assessmentTypes = [
  AssessmentType.PRE_TEST,
  AssessmentType.QUIZ,
  AssessmentType.MOCK_EXAM,
  AssessmentType.POST_TEST,
] as const;

function decimalToNumber(value: DecimalLike): number | null {
  return value === null || value === undefined ? null : Number(value);
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function scoreForFormula(value: number | null): number {
  return value ?? 0;
}

function percentage(score: number | null, maxScore: number): number | null {
  if (score === null || maxScore <= 0) {
    return null;
  }

  return roundToTwo((score / maxScore) * 100);
}

export function calculateAttendanceProgress(
  records: ProgressAttendanceRecord[],
): AttendanceProgressSummary {
  const counts = {
    [AttendanceStatus.PRESENT]: 0,
    [AttendanceStatus.ABSENT]: 0,
    [AttendanceStatus.LATE]: 0,
    [AttendanceStatus.EXCUSED]: 0,
  };

  for (const record of records) {
    counts[record.status] += 1;
  }

  const totalAttendanceRecords = records.length;
  const weightedAttendance =
    counts.PRESENT * 100 + counts.LATE * 75 + counts.EXCUSED * 50;

  return {
    totalAttendanceRecords,
    presentCount: counts.PRESENT,
    absentCount: counts.ABSENT,
    lateCount: counts.LATE,
    excusedCount: counts.EXCUSED,
    attendanceRate:
      totalAttendanceRecords === 0
        ? null
        : roundToTwo(weightedAttendance / totalAttendanceRecords),
  };
}

export function calculateHomeworkProgress(
  records: ProgressHomeworkRecord[],
): HomeworkProgressSummary {
  const submittedAssignments = records.filter((record) =>
    Boolean(record.submission),
  ).length;
  const gradedAssignments = records.filter((record) =>
    Boolean(record.submission?.gradedAt),
  ).length;
  const lateSubmissions = records.filter(
    (record) =>
      record.submission &&
      record.dueAt &&
      record.submission.submittedAt.getTime() > record.dueAt.getTime(),
  ).length;
  const totalAssignments = records.length;

  return {
    totalAssignments,
    submittedAssignments,
    gradedAssignments,
    missingAssignments: Math.max(totalAssignments - submittedAssignments, 0),
    lateSubmissions,
    homeworkCompletionRate:
      totalAssignments === 0
        ? null
        : roundToTwo((submittedAssignments / totalAssignments) * 100),
  };
}

export function calculateAssessmentProgress(
  records: ProgressAssessmentRecord[],
): AssessmentProgressSummary {
  const items: AssessmentProgressItem[] = records.map((record) => ({
    ...record,
    percentage: percentage(record.score, record.maxScore),
  }));
  const scoredPercentages = items
    .map((item) => item.percentage)
    .filter((value): value is number => value !== null);
  const assessmentBreakdownByType = Object.fromEntries(
    assessmentTypes.map((type) => {
      const typed = items.filter((item) => item.type === type);
      const typedScores = typed
        .map((item) => item.percentage)
        .filter((value): value is number => value !== null);

      return [
        type,
        {
          totalAssessments: typed.length,
          scoredAssessments: typedScores.length,
          averagePercentage:
            typedScores.length === 0
              ? null
              : roundToTwo(
                  typedScores.reduce((sum, value) => sum + value, 0) /
                    typedScores.length,
                ),
        },
      ];
    }),
  ) as Record<AssessmentType, AssessmentTypeBreakdown>;
  const latestAssessment =
    [...items].sort(
      (left, right) =>
        (right.takenAt?.getTime() ?? 0) - (left.takenAt?.getTime() ?? 0),
    )[0] ?? null;

  return {
    totalAssessments: items.length,
    scoredAssessments: scoredPercentages.length,
    averagePercentage:
      scoredPercentages.length === 0
        ? null
        : roundToTwo(
            scoredPercentages.reduce((sum, value) => sum + value, 0) /
              scoredPercentages.length,
          ),
    latestAssessment,
    assessmentBreakdownByType,
  };
}

export function calculateSkillProgress(
  records: ProgressSkillRecord[],
): SkillProgressSummary {
  const skillMatrix = records
    .map((record) => ({
      skillId: record.skillId,
      skillName: record.skillName,
      skillDescription: record.skillDescription,
      level: record.level,
      score: mapSkillLevelToScore(record.level),
      note: record.note,
      updatedAt: record.updatedAt,
    }))
    .sort((left, right) => left.skillName.localeCompare(right.skillName));
  const strongestSkills = skillMatrix
    .filter((skill) => skill.level === SkillLevel.GOOD || skill.level === SkillLevel.EXCELLENT)
    .sort((left, right) => right.score - left.score || left.skillName.localeCompare(right.skillName));
  const weakestSkills = skillMatrix
    .filter((skill) => skill.level === SkillLevel.NEEDS_WORK || skill.level === SkillLevel.BASIC)
    .sort((left, right) => left.score - right.score || left.skillName.localeCompare(right.skillName));

  return {
    skillMatrix,
    strongestSkills,
    weakestSkills,
    skillAverage:
      skillMatrix.length === 0
        ? null
        : roundToTwo(
            skillMatrix.reduce((sum, skill) => sum + skill.score, 0) /
              skillMatrix.length,
          ),
  };
}

export function calculateBehaviorScore(
  latestTutorNote: ProgressReportNote | null,
): number {
  return latestTutorNote ? 80 : 70;
}

export function calculateWeightedProgressScore(input: {
  attendanceRate: number | null;
  homeworkCompletionRate: number | null;
  assessmentAverage: number | null;
  skillAverage: number | null;
  behaviorScore: number;
}): number {
  return roundToTwo(
    scoreForFormula(input.attendanceRate) * 0.2 +
      scoreForFormula(input.homeworkCompletionRate) * 0.25 +
      scoreForFormula(input.assessmentAverage) * 0.35 +
      scoreForFormula(input.skillAverage) * 0.15 +
      input.behaviorScore * 0.05,
  );
}

function calculateDataCompleteness(input: {
  attendance: AttendanceProgressSummary;
  homework: HomeworkProgressSummary;
  assessments: AssessmentProgressSummary;
  skill: SkillProgressSummary;
  latestTutorNote: ProgressReportNote | null;
}): ProgressDataCompleteness {
  const hasAttendanceData = input.attendance.totalAttendanceRecords > 0;
  const hasHomeworkData = input.homework.totalAssignments > 0;
  const hasAssessmentData = input.assessments.scoredAssessments > 0;
  const hasSkillData = input.skill.skillMatrix.length > 0;

  return {
    hasAttendanceData,
    hasHomeworkData,
    hasAssessmentData,
    hasSkillData,
    hasTutorNote: Boolean(input.latestTutorNote),
    completenessScore:
      (hasAttendanceData ? 25 : 0) +
      (hasHomeworkData ? 25 : 0) +
      (hasAssessmentData ? 25 : 0) +
      (hasSkillData ? 25 : 0),
  };
}

function deriveStrengths(
  skill: SkillProgressSummary,
  latestTutorNote: ProgressReportNote | null,
): string[] {
  const strengths = [
    latestTutorNote?.strengths ?? null,
    ...skill.strongestSkills.map(
      (item) => `${item.skillName}: ${item.level}`,
    ),
  ].filter((value): value is string => Boolean(value));

  return strengths.length > 0 ? strengths : ["Not enough data yet."];
}

function deriveWeaknesses(
  skill: SkillProgressSummary,
  latestTutorNote: ProgressReportNote | null,
): string[] {
  const weaknesses = [
    latestTutorNote?.weaknesses ?? null,
    ...skill.weakestSkills.map((item) => `${item.skillName}: ${item.level}`),
  ].filter((value): value is string => Boolean(value));

  return weaknesses.length > 0 ? weaknesses : ["Not enough data yet."];
}

function deriveRecommendedNextSteps(input: {
  attendanceRate: number | null;
  homeworkCompletionRate: number | null;
  assessmentAverage: number | null;
  skillAverage: number | null;
  latestTutorNote: ProgressReportNote | null;
  completeness: ProgressDataCompleteness;
}): string[] {
  const steps: string[] = [];

  if (input.latestTutorNote?.recommendedNextSteps) {
    steps.push(input.latestTutorNote.recommendedNextSteps);
  }

  if (input.attendanceRate !== null && input.attendanceRate < 80) {
    steps.push("Improve attendance consistency for upcoming lessons.");
  }

  if (
    input.homeworkCompletionRate !== null &&
    input.homeworkCompletionRate < 70
  ) {
    steps.push("Complete pending assignments before adding new homework.");
  }

  if (input.assessmentAverage !== null && input.assessmentAverage < 70) {
    steps.push("Review weak assessment topics before the next quiz.");
  }

  if (input.skillAverage !== null && input.skillAverage < 70) {
    steps.push("Focus practice on the weakest tracked skills.");
  }

  if (input.completeness.completenessScore < 50) {
    steps.push(
      "Collect more attendance, homework, assessment, and skill data before making high-stakes decisions.",
    );
  }

  return steps.length > 0
    ? Array.from(new Set(steps))
    : ["Continue regular practice and add periodic mock tests."];
}

export function calculateProgressReportFromSnapshot(
  snapshot: ProgressReportSnapshot,
  generatedAt = new Date(),
): ProgressReport {
  const attendance = calculateAttendanceProgress(snapshot.attendanceRecords);
  const homework = calculateHomeworkProgress(snapshot.homeworkRecords);
  const assessments = calculateAssessmentProgress(snapshot.assessmentRecords);
  const skill = calculateSkillProgress(snapshot.skillRecords);
  const behaviorScore = calculateBehaviorScore(snapshot.latestTutorNote);
  const dataCompleteness = calculateDataCompleteness({
    attendance,
    homework,
    assessments,
    skill,
    latestTutorNote: snapshot.latestTutorNote,
  });
  const progressScore = calculateWeightedProgressScore({
    attendanceRate: attendance.attendanceRate,
    homeworkCompletionRate: homework.homeworkCompletionRate,
    assessmentAverage: assessments.averagePercentage,
    skillAverage: skill.skillAverage,
    behaviorScore,
  });

  return {
    studentId: snapshot.studentId,
    courseId: snapshot.courseId,
    courseTitle: snapshot.courseTitle,
    tutorName: snapshot.tutorName,
    subjectName: snapshot.subjectName,
    progressScore,
    attendanceRate: attendance.attendanceRate,
    homeworkCompletionRate: homework.homeworkCompletionRate,
    assessmentAverage: assessments.averagePercentage,
    skillAverage: skill.skillAverage,
    behaviorScore,
    attendance,
    homework,
    assessments,
    skillMatrix: skill.skillMatrix,
    strengths: deriveStrengths(skill, snapshot.latestTutorNote),
    weaknesses: deriveWeaknesses(skill, snapshot.latestTutorNote),
    latestTutorNote: snapshot.latestTutorNote,
    recommendedNextSteps: deriveRecommendedNextSteps({
      attendanceRate: attendance.attendanceRate,
      homeworkCompletionRate: homework.homeworkCompletionRate,
      assessmentAverage: assessments.averagePercentage,
      skillAverage: skill.skillAverage,
      latestTutorNote: snapshot.latestTutorNote,
      completeness: dataCompleteness,
    }),
    dataCompleteness,
    generatedAt,
  };
}

export const prismaProgressReportStore: ProgressReportStore = {
  async getPermissionUserById(userId) {
    const user = await getDb().user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        studentProfile: { select: { id: true } },
        parentProfile: { select: { id: true } },
        tutorProfile: { select: { id: true } },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      role: user.role,
      studentProfileId: user.studentProfile?.id ?? null,
      parentProfileId: user.parentProfile?.id ?? null,
      tutorProfileId: user.tutorProfile?.id ?? null,
    };
  },

  async getProgressReportSnapshot(studentId, courseId) {
    const course = await getDb().course.findFirst({
      where: {
        id: courseId,
        enrollments: {
          some: { studentId, status: EnrollmentStatus.ACTIVE },
        },
      },
      select: {
        id: true,
        title: true,
        subject: { select: { name: true } },
        tutor: {
          select: {
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!course) {
      return null;
    }

    const [
      attendanceRows,
      assignmentRows,
      assessmentRows,
      skillRows,
      latestNote,
    ] = await Promise.all([
      getDb().attendance.findMany({
        where: {
          studentId,
          session: { courseId },
          enrollment: { courseId, status: EnrollmentStatus.ACTIVE },
        },
        select: { status: true },
      }),
      getDb().assignment.findMany({
        where: { courseId },
        orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          dueAt: true,
          submissions: {
            where: {
              studentId,
              enrollment: { courseId, status: EnrollmentStatus.ACTIVE },
            },
            take: 1,
            select: {
              submittedAt: true,
              gradedAt: true,
            },
          },
        },
      }),
      getDb().assessment.findMany({
        where: {
          courseId,
          studentId,
          enrollment: { status: EnrollmentStatus.ACTIVE },
        },
        orderBy: [{ takenAt: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          type: true,
          score: true,
          maxScore: true,
          takenAt: true,
        },
      }),
      getDb().studentSkillProgress.findMany({
        where: {
          studentId,
          enrollment: { courseId, status: EnrollmentStatus.ACTIVE },
          skill: { courseId },
        },
        select: {
          level: true,
          note: true,
          updatedAt: true,
          skill: {
            select: {
              id: true,
              name: true,
              description: true,
              sortOrder: true,
            },
          },
        },
      }),
      getDb().progressNote.findFirst({
        where: {
          courseId,
          studentId,
          enrollment: { status: EnrollmentStatus.ACTIVE },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          note: true,
          strengths: true,
          weaknesses: true,
          recommendedNextSteps: true,
          createdAt: true,
          tutor: {
            select: {
              user: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    return {
      studentId,
      courseId: course.id,
      courseTitle: course.title,
      tutorName: course.tutor.user.name,
      subjectName: course.subject.name,
      attendanceRecords: attendanceRows,
      homeworkRecords: assignmentRows.map((assignment) => ({
        id: assignment.id,
        dueAt: assignment.dueAt,
        submission: assignment.submissions[0] ?? null,
      })),
      assessmentRecords: assessmentRows.map((assessment) => ({
        id: assessment.id,
        title: assessment.title,
        type: assessment.type,
        score: decimalToNumber(assessment.score),
        maxScore: decimalToNumber(assessment.maxScore) ?? 0,
        takenAt: assessment.takenAt,
      })),
      skillRecords: skillRows
        .map((row) => ({
          skillId: row.skill.id,
          skillName: row.skill.name,
          skillDescription: row.skill.description,
          level: row.level,
          note: row.note,
          updatedAt: row.updatedAt,
          sortOrder: row.skill.sortOrder,
        }))
        .sort(
          (left, right) =>
            left.sortOrder - right.sortOrder ||
            left.skillName.localeCompare(right.skillName),
        )
        .map((row) => ({
          skillId: row.skillId,
          skillName: row.skillName,
          skillDescription: row.skillDescription,
          level: row.level,
          note: row.note,
          updatedAt: row.updatedAt,
        })),
      latestTutorNote: latestNote
        ? {
            id: latestNote.id,
            note: latestNote.note,
            strengths: latestNote.strengths,
            weaknesses: latestNote.weaknesses,
            recommendedNextSteps: latestNote.recommendedNextSteps,
            tutorName: latestNote.tutor.user.name,
            createdAt: latestNote.createdAt,
          }
        : null,
    };
  },
};

export async function calculateProgressReport(
  studentId: string,
  courseId: string,
  viewerUserId?: string,
  store: ProgressReportStore = prismaProgressReportStore,
): Promise<ProgressReport | null> {
  if (viewerUserId) {
    const viewer = await store.getPermissionUserById(viewerUserId);
    if (!(await canViewProgressReport(viewer, studentId, courseId))) {
      throw new ProgressReportError(
        "FORBIDDEN",
        "You do not have permission to view this progress report.",
      );
    }
  }

  const snapshot = await store.getProgressReportSnapshot(studentId, courseId);

  return snapshot ? calculateProgressReportFromSnapshot(snapshot) : null;
}
