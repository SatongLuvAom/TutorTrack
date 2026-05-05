import type { CourseType, UserRole } from "@/lib/generated/prisma/enums";

export type MarketplaceLevel =
  | "middle-school"
  | "high-school"
  | "exam-prep"
  | "international"
  | "all-levels";

export type RatingSummary = {
  average: number;
  count: number;
};

export type PublicSubject = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  courseCount?: number;
};

export type PublicReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  authorName: string;
  authorRole: UserRole;
};

export type PublicCourseCard = {
  id: string;
  title: string;
  description: string | null;
  subject: PublicSubject;
  levelTags: MarketplaceLevel[];
  levelLabel: string;
  type: CourseType;
  priceCents: number;
  maxStudents: number | null;
  totalSessions: number;
  publishedAt: Date | null;
  tutor: {
    id: string;
    name: string;
    headline: string | null;
    imageUrl: string | null;
    experienceYears: number | null;
    rating: RatingSummary;
  };
};

export type PublicCourseDetail = PublicCourseCard & {
  startsAt: Date | null;
  endsAt: Date | null;
  sessions: Array<{
    id: string;
    title: string;
    description: string | null;
    startsAt: Date;
  }>;
};

export type PublicTutorCard = {
  id: string;
  name: string;
  imageUrl: string | null;
  headline: string | null;
  bio: string | null;
  educationSummary: string;
  teachingStyleSummary: string;
  subjects: PublicSubject[];
  levelTags: MarketplaceLevel[];
  levelLabel: string;
  experienceYears: number | null;
  hourlyRateCents: number | null;
  rating: RatingSummary;
  publishedCourseCount: number;
};

export type PublicTutorDetail = PublicTutorCard & {
  reviews: PublicReview[];
  courses: PublicCourseCard[];
};
