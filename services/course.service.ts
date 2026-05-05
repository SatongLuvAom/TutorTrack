import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  CourseStatus,
  CourseType,
  TutorVerificationStatus,
  type Prisma,
} from "@/lib/generated/prisma/client";
import { getDb } from "@/lib/db";
import type {
  MarketplaceLevel,
  PublicCourseCard,
  PublicCourseDetail,
  PublicSubject,
} from "@/types/marketplace";
import {
  courseCreateSchema,
  courseFilterSchema as managedCourseFilterSchema,
  courseLevelSchema,
  courseStatusUpdateSchema,
  courseUpdateSchema,
  type CourseCreateInput,
  type CourseLevel,
  type CourseStatusUpdateInput,
  type CourseUpdateInput,
} from "@/lib/validators/course";
import {
  averageRating,
  getLevelLabel,
  getLevelTagsFromStoredLevel,
  normalizeSearchText,
  priceToCents,
} from "@/services/marketplace-utils";

export const courseSortOptions = ["newest", "price-asc", "price-desc"] as const;

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

const courseFilterSchema = z.object({
  search: optionalTextSchema(100),
  subject: optionalTextSchema(80),
  level: marketplaceLevelSchema.optional().catch(undefined),
  type: z.enum([CourseType.PRIVATE, CourseType.GROUP]).optional().catch(undefined),
  minPrice: optionalPriceSchema,
  maxPrice: optionalPriceSchema,
  sort: z.enum(courseSortOptions).catch("newest"),
});

export type CourseSort = (typeof courseSortOptions)[number];

export type CourseFilters = {
  search?: string;
  subject?: string;
  level?: MarketplaceLevel;
  type?: CourseType;
  minPrice?: number;
  maxPrice?: number;
  sort: CourseSort;
};

type SearchParamsInput = Record<string, string | string[] | undefined>;

type CourseRow = {
  id: string;
  title: string;
  description: string | null;
  level: string;
  type: CourseType;
  priceCents: number;
  capacity: number | null;
  totalSessions: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  publishedAt: Date | null;
  subject: PublicSubject;
  tutor: {
    id: string;
    headline: string | null;
    experienceYears: number | null;
    user: {
      name: string;
      imageUrl: string | null;
    };
    reviews: Array<{ rating: number }>;
  };
  sessions?: Array<{
    id: string;
    title: string;
    description: string | null;
    startsAt: Date;
  }>;
  _count: {
    sessions: number;
  };
};

function firstValue(value: string | string[] | undefined): string | undefined {
  const selected = Array.isArray(value) ? value[0] : value;

  return selected === "" ? undefined : selected;
}

export function parseCourseFilters(params: SearchParamsInput): CourseFilters {
  const parsed = courseFilterSchema.parse({
    search: firstValue(params.search),
    subject: firstValue(params.subject),
    level: firstValue(params.level),
    type: firstValue(params.type),
    minPrice: firstValue(params.minPrice),
    maxPrice: firstValue(params.maxPrice),
    sort: firstValue(params.sort),
  });

  const minPrice = parsed.minPrice;
  const maxPrice = parsed.maxPrice;

  return {
    search: normalizeSearchText(parsed.search),
    subject: normalizeSearchText(parsed.subject),
    level: parsed.level,
    type: parsed.type,
    minPrice:
      typeof minPrice === "number" && typeof maxPrice === "number"
        ? Math.min(minPrice, maxPrice)
        : minPrice,
    maxPrice:
      typeof minPrice === "number" && typeof maxPrice === "number"
        ? Math.max(minPrice, maxPrice)
        : maxPrice,
    sort: parsed.sort,
  };
}

