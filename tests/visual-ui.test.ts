import { describe, expect, it } from "vitest";
import {
  COURSE_PLACEHOLDER_IMAGE,
  getLocalImageOrFallback,
  TUTOR_PLACEHOLDER_IMAGE,
} from "@/components/visual/image-utils";

describe("visual image helpers", () => {
  it("uses fallback images when no image data exists", () => {
    expect(getLocalImageOrFallback(null, TUTOR_PLACEHOLDER_IMAGE)).toBe(
      TUTOR_PLACEHOLDER_IMAGE,
    );
    expect(getLocalImageOrFallback(undefined, COURSE_PLACEHOLDER_IMAGE)).toBe(
      COURSE_PLACEHOLDER_IMAGE,
    );
  });

  it("allows local image paths and rejects remote hotlinks", () => {
    expect(
      getLocalImageOrFallback("/uploads/tutor.png", TUTOR_PLACEHOLDER_IMAGE),
    ).toBe("/uploads/tutor.png");
    expect(
      getLocalImageOrFallback(
        "https://example.com/tutor.png",
        TUTOR_PLACEHOLDER_IMAGE,
      ),
    ).toBe(TUTOR_PLACEHOLDER_IMAGE);
  });
});
