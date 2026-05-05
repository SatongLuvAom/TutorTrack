import { describe, expect, it } from "vitest";
import {
  CourseStatus,
  CourseType,
  TutorVerificationStatus,
  UserRole,
} from "../lib/generated/prisma/enums";
import {
  buildPublicCourseDetailWhere,
  buildPublicCourseWhere,
  parseCourseFilters,
} from "../services/course.service";
import {
  getLevelTagsFromText,
  getPublicReviewerLabel,
} from "../services/marketplace-utils";
import {
  buildPublicTutorDetailWhere,
  buildPublicTutorWhere,
  parseTutorFilters,
} from "../services/tutor.service";

function expectAndArray<T>(value: { AND?: T | T[] }) {
  expect(Array.isArray(value.AND)).toBe(true);

  return value.AND as T[];
}

describe("marketplace filter parsing", () => {
  it("parses and normalizes tutor filters", () => {
    const filters = parseTutorFilters({
      search: "  math  ",
      subject: "mathematics",
      level: "exam-prep",
      minPrice: "1200",
      maxPrice: "800",
      rating: "4.5",
      sort: "rating",
    });

    expect(filters).toEqual({
      search: "math",
      subject: "mathematics",
      level: "exam-prep",
      minPrice: 800,
      maxPrice: 1200,
      rating: 4.5,
      sort: "rating",
    });
  });

  it("ignores invalid tutor filter parameters instead of throwing", () => {
    expect(() =>
      parseTutorFilters({
        search: "x".repeat(200),
        level: "not-a-level",
        minPrice: "abc",
        maxPrice: "-50",
        rating: "9",
        sort: "bad-sort",
      }),
    ).not.toThrow();

    expect(
      parseTutorFilters({
        search: "x".repeat(200),
        level: "not-a-level",
        minPrice: "abc",
        maxPrice: "-50",
        rating: "9",
        sort: "bad-sort",
      }),
    ).toEqual({ sort: "recommended" });
  });

  it("parses and normalizes course filters", () => {
    const filters = parseCourseFilters({
      search: " physics ",
      subject: "physics",
      level: "high-school",
      type: CourseType.GROUP,
      minPrice: "7000",
      maxPrice: "5000",
      sort: "price-desc",
    });

    expect(filters).toEqual({
      search: "physics",
      subject: "physics",
      level: "high-school",
      type: CourseType.GROUP,
      minPrice: 5000,
      maxPrice: 7000,
      sort: "price-desc",
    });
  });

  it("ignores invalid course filter parameters instead of throwing", () => {
    expect(() =>
      parseCourseFilters({
        subject: "x".repeat(200),
        level: "not-a-level",
        type: "WEBINAR",
        minPrice: "abc",
        maxPrice: "-1",
        sort: "bad-sort",
      }),
    ).not.toThrow();

    expect(
      parseCourseFilters({
        subject: "x".repeat(200),
        level: "not-a-level",
        type: "WEBINAR",
        minPrice: "abc",
        maxPrice: "-1",
        sort: "bad-sort",
      }),
    ).toEqual({ sort: "newest" });
  });

  it("derives course levels from public course text", () => {
    expect(getLevelTagsFromText("SAT Math Private Bootcamp")).toContain(
      "international",
    );
    expect(getLevelTagsFromText("ฟิสิกส์ ม.4 กลศาสตร์เข้าใจจริง")).toContain(
      "high-school",
    );
    expect(getLevelTagsFromText("คณิต ม.3 พื้นฐานแน่นก่อนสอบเข้า")).toEqual(
      expect.arrayContaining(["middle-school", "exam-prep"]),
    );
  });

  it("does not expose private reviewer names in public labels", () => {
    expect(getPublicReviewerLabel(UserRole.STUDENT)).toBe("TutorTrack student");
    expect(getPublicReviewerLabel(UserRole.PARENT)).toBe("TutorTrack parent");
  });
});

describe("marketplace visibility rules", () => {
  it("builds tutor listing queries for approved tutors only", () => {
    const where = buildPublicTutorWhere(parseTutorFilters({}));
    const and = expectAndArray(where);

    expect(and).toEqual(
      expect.arrayContaining([
        { verificationStatus: TutorVerificationStatus.APPROVED },
      ]),
    );
  });

  it("builds tutor detail queries that hide non-approved tutors", () => {
    expect(buildPublicTutorDetailWhere("tutor-1")).toEqual({
      id: "tutor-1",
      verificationStatus: TutorVerificationStatus.APPROVED,
    });
  });

  it("builds course listing queries for published courses from approved tutors only", () => {
    const where = buildPublicCourseWhere(parseCourseFilters({}));
    const and = expectAndArray(where);

    expect(and).toEqual(
      expect.arrayContaining([
        {
          status: CourseStatus.PUBLISHED,
          tutor: { verificationStatus: TutorVerificationStatus.APPROVED },
        },
      ]),
    );
  });

  it("builds course detail queries that hide draft and archived courses", () => {
    expect(buildPublicCourseDetailWhere("course-1")).toEqual({
      id: "course-1",
      status: CourseStatus.PUBLISHED,
      tutor: { verificationStatus: TutorVerificationStatus.APPROVED },
    });
  });
});