export function buildPublicCourseWhere(
  filters: CourseFilters,
): Prisma.CourseWhereInput {
  const and: Prisma.CourseWhereInput[] = [
    {
      status: CourseStatus.PUBLISHED,
      tutor: { verificationStatus: TutorVerificationStatus.APPROVED },
    },
  ];

  if (filters.search) {
    and.push({
      OR: [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        {
          subject: {
            name: { contains: filters.search, mode: "insensitive" },
          },
        },
        {
          tutor: {
            user: {
              name: { contains: filters.search, mode: "insensitive" },
            },
          },
        },
      ],
    });
  }

  if (filters.subject) {
    and.push({ subject: { slug: filters.subject } });
  }

  if (filters.type) {
    and.push({ type: filters.type });
  }

  if (filters.level) {
    and.push({ level: filters.level });
  }

  const price: Prisma.IntFilter<"Course"> = {};
  const minPriceCents = priceToCents(filters.minPrice);
  const maxPriceCents = priceToCents(filters.maxPrice);

  if (typeof minPriceCents === "number") {
    price.gte = minPriceCents;
  }

  if (typeof maxPriceCents === "number") {
    price.lte = maxPriceCents;
  }

  if (Object.keys(price).length > 0) {
    and.push({ priceCents: price });
  }

  return { AND: and };
}

export function buildPublicCourseDetailWhere(
  courseId: string,
): Prisma.CourseWhereInput {
  return {
    id: courseId,
    status: CourseStatus.PUBLISHED,
    tutor: { verificationStatus: TutorVerificationStatus.APPROVED },
  };
}

function mapCourse(row: CourseRow): PublicCourseCard {
  const levelTags = getLevelTagsFromStoredLevel(
    row.level,
    row.title,
    row.description,
  );

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
    totalSessions: row.totalSessions,
    publishedAt: row.publishedAt,
    tutor: {
      id: row.tutor.id,
      name: row.tutor.user.name,
      headline: row.tutor.headline,
      imageUrl: row.tutor.user.imageUrl,
      experienceYears: row.tutor.experienceYears,
      rating: averageRating(row.tutor.reviews),
    },
  };
}

function applyDerivedCourseFilters(
  courses: PublicCourseCard[],
  filters: CourseFilters,
): PublicCourseCard[] {
  return courses.filter((course) => {
    if (filters.level && !course.levelTags.includes(filters.level)) {
      return false;
    }

    return true;
  });
}

function courseOrderBy(sort: CourseSort): Prisma.CourseOrderByWithRelationInput[] {
  if (sort === "price-asc") {
    return [{ priceCents: "asc" }, { publishedAt: "desc" }];
  }

  if (sort === "price-desc") {
    return [{ priceCents: "desc" }, { publishedAt: "desc" }];
  }

  return [{ publishedAt: "desc" }, { createdAt: "desc" }];
}

async function findPublicCourseRows(
  filters: CourseFilters,
): Promise<CourseRow[]> {
  return getDb().course.findMany({
    where: buildPublicCourseWhere(filters),
    orderBy: courseOrderBy(filters.sort),
    select: {
      id: true,
      title: true,
      description: true,
      level: true,
      type: true,
      priceCents: true,
      capacity: true,
      totalSessions: true,
      publishedAt: true,
      subject: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
        },
      },
      tutor: {
        select: {
          id: true,
          headline: true,
          experienceYears: true,
          user: {
            select: {
              name: true,
              imageUrl: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      },
      _count: { select: { sessions: true } },
    },
  });
}

export async function listPublicCourses(
  filters: CourseFilters,
): Promise<PublicCourseCard[]> {
  const courses = (await findPublicCourseRows(filters)).map(mapCourse);

  return applyDerivedCourseFilters(courses, filters);
}

export async function getFeaturedCourses(
  limit = 3,
): Promise<PublicCourseCard[]> {
  const courses = await listPublicCourses({ sort: "newest" });

  return courses.slice(0, limit);
}

export async function getPublicCourseDetail(
  courseId: string,
): Promise<PublicCourseDetail | null> {
  const row = await getDb().course.findFirst({
    where: buildPublicCourseDetailWhere(courseId),
    select: {
      id: true,
      title: true,
      description: true,
      level: true,
      type: true,
      priceCents: true,
      capacity: true,
      totalSessions: true,
      startsAt: true,
      endsAt: true,
      publishedAt: true,
      subject: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
        },
      },
      tutor: {
        select: {
          id: true,
          headline: true,
          experienceYears: true,
          user: {
            select: {
              name: true,
              imageUrl: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      },
      sessions: {
        orderBy: { startsAt: "asc" },
        take: 4,
        select: {
          id: true,
          title: true,
          description: true,
          startsAt: true,
        },
      },
      _count: { select: { sessions: true } },
    },
  });

  if (!row) {
    return null;
  }

  return {
    ...mapCourse(row),
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    sessions: row.sessions ?? [],
  };
}

export async function getSubjectOptions(): Promise<PublicSubject[]> {
  const subjects = await getDb().subject.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      courses: {
        where: {
          status: CourseStatus.PUBLISHED,
          tutor: { verificationStatus: TutorVerificationStatus.APPROVED },
        },
        select: { id: true },
      },
    },
  });

  return subjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    slug: subject.slug,
    description: subject.description,
    courseCount: subject.courses.length,
  }));
}

