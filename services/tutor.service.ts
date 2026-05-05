import { z } from "zod";
import {
  CourseStatus,
  TutorVerificationStatus,
  type Prisma,
} from "@/lib/generated/prisma/client";
import { getDb } from "@/lib/db";
import type {
  MarketplaceLevel,
  PublicCourseCard,
  PublicReview,
  PublicSubject,
  PublicTutorCard,
  PublicTutorDetail,
} from "@/types/marketplace";
import {
  averageRating,
  getLevelLabel,
  getLevelTagsFromText,
  getPublicReviewerLabel,
  getTeachingStyleSummary,
  normalizeSearchText,
  priceToCents,
} from "@/services/marketplace-utils";

export const tutorSortOptions = [
  "recommended",
  "rating",
  "price-asc",
  "price-desc",
  "experience",
] as const;

const marketplaceLevelSchema = z.enum([
  "middle-school",
  "high-school",
  "exam-prep",
  "international",
  "all-levels",
]);

const optionalTextSchema = (maxLength: number) =>
  z.string().trim().max(maxLength).optional().catch(undefined);

const optionalPriceSchema = z.coerce
  .number()
  .finite()
  .min(0)
  .optional()
  .catch(undefined);

const tutorFilterSchema = z.object({
  search: optionalTextSchema(100),
  subject: optionalTextSchema(80),
  level: marketplaceLevelSchema.optional().catch(undefined),
  minPrice: optionalPriceSchema,
  maxPrice: optionalPriceSchema,
  rating: z.coerce.number().finite().min(0).max(5).optional().catch(undefined),
  sort: z.enum(tutorSortOptions).catch("recommended"),
});

export type TutorSort = (typeof tutorSortOptions)[number];

export type TutorFilters = {
  search?: string;
  subject?: string;
  level?: MarketplaceLevel;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sort: TutorSort;
};

type SearchParamsInput = Record<string, string | string[] | undefined>;

type TutorRow = {
  id: string;
  headline: string | null;
  bio: string | null;
  experienceYears: number | null;
  hourlyRateCents: number | null;
  user: {
    name: string;
    imageUrl: string | null;
  };
  courses: CourseRow[];
  reviews: ReviewRow[];
};

type CourseRow = {
  id: string;
  title: string;
  description: string | null;
  type: PublicCourseCard["type"];
  priceCents: number;
  capacity: number | null;
  publishedAt: Date | null;
  subject: PublicSubject;
  _count: {
    sessions: number;
  };
  tutor?: {
    id: string;
    headline: string | null;
    experienceYears: number | null;
    user: {
      name: string;
      imageUrl: string | null;
    };
    reviews: Array<{ rating: number }>;
  };
};

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  author: {
    role: PublicReview["authorRole"];
  };
};

function firstValue(value: string | string[] | undefined): string | undefined {
  const selected = Array.isArray(value) ? value[0] : value;

  return selected === "" ? undefined : selected;
}

export function parseTutorFilters(params: SearchParamsInput): TutorFilters {
  const parsed = tutorFilterSchema.parse({
    search: firstValue(params.search),
    subject: firstValue(params.subject),
    level: firstValue(params.level),
    minPrice: firstValue(params.minPrice),
    maxPrice: firstValue(params.maxPrice),
    rating: firstValue(params.rating),
    sort: firstValue(params.sort),
  });

  const minPrice = parsed.minPrice;
  const maxPrice = parsed.maxPrice;

  return {
    search: normalizeSearchText(parsed.search),
    subject: normalizeSearchText(parsed.subject),
    level: parsed.level,
    minPrice:
      typeof minPrice === "number" && typeof maxPrice === "number"
        ? Math.min(minPrice, maxPrice)
        : minPrice,
    maxPrice:
      typeof minPrice === "number" && typeof maxPrice === "number"
        ? Math.max(minPrice, maxPrice)
        : maxPrice,
    rating: parsed.rating,
    sort: parsed.sort,
  };
}

export function buildPublicTutorWhere(
  filters: TutorFilters,
): Prisma.TutorProfileWhereInput {
  const and: Prisma.TutorProfileWhereInput[] = [
    { verificationStatus: TutorVerificationStatus.APPROVED },
  ];

  if (filters.search) {
    and.push({
      OR: [
        { user: { name: { contains: filters.search, mode: "insensitive" } } },
        { headline: { contains: filters.search, mode: "insensitive" } },
        { bio: { contains: filters.search, mode: "insensitive" } },
        {
          courses: {
            some: {
              status: CourseStatus.PUBLISHED,
              OR: [
                { title: { contains: filters.search, mode: "insensitive" } },
                {
                  description: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
                {
                  subject: {
                    name: { contains: filters.search, mode: "insensitive" },
                  },
                },
              ],
            },
          },
        },
      ],
    });
  }

  if (filters.subject) {
    and.push({
      courses: {
        some: {
          status: CourseStatus.PUBLISHED,
          subject: { slug: filters.subject },
        },
      },
    });
  }

  const hourlyRate: Prisma.IntNullableFilter<"TutorProfile"> = {};
  const minPriceCents = priceToCents(filters.minPrice);
  const maxPriceCents = priceToCents(filters.maxPrice);

  if (typeof minPriceCents === "number") {
    hourlyRate.gte = minPriceCents;
  }

  if (typeof maxPriceCents === "number") {
    hourlyRate.lte = maxPriceCents;
  }

  if (Object.keys(hourlyRate).length > 0) {
    and.push({ hourlyRateCents: hourlyRate });
  }

  return { AND: and };
}

export function buildPublicTutorDetailWhere(
  tutorId: string,
): Prisma.TutorProfileWhereInput {
  return {
    id: tutorId,
    verificationStatus: TutorVerificationStatus.APPROVED,
  };
}

function uniqueSubjects(courses: CourseRow[]): PublicSubject[] {
  const bySlug = new Map<string, PublicSubject>();

  for (const course of courses) {
    bySlug.set(course.subject.slug, course.subject);
  }

  return Array.from(bySlug.values());
}

function mapCourseForTutor(row: CourseRow, tutor: TutorRow): PublicCourseCard {
  const levelTags = getLevelTagsFromText(row.title, row.description);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    subject: row.subject,
    levelTags,
    levelLabel: getLevelLabel(levelTags),
    type: row.type,
    priceCents: row.priceCents,
    maxStudents: row.capacity,
    totalSessions: row._count.sessions,
    publishedAt: row.publishedAt,
    tutor: {
      id: tutor.id,
      name: tutor.user.name,
      headline: tutor.headline,
      imageUrl: tutor.user.imageUrl,
      experienceYears: tutor.experienceYears,
      rating: averageRating(tutor.reviews),
    },
  };
}

