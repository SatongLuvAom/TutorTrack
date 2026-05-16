import type { MarketplaceLevel, RatingSummary } from "@/types/marketplace";
import {
  UserRole,
  type UserRole as UserRoleType,
} from "@/lib/generated/prisma/enums";
import { courseLevelOptions } from "@/lib/validators/course";

export const MARKETPLACE_LEVEL_OPTIONS: Array<{
  value: MarketplaceLevel;
  label: string;
}> = [
  { value: "middle-school", label: "ม.ต้น" },
  { value: "high-school", label: "ม.ปลาย" },
  { value: "exam-prep", label: "เตรียมสอบ" },
  { value: "international", label: "International / SAT" },
  { value: "all-levels", label: "ทุกระดับ" },
];

const levelLabels = new Map(
  MARKETPLACE_LEVEL_OPTIONS.map((option) => [option.value, option.label]),
);

export function formatPrice(cents: number | null | undefined): string {
  if (typeof cents !== "number") {
    return "สอบถามราคา";
  }

  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatRating(rating: RatingSummary): string {
  if (rating.count === 0) {
    return "ยังไม่มีรีวิว";
  }

  return `${rating.average.toFixed(1)} (${rating.count})`;
}

export function averageRating(
  reviews: Array<{ rating: number }>,
): RatingSummary {
  if (reviews.length === 0) {
    return { average: 0, count: 0 };
  }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);

  return {
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
  };
}

export function getLevelLabel(levels: MarketplaceLevel[]): string {
  if (levels.length === 0) {
    return levelLabels.get("all-levels") ?? "ทุกระดับ";
  }

  return levels.map((level) => levelLabels.get(level) ?? level).join(", ");
}

export function isMarketplaceLevel(value: string): value is MarketplaceLevel {
  return courseLevelOptions.includes(value as MarketplaceLevel);
}

export function getLevelTagsFromStoredLevel(
  level: string | null | undefined,
  ...fallbackValues: Array<string | null | undefined>
): MarketplaceLevel[] {
  if (level && isMarketplaceLevel(level)) {
    return [level];
  }

  return getLevelTagsFromText(...fallbackValues);
}

export function getLevelTagsFromText(
  ...values: Array<string | null | undefined>
) {
  const text = values.filter(Boolean).join(" ").toLowerCase();
  const levels = new Set<MarketplaceLevel>();

  if (/ม\.?ต้น|ม\.?[1-3]|middle/.test(text)) {
    levels.add("middle-school");
  }

  if (/ม\.?ปลาย|ม\.?[4-6]|high/.test(text)) {
    levels.add("high-school");
  }

  if (/สอบ|entrance|เตรียมสอบ|mock|quiz/.test(text)) {
    levels.add("exam-prep");
  }

  if (/sat|ielts|toefl|international/.test(text)) {
    levels.add("international");
  }

  if (levels.size === 0) {
    levels.add("all-levels");
  }

  return Array.from(levels);
}

export function getTeachingStyleSummary(
  headline: string | null,
  bio: string | null,
): string {
  const text = `${headline ?? ""} ${bio ?? ""}`.toLowerCase();

  if (text.includes("โค้ช") || text.includes("diagnostic")) {
    return "โค้ชโจทย์เป็นขั้นตอน วัดจุดอ่อน และปรับแผนรายคน";
  }

  if (text.includes("ระบบ") || text.includes("พื้นฐาน")) {
    return "ปูพื้นฐานเป็นระบบ ใช้โจทย์ไล่ระดับจนจับหลักได้";
  }

  if (text.includes("activity")) {
    return "เรียนผ่านกิจกรรมและการสื่อสาร เหมาะกับผู้เรียนที่ต้องการความมั่นใจ";
  }

  return "สอนแบบเน้นเป้าหมายผู้เรียน พร้อมติดตามความก้าวหน้าอย่างต่อเนื่อง";
}

export function normalizeSearchText(
  value: string | undefined,
): string | undefined {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
}

export function priceToCents(value: number | undefined): number | undefined {
  return typeof value === "number" ? Math.round(value * 100) : undefined;
}

export function getPublicReviewerLabel(role: UserRoleType): string {
  if (role === UserRole.STUDENT) {
    return "TutorTrack student";
  }

  if (role === UserRole.PARENT) {
    return "TutorTrack parent";
  }

  return "TutorTrack member";
}
