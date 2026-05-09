import { isValidElement } from "react";
import { describe, expect, it } from "vitest";
import { SkillLevel } from "@/lib/generated/prisma/enums";
import { SkillMatrix } from "@/components/progress/skill-matrix";
import {
  formatMetricPercent,
  getMissingDataLabels,
  getProgressScoreLabel,
  getProgressScoreStatus,
  getSkillLevelLabel,
  toParentProgressMessage,
} from "@/components/progress/progress-utils";
import { parseProgressOverviewFilters } from "@/services/progress.service";

describe("progress UI helpers", () => {
  it("maps score ranges to progress labels", () => {
    expect(getProgressScoreLabel(getProgressScoreStatus(95, 100))).toBe(
      "Excellent",
    );
    expect(getProgressScoreLabel(getProgressScoreStatus(72, 100))).toBe(
      "Good",
    );
    expect(getProgressScoreLabel(getProgressScoreStatus(60, 100))).toBe(
      "Needs Attention",
    );
    expect(getProgressScoreLabel(getProgressScoreStatus(40, 100))).toBe(
      "At Risk",
    );
    expect(getProgressScoreLabel(getProgressScoreStatus(80, 0))).toBe(
      "Not enough data",
    );
  });

  it("lists missing data for partial progress reports", () => {
    expect(
      getMissingDataLabels({
        hasAttendanceData: false,
        hasHomeworkData: true,
        hasAssessmentData: false,
        hasSkillData: true,
        hasTutorNote: false,
        completenessScore: 50,
      }),
    ).toEqual(["attendance", "assessments", "tutor note"]);
  });

  it("formats missing metric values as no data", () => {
    expect(formatMetricPercent(null)).toBe("No data");
    expect(formatMetricPercent(74.6)).toBe("75%");
  });

  it("maps skill levels for display", () => {
    expect(getSkillLevelLabel(SkillLevel.NEEDS_WORK)).toBe("Needs work");
    expect(getSkillLevelLabel(SkillLevel.EXCELLENT)).toBe("Excellent");
  });

  it("uses deterministic parent-friendly recommendations", () => {
    expect(
      toParentProgressMessage("Complete pending assignments before new homework."),
    ).toBe("ควรส่งงานให้ครบมากขึ้น");
    expect(
      toParentProgressMessage("Review weak assessment topics before the next quiz."),
    ).toBe("ควรทบทวนหัวข้อที่ยังอ่อนก่อนแบบทดสอบครั้งถัดไป");
  });

  it("handles missing skill matrix data without throwing", () => {
    expect(isValidElement(SkillMatrix({ skills: [] }))).toBe(true);
  });

  it("parses progress overview filters safely", () => {
    const filters = parseProgressOverviewFilters({
      search: " algebra ",
      minScore: "90",
      maxScore: "10",
      minCompleteness: "-5",
      maxCompleteness: "80",
    });

    expect(filters.search).toBe("algebra");
    expect(filters.minScore).toBe(10);
    expect(filters.maxScore).toBe(90);
    expect(filters.minCompleteness).toBeUndefined();
    expect(filters.maxCompleteness).toBe(80);
  });
});
