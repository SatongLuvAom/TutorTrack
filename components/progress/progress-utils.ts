import { SkillLevel } from "@/lib/generated/prisma/enums";
import type { ProgressDataCompleteness } from "@/services/progress.service";

export type ProgressScoreStatus =
  | "excellent"
  | "good"
  | "needs-attention"
  | "at-risk"
  | "not-enough-data";

export function clampProgressScore(score: number | null | undefined): number {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, score));
}

export function getProgressScoreStatus(
  score: number | null | undefined,
  completenessScore = 100,
): ProgressScoreStatus {
  if (
    score === null ||
    score === undefined ||
    Number.isNaN(score) ||
    completenessScore === 0
  ) {
    return "not-enough-data";
  }

  if (score >= 85) {
    return "excellent";
  }

  if (score >= 70) {
    return "good";
  }

  if (score >= 50) {
    return "needs-attention";
  }

  return "at-risk";
}

export function getProgressScoreLabel(status: ProgressScoreStatus): string {
  const labels: Record<ProgressScoreStatus, string> = {
    excellent: "Excellent",
    good: "Good",
    "needs-attention": "Needs Attention",
    "at-risk": "At Risk",
    "not-enough-data": "Not enough data",
  };

  return labels[status];
}

export function getProgressToneClasses(status: ProgressScoreStatus): string {
  const classes: Record<ProgressScoreStatus, string> = {
    excellent: "border-emerald-200 bg-emerald-50 text-emerald-700",
    good: "border-sky-200 bg-sky-50 text-sky-700",
    "needs-attention": "border-amber-200 bg-amber-50 text-amber-700",
    "at-risk": "border-rose-200 bg-rose-50 text-rose-700",
    "not-enough-data": "border-border bg-muted text-muted-foreground",
  };

  return classes[status];
}

export function getProgressBarClasses(status: ProgressScoreStatus): string {
  const classes: Record<ProgressScoreStatus, string> = {
    excellent: "bg-emerald-500",
    good: "bg-sky-500",
    "needs-attention": "bg-amber-500",
    "at-risk": "bg-rose-500",
    "not-enough-data": "bg-muted-foreground/40",
  };

  return classes[status];
}

export function formatMetricPercent(
  value: number | null | undefined,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "No data";
  }

  return `${Math.round(value)}%`;
}

export function formatProgressScore(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return "--";
  }

  return `${Math.round(score)}`;
}

export function formatProgressDate(value: Date | string | null): string {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getMissingDataLabels(
  data: ProgressDataCompleteness,
): string[] {
  const missing = [
    data.hasAttendanceData ? null : "attendance",
    data.hasHomeworkData ? null : "homework",
    data.hasAssessmentData ? null : "assessments",
    data.hasSkillData ? null : "skill progress",
    data.hasTutorNote ? null : "tutor note",
  ].filter((value): value is string => Boolean(value));

  return missing;
}

export function getSkillLevelLabel(level: SkillLevel): string {
  const labels: Record<SkillLevel, string> = {
    NEEDS_WORK: "Needs work",
    BASIC: "Basic",
    GOOD: "Good",
    EXCELLENT: "Excellent",
  };

  return labels[level];
}

export function toParentProgressMessage(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("attendance")) {
    return "เข้าเรียนสม่ำเสมอมากขึ้นจะช่วยให้ตามบทเรียนทัน";
  }

  if (lower.includes("assignment") || lower.includes("homework")) {
    return "ควรส่งงานให้ครบมากขึ้น";
  }

  if (
    lower.includes("assessment") ||
    lower.includes("quiz") ||
    lower.includes("mock")
  ) {
    return "ควรทบทวนหัวข้อที่ยังอ่อนก่อนแบบทดสอบครั้งถัดไป";
  }

  if (lower.includes("skill")) {
    return "ควรฝึกทักษะที่ยังไม่มั่นใจเพิ่ม";
  }

  if (lower.includes("collect more")) {
    return "ข้อมูลยังน้อย ควรรอข้อมูลจากบทเรียนถัดไปเพิ่มเติม";
  }

  return message;
}