export async function getPopularSubjects(limit = 6): Promise<PublicSubject[]> {
  const subjects = await getSubjectOptions();

  return subjects
    .filter((subject) => (subject.courseCount ?? 0) > 0)
    .sort((left, right) => (right.courseCount ?? 0) - (left.courseCount ?? 0))
    .slice(0, limit);
}

export function getPublicCourses(
  filters: CourseFilters,
): Promise<PublicCourseCard[]> {
  return listPublicCourses(filters);
}

export function getPublicCourseById(
  courseId: string,
): Promise<PublicCourseDetail | null> {
  return getPublicCourseDetail(courseId);
}

export type ManagedCourseFilters = {
  search?: string;
  subjectId?: string;
  tutorId?: string;
  status?: CourseStatus;
  courseType?: CourseType;
};

export type ManagedCourseSubject = {
  id: string;
  name: string;
  slug: string;
};

export type ManagedCourseTutor = {
  id: string;
  name: string;
  email: string;
};

export type ManagedCourse = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  level: CourseLevel;
  type: CourseType;
  status: CourseStatus;
  priceCents: number;
  maxStudents: number | null;
  totalSessions: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  subject: ManagedCourseSubject;
  tutor: ManagedCourseTutor;
  stats: {
    enrollmentCount: number;
    scheduledSessionCount: number;
    assignmentCount: number;
  };
};

type CourseAccessRecord = {
  id: string;
  tutorId: string;
  status: CourseStatus;
  publishedAt: Date | null;
};

type CourseCreateData = {
  tutorId: string;
  subjectId: string;
  title: string;
  slug: string;
  description: string;
  level: CourseLevel;
  type: CourseType;
  status: CourseStatus;
  priceCents: number;
  capacity: number;
  totalSessions: number;
  publishedAt: Date | null;
};

type CourseUpdateData = {
  subjectId: string;
  title: string;
  description: string;
  level: CourseLevel;
  type: CourseType;
  priceCents: number;
  capacity: number;
  totalSessions: number;
};

type CourseStatusData = {
  status: CourseStatus;
  publishedAt?: Date | null;
};

export type CourseWriteStore = {
  getTutorProfileByUserId(
    tutorUserId: string,
  ): Promise<{ id: string } | null>;
  getSubjectById(subjectId: string): Promise<{ id: string } | null>;
  createCourse(data: CourseCreateData): Promise<ManagedCourse>;
  getCourseAccess(courseId: string): Promise<CourseAccessRecord | null>;
  updateCourse(
    courseId: string,
    data: CourseUpdateData,
  ): Promise<ManagedCourse>;
  updateCourseStatus(
    courseId: string,
    data: CourseStatusData,
  ): Promise<ManagedCourse>;
};

export type CourseManagementErrorCode =
  | "TUTOR_PROFILE_REQUIRED"
  | "SUBJECT_NOT_FOUND"
  | "COURSE_NOT_FOUND"
  | "FORBIDDEN"
  | "INVALID_STATUS_TRANSITION";

export class CourseManagementError extends Error {
  constructor(
    readonly code: CourseManagementErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CourseManagementError";
  }
}

const managedCourseSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  level: true,
  type: true,
  status: true,
  priceCents: true,
  capacity: true,
  totalSessions: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  subject: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  tutor: {
    select: {
      id: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  },
  _count: {
    select: {
      enrollments: true,
      sessions: true,
      assignments: true,
    },
  },
} satisfies Prisma.CourseSelect;

