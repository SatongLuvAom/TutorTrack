export const HERO_LEARNING_IMAGE = "/images/hero-learning.svg";
export const TUTOR_PLACEHOLDER_IMAGE = "/images/tutor-placeholder.svg";
export const COURSE_PLACEHOLDER_IMAGE = "/images/course-placeholder.svg";
export const PROGRESS_PLACEHOLDER_IMAGE = "/images/progress-placeholder.svg";
export const EMPTY_STATE_IMAGE = "/images/empty-state.svg";

export function getLocalImageOrFallback(
  src: string | null | undefined,
  fallback: string,
): string {
  if (!src) {
    return fallback;
  }

  if (src.startsWith("/") && !src.startsWith("//")) {
    return src;
  }

  return fallback;
}