function mapTutor(row: TutorRow): PublicTutorCard {
  const subjects = uniqueSubjects(row.courses);
  const levelTags = Array.from(
    new Set(
      row.courses.flatMap((course) =>
        getLevelTagsFromText(course.title, course.description),
      ),
    ),
  );

  return {
    id: row.id,
    name: row.user.name,
    imageUrl: row.user.imageUrl,
    headline: row.headline,
    bio: row.bio,
    educationSummary: "ยังไม่ได้ระบุในโปรไฟล์สาธารณะ",
    teachingStyleSummary: getTeachingStyleSummary(row.headline, row.bio),
    subjects,
    levelTags,
    levelLabel: getLevelLabel(levelTags),
    experienceYears: row.experienceYears,
    hourlyRateCents: row.hourlyRateCents,
    rating: averageRating(row.reviews),
    publishedCourseCount: row.courses.length,
  };
}

function mapReview(row: ReviewRow): PublicReview {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt,
    authorName: getPublicReviewerLabel(row.author.role),
    authorRole: row.author.role,
  };
}

function applyDerivedTutorFilters(
  tutors: PublicTutorCard[],
  filters: TutorFilters,
): PublicTutorCard[] {
  return tutors.filter((tutor) => {
    if (filters.level && !tutor.levelTags.includes(filters.level)) {
      return false;
    }

    if (
      typeof filters.rating === "number" &&
      tutor.rating.average < filters.rating
    ) {
      return false;
    }

    return true;
  });
}

function sortTutors(
  tutors: PublicTutorCard[],
  sort: TutorSort,
): PublicTutorCard[] {
  return [...tutors].sort((left, right) => {
    if (sort === "rating") {
      return right.rating.average - left.rating.average;
    }

    if (sort === "price-asc") {
      return (left.hourlyRateCents ?? Infinity) - (right.hourlyRateCents ?? Infinity);
    }

    if (sort === "price-desc") {
      return (right.hourlyRateCents ?? 0) - (left.hourlyRateCents ?? 0);
    }

    if (sort === "experience") {
      return (right.experienceYears ?? 0) - (left.experienceYears ?? 0);
    }

    return (
      right.rating.average - left.rating.average ||
      right.publishedCourseCount - left.publishedCourseCount ||
      (right.experienceYears ?? 0) - (left.experienceYears ?? 0)
    );
  });
}

async function findPublicTutorRows(
  filters: TutorFilters,
): Promise<TutorRow[]> {
  return getDb().tutorProfile.findMany({
    where: buildPublicTutorWhere(filters),
    select: {
      id: true,
      headline: true,
      bio: true,
      experienceYears: true,
      hourlyRateCents: true,
      user: {
        select: {
          name: true,
          imageUrl: true,
        },
      },
      courses: {
        where: { status: CourseStatus.PUBLISHED },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          priceCents: true,
          capacity: true,
          publishedAt: true,
          subject: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
            },
          },
          _count: { select: { sessions: true } },
        },
      },
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          author: {
            select: {
              role: true,
            },
          },
        },
      },
    },
  });
}

export async function listPublicTutors(
  filters: TutorFilters,
): Promise<PublicTutorCard[]> {
  const tutors = (await findPublicTutorRows(filters)).map(mapTutor);

  return sortTutors(applyDerivedTutorFilters(tutors, filters), filters.sort);
}

export async function getFeaturedTutors(
  limit = 3,
): Promise<PublicTutorCard[]> {
  const filters: TutorFilters = { sort: "recommended" };
  const tutors = await listPublicTutors(filters);

  return tutors.slice(0, limit);
}

export async function getPublicTutorDetail(
  tutorId: string,
): Promise<PublicTutorDetail | null> {
  const row = await getDb().tutorProfile.findFirst({
    where: buildPublicTutorDetailWhere(tutorId),
    select: {
      id: true,
      headline: true,
      bio: true,
      experienceYears: true,
      hourlyRateCents: true,
      user: {
        select: {
          name: true,
          imageUrl: true,
        },
      },
      courses: {
        where: { status: CourseStatus.PUBLISHED },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          priceCents: true,
          capacity: true,
          publishedAt: true,
          subject: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
            },
          },
          _count: { select: { sessions: true } },
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          author: {
            select: {
              role: true,
            },
          },
        },
      },
    },
  });

  if (!row) {
    return null;
  }

  const tutor = mapTutor(row);

  return {
    ...tutor,
    reviews: row.reviews.map(mapReview),
    courses: row.courses.map((course) => mapCourseForTutor(course, row)),
  };
}