type ManagedCourseRow = Prisma.CourseGetPayload<{
  select: typeof managedCourseSelect;
}>;

function toCourseLevel(value: string): CourseLevel {
  const parsed = courseLevelSchema.safeParse(value);

  return parsed.success ? parsed.data : "all-levels";
}

function mapManagedCourse(row: ManagedCourseRow): ManagedCourse {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    level: toCourseLevel(row.level),
    type: row.type,
    status: row.status,
    priceCents: row.priceCents,
    maxStudents: row.capacity,
    totalSessions: row.totalSessions,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    subject: row.subject,
    tutor: {
      id: row.tutor.id,
      name: row.tutor.user.name,
      email: row.tutor.user.email,
    },
    stats: {
      enrollmentCount: row._count.enrollments,
      scheduledSessionCount: row._count.sessions,
      assignmentCount: row._count.assignments,
    },
  };
}

function toPriceCents(price: number): number {
  return Math.round(price * 100);
}

export function createCourseSlug(title: string): string {
  const base = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${base || "course"}-${randomUUID().slice(0, 8)}`;
}

export function buildCourseCreateData(
  tutorId: string,
  input: CourseCreateInput,
  slug = createCourseSlug(input.title),
): CourseCreateData {
  const parsed = courseCreateSchema.parse(input);

  return {
    tutorId,
    subjectId: parsed.subjectId,
    title: parsed.title,
    slug,
    description: parsed.description,
    level: parsed.level,
    type: parsed.courseType,
    status: CourseStatus.DRAFT,
    priceCents: toPriceCents(parsed.price),
    capacity: parsed.maxStudents,
    totalSessions: parsed.totalSessions,
    publishedAt: null,
  };
}

export function buildCourseUpdateData(
  input: CourseUpdateInput,
): CourseUpdateData {
  const parsed = courseUpdateSchema.parse(input);

  return {
    subjectId: parsed.subjectId,
    title: parsed.title,
    description: parsed.description,
    level: parsed.level,
    type: parsed.courseType,
    priceCents: toPriceCents(parsed.price),
    capacity: parsed.maxStudents,
    totalSessions: parsed.totalSessions,
  };
}

export function canTransitionCourseStatus(
  from: CourseStatus,
  to: CourseStatus,
): boolean {
  if (from === to) {
    return true;
  }

  if (from === CourseStatus.DRAFT) {
    return to === CourseStatus.PUBLISHED || to === CourseStatus.ARCHIVED;
  }

  if (from === CourseStatus.PUBLISHED) {
    return to === CourseStatus.ARCHIVED;
  }

  if (from === CourseStatus.ARCHIVED) {
    return to === CourseStatus.DRAFT;
  }

  return false;
}

function buildStatusUpdateData(
  course: CourseAccessRecord,
  input: CourseStatusUpdateInput,
): CourseStatusData {
  const parsed = courseStatusUpdateSchema.parse(input);

  if (!canTransitionCourseStatus(course.status, parsed.status)) {
    throw new CourseManagementError(
      "INVALID_STATUS_TRANSITION",
      `Cannot change course status from ${course.status} to ${parsed.status}.`,
    );
  }

  if (parsed.status === CourseStatus.PUBLISHED) {
    return {
      status: parsed.status,
      publishedAt: course.publishedAt ?? new Date(),
    };
  }

  if (parsed.status === CourseStatus.DRAFT) {
    return { status: parsed.status, publishedAt: null };
  }

  return { status: parsed.status };
}

function buildManagedCourseWhere(
  filters: ManagedCourseFilters,
  base: Prisma.CourseWhereInput = {},
): Prisma.CourseWhereInput {
  const and: Prisma.CourseWhereInput[] = [base];

  if (filters.search) {
    and.push({
      OR: [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { subject: { name: { contains: filters.search, mode: "insensitive" } } },
        { tutor: { user: { name: { contains: filters.search, mode: "insensitive" } } } },
        { tutor: { user: { email: { contains: filters.search, mode: "insensitive" } } } },
      ],
    });
  }

  if (filters.subjectId) {
    and.push({ subjectId: filters.subjectId });
  }

  if (filters.tutorId) {
    and.push({ tutorId: filters.tutorId });
  }

  if (filters.status) {
    and.push({ status: filters.status });
  }

  if (filters.courseType) {
    and.push({ type: filters.courseType });
  }

  return { AND: and };
}

export function parseManagedCourseFilters(
  params: SearchParamsInput,
): ManagedCourseFilters {
  const parsed = managedCourseFilterSchema.parse({
    search: firstValue(params.search),
    subjectId: firstValue(params.subjectId) ?? firstValue(params.subject),
    tutorId: firstValue(params.tutorId) ?? firstValue(params.tutor),
    status: firstValue(params.status),
    courseType: firstValue(params.courseType) ?? firstValue(params.type),
  });

  return {
    search: normalizeSearchText(parsed.search),
    subjectId: normalizeSearchText(parsed.subjectId),
    tutorId: normalizeSearchText(parsed.tutorId),
    status: parsed.status,
    courseType: parsed.courseType,
  };
}

const prismaCourseWriteStore: CourseWriteStore = {
  async getTutorProfileByUserId(tutorUserId) {
    return getDb().tutorProfile.findUnique({
      where: { userId: tutorUserId },
      select: { id: true },
    });
  },

  async getSubjectById(subjectId) {
    return getDb().subject.findUnique({
      where: { id: subjectId },
      select: { id: true },
    });
  },

  async createCourse(data) {
    const row = await getDb().course.create({
      data,
      select: managedCourseSelect,
    });

    return mapManagedCourse(row);
  },

  async getCourseAccess(courseId) {
    return getDb().course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        tutorId: true,
        status: true,
        publishedAt: true,
      },
    });
  },

  async updateCourse(courseId, data) {
    const row = await getDb().course.update({
      where: { id: courseId },
      data,
      select: managedCourseSelect,
    });

    return mapManagedCourse(row);
  },

  async updateCourseStatus(courseId, data) {
    const row = await getDb().course.update({
      where: { id: courseId },
      data,
      select: managedCourseSelect,
    });

    return mapManagedCourse(row);
  },
};

async function getRequiredTutorProfileId(
  tutorUserId: string,
  store: CourseWriteStore,
): Promise<string> {
  const tutor = await store.getTutorProfileByUserId(tutorUserId);

  if (!tutor) {
    throw new CourseManagementError(
      "TUTOR_PROFILE_REQUIRED",
      "A tutor profile is required to manage courses.",
    );
  }

  return tutor.id;
}

async function assertSubjectExists(
  subjectId: string,
  store: CourseWriteStore,
): Promise<void> {
  const subject = await store.getSubjectById(subjectId);

  if (!subject) {
    throw new CourseManagementError(
      "SUBJECT_NOT_FOUND",
      "Selected subject does not exist.",
    );
  }
}

async function getTutorOwnedCourseAccess(
  tutorUserId: string,
  courseId: string,
  store: CourseWriteStore,
): Promise<CourseAccessRecord> {
  const [tutorId, course] = await Promise.all([
    getRequiredTutorProfileId(tutorUserId, store),
    store.getCourseAccess(courseId),
  ]);

  if (!course) {
    throw new CourseManagementError("COURSE_NOT_FOUND", "Course not found.");
  }

  if (course.tutorId !== tutorId) {
    throw new CourseManagementError(
      "FORBIDDEN",
      "You do not have permission to manage this course.",
    );
  }

  return course;
}

export async function getCourseSubjectOptions(): Promise<
  ManagedCourseSubject[]
> {
  return getDb().subject.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
}

export async function getAdminCourseTutorOptions(): Promise<
  ManagedCourseTutor[]
> {
  const tutors = await getDb().tutorProfile.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return tutors.map((tutor) => ({
    id: tutor.id,
    name: tutor.user.name,
    email: tutor.user.email,
  }));
}

export async function getTutorCourses(
  tutorUserId: string,
  filters: ManagedCourseFilters = {},
): Promise<ManagedCourse[]> {
  const tutor = await getDb().tutorProfile.findUnique({
    where: { userId: tutorUserId },
    select: { id: true },
  });

  if (!tutor) {
    return [];
  }

  const rows = await getDb().course.findMany({
    where: buildManagedCourseWhere(filters, { tutorId: tutor.id }),
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: managedCourseSelect,
  });

  return rows.map(mapManagedCourse);
}

export async function getTutorCourseById(
  tutorUserId: string,
  courseId: string,
): Promise<ManagedCourse | null> {
  const tutor = await getDb().tutorProfile.findUnique({
    where: { userId: tutorUserId },
    select: { id: true },
  });

  if (!tutor) {
    return null;
  }

  const row = await getDb().course.findFirst({
    where: { id: courseId, tutorId: tutor.id },
    select: managedCourseSelect,
  });

  return row ? mapManagedCourse(row) : null;
}

export async function getAdminCourses(
  filters: ManagedCourseFilters = {},
): Promise<ManagedCourse[]> {
  const rows = await getDb().course.findMany({
    where: buildManagedCourseWhere(filters),
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: managedCourseSelect,
  });

  return rows.map(mapManagedCourse);
}

export async function getAdminCourseById(
  courseId: string,
): Promise<ManagedCourse | null> {
  const row = await getDb().course.findUnique({
    where: { id: courseId },
    select: managedCourseSelect,
  });

  return row ? mapManagedCourse(row) : null;
}

export async function createCourse(
  tutorUserId: string,
  input: CourseCreateInput,
  store: CourseWriteStore = prismaCourseWriteStore,
): Promise<ManagedCourse> {
  const tutorId = await getRequiredTutorProfileId(tutorUserId, store);
  await assertSubjectExists(input.subjectId, store);

  return store.createCourse(buildCourseCreateData(tutorId, input));
}

export async function updateCourse(
  tutorUserId: string,
  courseId: string,
  input: CourseUpdateInput,
  store: CourseWriteStore = prismaCourseWriteStore,
): Promise<ManagedCourse> {
  await getTutorOwnedCourseAccess(tutorUserId, courseId, store);
  await assertSubjectExists(input.subjectId, store);

  return store.updateCourse(courseId, buildCourseUpdateData(input));
}

async function updateTutorCourseStatus(
  tutorUserId: string,
  courseId: string,
  input: CourseStatusUpdateInput,
  store: CourseWriteStore = prismaCourseWriteStore,
): Promise<ManagedCourse> {
  const course = await getTutorOwnedCourseAccess(tutorUserId, courseId, store);
  const data = buildStatusUpdateData(course, input);

  return store.updateCourseStatus(courseId, data);
}

export function publishCourse(
  tutorUserId: string,
  courseId: string,
  store: CourseWriteStore = prismaCourseWriteStore,
): Promise<ManagedCourse> {
  return updateTutorCourseStatus(
    tutorUserId,
    courseId,
    { status: CourseStatus.PUBLISHED },
    store,
  );
}

export function archiveCourse(
  tutorUserId: string,
  courseId: string,
  store: CourseWriteStore = prismaCourseWriteStore,
): Promise<ManagedCourse> {
  return updateTutorCourseStatus(
    tutorUserId,
    courseId,
    { status: CourseStatus.ARCHIVED },
    store,
  );
}

export function restoreCourseToDraft(
  tutorUserId: string,
  courseId: string,
  store: CourseWriteStore = prismaCourseWriteStore,
): Promise<ManagedCourse> {
  return updateTutorCourseStatus(
    tutorUserId,
    courseId,
    { status: CourseStatus.DRAFT },
    store,
  );
}

export async function adminUpdateCourseStatus(
  courseId: string,
  status: CourseStatus,
  store: CourseWriteStore = prismaCourseWriteStore,
): Promise<ManagedCourse> {
  const course = await store.getCourseAccess(courseId);

  if (!course) {
    throw new CourseManagementError("COURSE_NOT_FOUND", "Course not found.");
  }

  const data = buildStatusUpdateData(course, { status });

  return store.updateCourseStatus(courseId, data);
}
