import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  AttendanceStatus,
  AssessmentType,
  CourseStatus,
  CourseType,
  EnrollmentStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  SessionStatus,
  SkillLevel,
  TutorVerificationStatus,
  UserRole,
  UserStatus,
} from "../lib/generated/prisma/client";

const demoPasswordHash = "placeholder-password-hash-auth-phase";

type LessonSeed = {
  courseId: string;
  title: string;
  description?: string;
  startsAt: Date;
  endsAt?: Date;
  meetingUrl?: string;
  status: SessionStatus;
};

type AssignmentSeed = {
  courseId: string;
  title: string;
  instructions?: string;
  dueAt?: Date;
  maxScore?: number;
};

type EnrollmentSeed = {
  studentId: string;
  courseId: string;
  status: EnrollmentStatus;
  enrolledAt: Date;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
};

type AssessmentSeed = {
  courseId: string;
  studentId: string;
  enrollmentId: string;
  title: string;
  type: AssessmentType;
  score?: number;
  maxScore?: number;
  takenAt?: Date;
  note?: string;
};

type ProgressNoteSeed = {
  courseId: string;
  studentId: string;
  enrollmentId: string;
  tutorId: string;
  note: string;
  strengths?: string;
  weaknesses?: string;
  recommendedNextSteps?: string;
};

type ReviewSeed = {
  tutorId: string;
  courseId?: string;
  studentId?: string;
  authorId: string;
  rating: number;
  comment?: string;
};

function requiredDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run seed data.");
  }

  return databaseUrl;
}

function at(value: string) {
  return new Date(value);
}

async function upsertLessonSession(db: PrismaClient, seed: LessonSeed) {
  const existing = await db.lessonSession.findFirst({
    where: {
      courseId: seed.courseId,
      title: seed.title,
    },
  });

  if (existing) {
    return db.lessonSession.update({
      where: { id: existing.id },
      data: seed,
    });
  }

  return db.lessonSession.create({ data: seed });
}

async function upsertAssignment(db: PrismaClient, seed: AssignmentSeed) {
  const existing = await db.assignment.findFirst({
    where: {
      courseId: seed.courseId,
      title: seed.title,
    },
  });

  if (existing) {
    return db.assignment.update({
      where: { id: existing.id },
      data: seed,
    });
  }

  return db.assignment.create({ data: seed });
}

async function upsertEnrollment(db: PrismaClient, seed: EnrollmentSeed) {
  const data = {
    ...seed,
    completedAt: seed.completedAt ?? null,
    cancelledAt: seed.cancelledAt ?? null,
  };
  const existing = await db.enrollment.findFirst({
    where: {
      studentId: seed.studentId,
      courseId: seed.courseId,
    },
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return db.enrollment.update({
      where: { id: existing.id },
      data,
    });
  }

  return db.enrollment.create({ data });
}

async function upsertAssessment(db: PrismaClient, seed: AssessmentSeed) {
  const existing = await db.assessment.findFirst({
    where: {
      enrollmentId: seed.enrollmentId,
      title: seed.title,
      type: seed.type,
    },
  });

  if (existing) {
    return db.assessment.update({
      where: { id: existing.id },
      data: seed,
    });
  }

  return db.assessment.create({ data: seed });
}

async function upsertProgressNote(db: PrismaClient, seed: ProgressNoteSeed) {
  const existing = await db.progressNote.findFirst({
    where: {
      enrollmentId: seed.enrollmentId,
      note: seed.note,
    },
  });

  if (existing) {
    return db.progressNote.update({
      where: { id: existing.id },
      data: seed,
    });
  }

  return db.progressNote.create({ data: seed });
}

async function upsertReview(db: PrismaClient, seed: ReviewSeed) {
  const existing = await db.review.findFirst({
    where: {
      tutorId: seed.tutorId,
      authorId: seed.authorId,
      courseId: seed.courseId,
      studentId: seed.studentId,
    },
  });

  if (existing) {
    return db.review.update({
      where: { id: existing.id },
      data: seed,
    });
  }

  return db.review.create({ data: seed });
}

async function seed(db: PrismaClient) {
  console.info("Seeding TutorTrack demo users...");

  const adminUser = await db.user.upsert({
    where: { email: "admin@tutortrack.test" },
    update: {
      name: "อรทัย ศิริวัฒน์",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
    create: {
      email: "admin@tutortrack.test",
      name: "อรทัย ศิริวัฒน์",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
  });

  const tutor1User = await db.user.upsert({
    where: { email: "tutor1@tutortrack.test" },
    update: {
      name: "ปวีณา จันทร์สุข",
      phone: "081-234-1101",
      role: UserRole.TUTOR,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
    create: {
      email: "tutor1@tutortrack.test",
      name: "ปวีณา จันทร์สุข",
      phone: "081-234-1101",
      role: UserRole.TUTOR,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
  });

  const tutor2User = await db.user.upsert({
    where: { email: "tutor2@tutortrack.test" },
    update: {
      name: "ณัฐวุฒิ เกียรติชัย",
      phone: "081-234-1102",
      role: UserRole.TUTOR,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
    create: {
      email: "tutor2@tutortrack.test",
      name: "ณัฐวุฒิ เกียรติชัย",
      phone: "081-234-1102",
      role: UserRole.TUTOR,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
  });

  const tutor3User = await db.user.upsert({
    where: { email: "tutor3@tutortrack.test" },
    update: {
      name: "มาลินี ธรรมรักษ์",
      phone: "081-234-1103",
      role: UserRole.TUTOR,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
    create: {
      email: "tutor3@tutortrack.test",
      name: "มาลินี ธรรมรักษ์",
      phone: "081-234-1103",
      role: UserRole.TUTOR,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
  });

  const student1User = await db.user.upsert({
    where: { email: "student1@tutortrack.test" },
    update: {
      name: "พิมพ์ชนก วัฒนากุล",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
    create: {
      email: "student1@tutortrack.test",
      name: "พิมพ์ชนก วัฒนากุล",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
  });

  const student2User = await db.user.upsert({
    where: { email: "student2@tutortrack.test" },
    update: {
      name: "กานต์พิชญ์ เลิศล้ำ",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
    create: {
      email: "student2@tutortrack.test",
      name: "กานต์พิชญ์ เลิศล้ำ",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
  });

  const student3User = await db.user.upsert({
    where: { email: "student3@tutortrack.test" },
    update: {
      name: "ธนภัทร แสงทอง",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
    create: {
      email: "student3@tutortrack.test",
      name: "ธนภัทร แสงทอง",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
  });

  const student4User = await db.user.upsert({
    where: { email: "student4@tutortrack.test" },
    update: {
      name: "สิรินดา พรหมรักษ์",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
    create: {
      email: "student4@tutortrack.test",
      name: "สิรินดา พรหมรักษ์",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
  });

  const student5User = await db.user.upsert({
    where: { email: "student5@tutortrack.test" },
    update: {
      name: "ปุณณวิช สุขเกษม",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
    create: {
      email: "student5@tutortrack.test",
      name: "ปุณณวิช สุขเกษม",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
  });

  const parent1User = await db.user.upsert({
    where: { email: "parent1@tutortrack.test" },
    update: {
      name: "ศิริพร วัฒนากุล",
      phone: "089-100-2001",
      role: UserRole.PARENT,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
    create: {
      email: "parent1@tutortrack.test",
      name: "ศิริพร วัฒนากุล",
      phone: "089-100-2001",
      role: UserRole.PARENT,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
  });

  const parent2User = await db.user.upsert({
    where: { email: "parent2@tutortrack.test" },
    update: {
      name: "เมธินี เลิศล้ำ",
      phone: "089-100-2002",
      role: UserRole.PARENT,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
    create: {
      email: "parent2@tutortrack.test",
      name: "เมธินี เลิศล้ำ",
      phone: "089-100-2002",
      role: UserRole.PARENT,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
  });

  const parent3User = await db.user.upsert({
    where: { email: "parent3@tutortrack.test" },
    update: {
      name: "ชยุตม์ แสงทอง",
      phone: "089-100-2003",
      role: UserRole.PARENT,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
    create: {
      email: "parent3@tutortrack.test",
      name: "ชยุตม์ แสงทอง",
      phone: "089-100-2003",
      role: UserRole.PARENT,
      status: UserStatus.ACTIVE,
      passwordHash: demoPasswordHash,
    },
  });

  console.info(`Seeded admin user ${adminUser.email}.`);
  console.info("Seeding role profiles and parent-child access links...");

  const tutor1 = await db.tutorProfile.upsert({
    where: { userId: tutor1User.id },
    update: {
      headline: "ติวคณิต ม.ต้น-ม.ปลาย เน้นคิดเป็นระบบ",
      bio: "อดีตครูโรงเรียนเอกชน สอนคณิตศาสตร์มากกว่า 8 ปี",
      experienceYears: 8,
      hourlyRateCents: 90000,
      verificationStatus: TutorVerificationStatus.APPROVED,
    },
    create: {
      userId: tutor1User.id,
      headline: "ติวคณิต ม.ต้น-ม.ปลาย เน้นคิดเป็นระบบ",
      bio: "อดีตครูโรงเรียนเอกชน สอนคณิตศาสตร์มากกว่า 8 ปี",
      experienceYears: 8,
      hourlyRateCents: 90000,
      verificationStatus: TutorVerificationStatus.APPROVED,
    },
  });

  const tutor2 = await db.tutorProfile.upsert({
    where: { userId: tutor2User.id },
    update: {
      headline: "ฟิสิกส์และวิทยาศาสตร์สอบเข้า",
      bio: "โค้ชโจทย์ฟิสิกส์สำหรับ ม.ปลาย และเตรียมสอบเข้ามหาวิทยาลัย",
      experienceYears: 6,
      hourlyRateCents: 100000,
      verificationStatus: TutorVerificationStatus.APPROVED,
    },
    create: {
      userId: tutor2User.id,
      headline: "ฟิสิกส์และวิทยาศาสตร์สอบเข้า",
      bio: "โค้ชโจทย์ฟิสิกส์สำหรับ ม.ปลาย และเตรียมสอบเข้ามหาวิทยาลัย",
      experienceYears: 6,
      hourlyRateCents: 100000,
      verificationStatus: TutorVerificationStatus.APPROVED,
    },
  });

  const tutor3 = await db.tutorProfile.upsert({
    where: { userId: tutor3User.id },
    update: {
      headline: "ภาษาอังกฤษสื่อสารและการอ่านจับใจความ",
      bio: "ครูภาษาอังกฤษสาย activity-based learning รอการตรวจเอกสาร",
      experienceYears: 4,
      hourlyRateCents: 75000,
      verificationStatus: TutorVerificationStatus.PENDING,
    },
    create: {
      userId: tutor3User.id,
      headline: "ภาษาอังกฤษสื่อสารและการอ่านจับใจความ",
      bio: "ครูภาษาอังกฤษสาย activity-based learning รอการตรวจเอกสาร",
      experienceYears: 4,
      hourlyRateCents: 75000,
      verificationStatus: TutorVerificationStatus.PENDING,
    },
  });

  const student1 = await db.studentProfile.upsert({
    where: { userId: student1User.id },
    update: {
      displayName: "น้องพิมพ์",
      gradeLevel: "ม.3",
      schoolName: "โรงเรียนสาธิตกรุงเทพ",
      learningGoals: "เพิ่มคะแนนคณิตสอบเข้า ม.4 และลดข้อผิดพลาดโจทย์ประยุกต์",
    },
    create: {
      userId: student1User.id,
      displayName: "น้องพิมพ์",
      gradeLevel: "ม.3",
      schoolName: "โรงเรียนสาธิตกรุงเทพ",
      learningGoals: "เพิ่มคะแนนคณิตสอบเข้า ม.4 และลดข้อผิดพลาดโจทย์ประยุกต์",
    },
  });

  const student2 = await db.studentProfile.upsert({
    where: { userId: student2User.id },
    update: {
      displayName: "น้องกานต์",
      gradeLevel: "ม.3",
      schoolName: "โรงเรียนบดินทรศึกษา",
      learningGoals: "ปรับพื้นฐานสมการและการบ้านให้ส่งสม่ำเสมอ",
    },
    create: {
      userId: student2User.id,
      displayName: "น้องกานต์",
      gradeLevel: "ม.3",
      schoolName: "โรงเรียนบดินทรศึกษา",
      learningGoals: "ปรับพื้นฐานสมการและการบ้านให้ส่งสม่ำเสมอ",
    },
  });

  const student3 = await db.studentProfile.upsert({
    where: { userId: student3User.id },
    update: {
      displayName: "น้องธัน",
      gradeLevel: "ม.4",
      schoolName: "โรงเรียนเตรียมวิทย์",
      learningGoals: "เข้าใจแรงและการเคลื่อนที่สำหรับบทเรียนฟิสิกส์ ม.4",
    },
    create: {
      userId: student3User.id,
      displayName: "น้องธัน",
      gradeLevel: "ม.4",
      schoolName: "โรงเรียนเตรียมวิทย์",
      learningGoals: "เข้าใจแรงและการเคลื่อนที่สำหรับบทเรียนฟิสิกส์ ม.4",
    },
  });

  const student4 = await db.studentProfile.upsert({
    where: { userId: student4User.id },
    update: {
      displayName: "น้องดา",
      gradeLevel: "ป.6",
      schoolName: "โรงเรียนวัฒนาวิทยา",
      learningGoals: "ฝึกพูดอังกฤษให้มั่นใจก่อนสอบสัมภาษณ์",
    },
    create: {
      userId: student4User.id,
      displayName: "น้องดา",
      gradeLevel: "ป.6",
      schoolName: "โรงเรียนวัฒนาวิทยา",
      learningGoals: "ฝึกพูดอังกฤษให้มั่นใจก่อนสอบสัมภาษณ์",
    },
  });

  const student5 = await db.studentProfile.upsert({
    where: { userId: student5User.id },
    update: {
      displayName: "น้องปุณ",
      gradeLevel: "ม.5",
      schoolName: "โรงเรียนอัสสัมศึกษา",
      learningGoals: "เตรียม SAT Math รอบปลายปี",
    },
    create: {
      userId: student5User.id,
      displayName: "น้องปุณ",
      gradeLevel: "ม.5",
      schoolName: "โรงเรียนอัสสัมศึกษา",
      learningGoals: "เตรียม SAT Math รอบปลายปี",
    },
  });

  const parent1 = await db.parentProfile.upsert({
    where: { userId: parent1User.id },
    update: {
      displayName: "คุณแม่ศิริพร",
      phone: "089-100-2001",
    },
    create: {
      userId: parent1User.id,
      displayName: "คุณแม่ศิริพร",
      phone: "089-100-2001",
    },
  });

  const parent2 = await db.parentProfile.upsert({
    where: { userId: parent2User.id },
    update: {
      displayName: "คุณแม่เมธินี",
      phone: "089-100-2002",
    },
    create: {
      userId: parent2User.id,
      displayName: "คุณแม่เมธินี",
      phone: "089-100-2002",
    },
  });

  const parent3 = await db.parentProfile.upsert({
    where: { userId: parent3User.id },
    update: {
      displayName: "คุณพ่อชยุตม์",
      phone: "089-100-2003",
    },
    create: {
      userId: parent3User.id,
      displayName: "คุณพ่อชยุตม์",
      phone: "089-100-2003",
    },
  });

  await Promise.all([
    db.parentStudentLink.upsert({
      where: {
        parentId_studentId: { parentId: parent1.id, studentId: student1.id },
      },
      update: { relationship: "แม่", isActive: true, endedAt: null },
      create: {
        parentId: parent1.id,
        studentId: student1.id,
        relationship: "แม่",
        isActive: true,
      },
    }),
    db.parentStudentLink.upsert({
      where: {
        parentId_studentId: { parentId: parent1.id, studentId: student5.id },
      },
      update: { relationship: "แม่", isActive: true, endedAt: null },
      create: {
        parentId: parent1.id,
        studentId: student5.id,
        relationship: "แม่",
        isActive: true,
      },
    }),
    db.parentStudentLink.upsert({
      where: {
        parentId_studentId: { parentId: parent2.id, studentId: student2.id },
      },
      update: { relationship: "แม่", isActive: true, endedAt: null },
      create: {
        parentId: parent2.id,
        studentId: student2.id,
        relationship: "แม่",
        isActive: true,
      },
    }),
    db.parentStudentLink.upsert({
      where: {
        parentId_studentId: { parentId: parent3.id, studentId: student3.id },
      },
      update: { relationship: "พ่อ", isActive: true, endedAt: null },
      create: {
        parentId: parent3.id,
        studentId: student3.id,
        relationship: "พ่อ",
        isActive: true,
      },
    }),
    db.parentStudentLink.upsert({
      where: {
        parentId_studentId: { parentId: parent3.id, studentId: student4.id },
      },
      update: { relationship: "พ่อ", isActive: true, endedAt: null },
      create: {
        parentId: parent3.id,
        studentId: student4.id,
        relationship: "พ่อ",
        isActive: true,
      },
    }),
  ]);

  console.info("Seeding subjects and courses for marketplace views...");

  const math = await db.subject.upsert({
    where: { slug: "mathematics" },
    update: {
      name: "คณิตศาสตร์",
      description: "พีชคณิต เรขาคณิต และโจทย์สอบแข่งขัน",
    },
    create: {
      slug: "mathematics",
      name: "คณิตศาสตร์",
      description: "พีชคณิต เรขาคณิต และโจทย์สอบแข่งขัน",
    },
  });

  const physics = await db.subject.upsert({
    where: { slug: "physics" },
    update: {
      name: "ฟิสิกส์",
      description: "กลศาสตร์ ไฟฟ้า คลื่น และฟิสิกส์เตรียมสอบ",
    },
    create: {
      slug: "physics",
      name: "ฟิสิกส์",
      description: "กลศาสตร์ ไฟฟ้า คลื่น และฟิสิกส์เตรียมสอบ",
    },
  });

  const chemistry = await db.subject.upsert({
    where: { slug: "chemistry" },
    update: {
      name: "เคมี",
      description: "เคมีพื้นฐาน คำนวณ และทดลอง",
    },
    create: {
      slug: "chemistry",
      name: "เคมี",
      description: "เคมีพื้นฐาน คำนวณ และทดลอง",
    },
  });

  const biology = await db.subject.upsert({
    where: { slug: "biology" },
    update: {
      name: "ชีววิทยา",
      description: "ชีววิทยา ม.ต้น-ม.ปลาย และเตรียมสอบ",
    },
    create: {
      slug: "biology",
      name: "ชีววิทยา",
      description: "ชีววิทยา ม.ต้น-ม.ปลาย และเตรียมสอบ",
    },
  });

  const english = await db.subject.upsert({
    where: { slug: "english" },
    update: {
      name: "ภาษาอังกฤษ",
      description: "พูด อ่าน เขียน และเตรียมสอบสัมภาษณ์",
    },
    create: {
      slug: "english",
      name: "ภาษาอังกฤษ",
      description: "พูด อ่าน เขียน และเตรียมสอบสัมภาษณ์",
    },
  });

  const thai = await db.subject.upsert({
    where: { slug: "thai-language" },
    update: {
      name: "ภาษาไทย",
      description: "อ่านจับใจความ เขียนสรุป และหลักภาษา",
    },
    create: {
      slug: "thai-language",
      name: "ภาษาไทย",
      description: "อ่านจับใจความ เขียนสรุป และหลักภาษา",
    },
  });

  const courseMathGroup = await db.course.upsert({
    where: { slug: "m3-math-foundation-entrance" },
    update: {
      tutorId: tutor1.id,
      subjectId: math.id,
      title: "คณิต ม.3 พื้นฐานแน่นก่อนสอบเข้า",
      description: "คอร์สกลุ่มเล็กสำหรับสมการ โจทย์ประยุกต์ และการจัดเวลา",
      level: "middle-school",
      type: CourseType.GROUP,
      status: CourseStatus.PUBLISHED,
      priceCents: 520000,
      capacity: 8,
      totalSessions: 12,
      startsAt: at("2026-04-01T10:00:00+07:00"),
      endsAt: at("2026-06-30T10:00:00+07:00"),
      publishedAt: at("2026-03-15T09:00:00+07:00"),
    },
    create: {
      slug: "m3-math-foundation-entrance",
      tutorId: tutor1.id,
      subjectId: math.id,
      title: "คณิต ม.3 พื้นฐานแน่นก่อนสอบเข้า",
      description: "คอร์สกลุ่มเล็กสำหรับสมการ โจทย์ประยุกต์ และการจัดเวลา",
      level: "middle-school",
      type: CourseType.GROUP,
      status: CourseStatus.PUBLISHED,
      priceCents: 520000,
      capacity: 8,
      totalSessions: 12,
      startsAt: at("2026-04-01T10:00:00+07:00"),
      endsAt: at("2026-06-30T10:00:00+07:00"),
      publishedAt: at("2026-03-15T09:00:00+07:00"),
    },
  });

  const courseSatPrivate = await db.course.upsert({
    where: { slug: "sat-math-private-bootcamp" },
    update: {
      tutorId: tutor1.id,
      subjectId: math.id,
      title: "SAT Math Private Bootcamp",
      description: "ติวตัวต่อตัว วางแผนคะแนน SAT Math พร้อม diagnostic รายสัปดาห์",
      level: "international",
      type: CourseType.PRIVATE,
      status: CourseStatus.PUBLISHED,
      priceCents: 1200000,
      capacity: 1,
      totalSessions: 10,
      startsAt: at("2026-05-06T18:00:00+07:00"),
      endsAt: at("2026-07-29T18:00:00+07:00"),
      publishedAt: at("2026-04-05T09:00:00+07:00"),
    },
    create: {
      slug: "sat-math-private-bootcamp",
      tutorId: tutor1.id,
      subjectId: math.id,
      title: "SAT Math Private Bootcamp",
      description: "ติวตัวต่อตัว วางแผนคะแนน SAT Math พร้อม diagnostic รายสัปดาห์",
      level: "international",
      type: CourseType.PRIVATE,
      status: CourseStatus.PUBLISHED,
      priceCents: 1200000,
      capacity: 1,
      totalSessions: 10,
      startsAt: at("2026-05-06T18:00:00+07:00"),
      endsAt: at("2026-07-29T18:00:00+07:00"),
      publishedAt: at("2026-04-05T09:00:00+07:00"),
    },
  });

  const coursePhysics = await db.course.upsert({
    where: { slug: "m4-physics-mechanics" },
    update: {
      tutorId: tutor2.id,
      subjectId: physics.id,
      title: "ฟิสิกส์ ม.4 กลศาสตร์เข้าใจจริง",
      description: "แรง การเคลื่อนที่ กราฟ และโจทย์วิเคราะห์",
      level: "high-school",
      type: CourseType.GROUP,
      status: CourseStatus.PUBLISHED,
      priceCents: 650000,
      capacity: 10,
      totalSessions: 10,
      startsAt: at("2026-04-04T13:00:00+07:00"),
      endsAt: at("2026-06-27T13:00:00+07:00"),
      publishedAt: at("2026-03-20T09:00:00+07:00"),
    },
    create: {
      slug: "m4-physics-mechanics",
      tutorId: tutor2.id,
      subjectId: physics.id,
      title: "ฟิสิกส์ ม.4 กลศาสตร์เข้าใจจริง",
      description: "แรง การเคลื่อนที่ กราฟ และโจทย์วิเคราะห์",
      level: "high-school",
      type: CourseType.GROUP,
      status: CourseStatus.PUBLISHED,
      priceCents: 650000,
      capacity: 10,
      totalSessions: 10,
      startsAt: at("2026-04-04T13:00:00+07:00"),
      endsAt: at("2026-06-27T13:00:00+07:00"),
      publishedAt: at("2026-03-20T09:00:00+07:00"),
    },
  });

  const courseChemistry = await db.course.upsert({
    where: { slug: "chemistry-foundation-lab" },
    update: {
      tutorId: tutor2.id,
      subjectId: chemistry.id,
      title: "เคมีพื้นฐานพร้อมโจทย์ทดลอง",
      description: "ปูพื้นฐานปริมาณสารสัมพันธ์และการอ่านผลทดลอง",
      level: "high-school",
      type: CourseType.GROUP,
      status: CourseStatus.PUBLISHED,
      priceCents: 580000,
      capacity: 8,
      totalSessions: 8,
      startsAt: at("2026-05-09T10:00:00+07:00"),
      endsAt: at("2026-07-18T10:00:00+07:00"),
      publishedAt: at("2026-04-22T09:00:00+07:00"),
    },
    create: {
      slug: "chemistry-foundation-lab",
      tutorId: tutor2.id,
      subjectId: chemistry.id,
      title: "เคมีพื้นฐานพร้อมโจทย์ทดลอง",
      description: "ปูพื้นฐานปริมาณสารสัมพันธ์และการอ่านผลทดลอง",
      level: "high-school",
      type: CourseType.GROUP,
      status: CourseStatus.PUBLISHED,
      priceCents: 580000,
      capacity: 8,
      totalSessions: 8,
      startsAt: at("2026-05-09T10:00:00+07:00"),
      endsAt: at("2026-07-18T10:00:00+07:00"),
      publishedAt: at("2026-04-22T09:00:00+07:00"),
    },
  });

  const courseEnglish = await db.course.upsert({
    where: { slug: "english-speaking-confidence" },
    update: {
      tutorId: tutor3.id,
      subjectId: english.id,
      title: "English Speaking Confidence",
      description: "คอร์ส draft สำหรับครูที่รอการตรวจเอกสาร",
      level: "all-levels",
      type: CourseType.GROUP,
      status: CourseStatus.DRAFT,
      priceCents: 420000,
      capacity: 6,
      totalSessions: 8,
      startsAt: at("2026-05-11T17:00:00+07:00"),
      endsAt: at("2026-06-29T17:00:00+07:00"),
      publishedAt: null,
    },
    create: {
      slug: "english-speaking-confidence",
      tutorId: tutor3.id,
      subjectId: english.id,
      title: "English Speaking Confidence",
      description: "คอร์ส draft สำหรับครูที่รอการตรวจเอกสาร",
      level: "all-levels",
      type: CourseType.GROUP,
      status: CourseStatus.DRAFT,
      priceCents: 420000,
      capacity: 6,
      totalSessions: 8,
      startsAt: at("2026-05-11T17:00:00+07:00"),
      endsAt: at("2026-06-29T17:00:00+07:00"),
    },
  });

  await db.course.upsert({
    where: { slug: "thai-critical-reading-draft" },
    update: {
      tutorId: tutor3.id,
      subjectId: thai.id,
      title: "อ่านจับใจความภาษาไทย เตรียมสอบเข้า",
      description: "คอร์ส draft สำหรับทดสอบ empty state ฝั่ง marketplace/admin",
      level: "exam-prep",
      type: CourseType.GROUP,
      status: CourseStatus.DRAFT,
      priceCents: 390000,
      capacity: 8,
      totalSessions: 8,
      startsAt: at("2026-06-01T16:30:00+07:00"),
      endsAt: at("2026-07-20T16:30:00+07:00"),
      publishedAt: null,
    },
    create: {
      slug: "thai-critical-reading-draft",
      tutorId: tutor3.id,
      subjectId: thai.id,
      title: "อ่านจับใจความภาษาไทย เตรียมสอบเข้า",
      description: "คอร์ส draft สำหรับทดสอบ empty state ฝั่ง marketplace/admin",
      level: "exam-prep",
      type: CourseType.GROUP,
      status: CourseStatus.DRAFT,
      priceCents: 390000,
      capacity: 8,
      totalSessions: 8,
      startsAt: at("2026-06-01T16:30:00+07:00"),
      endsAt: at("2026-07-20T16:30:00+07:00"),
    },
  });

  // Keep Biology available for subject filters even before a course is published.
  void biology;

  console.info("Seeding enrollments, sessions, and attendance...");

  const enrollment1 = await upsertEnrollment(db, {
    studentId: student1.id,
    courseId: courseMathGroup.id,
    status: EnrollmentStatus.ACTIVE,
    enrolledAt: at("2026-03-25T08:30:00+07:00"),
  });

  const enrollment2 = await upsertEnrollment(db, {
    studentId: student2.id,
    courseId: courseMathGroup.id,
    status: EnrollmentStatus.ACTIVE,
    enrolledAt: at("2026-03-27T11:00:00+07:00"),
  });

  const enrollment3 = await upsertEnrollment(db, {
    studentId: student3.id,
    courseId: coursePhysics.id,
    status: EnrollmentStatus.ACTIVE,
    enrolledAt: at("2026-03-28T14:30:00+07:00"),
  });

  const enrollment4 = await upsertEnrollment(db, {
    studentId: student4.id,
    courseId: courseChemistry.id,
    status: EnrollmentStatus.PENDING,
    enrolledAt: at("2026-05-01T18:20:00+07:00"),
  });

  const enrollment5 = await upsertEnrollment(db, {
    studentId: student5.id,
    courseId: courseSatPrivate.id,
    status: EnrollmentStatus.ACTIVE,
    enrolledAt: at("2026-04-28T09:45:00+07:00"),
  });

  await upsertEnrollment(db, {
    studentId: student2.id,
    courseId: courseChemistry.id,
    status: EnrollmentStatus.CANCELLED,
    enrolledAt: at("2026-04-20T12:00:00+07:00"),
    cancelledAt: at("2026-04-27T12:00:00+07:00"),
  });

  const mathSession1 = await upsertLessonSession(db, {
    courseId: courseMathGroup.id,
    title: "สมการเชิงเส้นและการจัดรูป",
    description: "ทบทวนพื้นฐานสมการและแบบฝึกหัดระดับสอบเข้า",
    startsAt: at("2026-04-07T17:00:00+07:00"),
    endsAt: at("2026-04-07T18:30:00+07:00"),
    meetingUrl: "https://meet.tutortrack.test/math-m3-01",
    status: SessionStatus.COMPLETED,
  });

  const mathSession2 = await upsertLessonSession(db, {
    courseId: courseMathGroup.id,
    title: "โจทย์ประยุกต์สมการ",
    description: "แปลงโจทย์ภาษาไทยเป็นสมการและตรวจคำตอบ",
    startsAt: at("2026-04-14T17:00:00+07:00"),
    endsAt: at("2026-04-14T18:30:00+07:00"),
    meetingUrl: "https://meet.tutortrack.test/math-m3-02",
    status: SessionStatus.COMPLETED,
  });

  const mathSession3 = await upsertLessonSession(db, {
    courseId: courseMathGroup.id,
    title: "กราฟเส้นตรงและความชัน",
    description: "เชื่อมโยงสมการกับกราฟและโจทย์วิเคราะห์",
    startsAt: at("2026-04-21T17:00:00+07:00"),
    endsAt: at("2026-04-21T18:30:00+07:00"),
    meetingUrl: "https://meet.tutortrack.test/math-m3-03",
    status: SessionStatus.COMPLETED,
  });

  await upsertLessonSession(db, {
    courseId: courseMathGroup.id,
    title: "สรุปก่อน mock test",
    description: "ทวนจุดพลาดและแผนทำข้อสอบรายคน",
    startsAt: at("2026-05-12T17:00:00+07:00"),
    endsAt: at("2026-05-12T18:30:00+07:00"),
    meetingUrl: "https://meet.tutortrack.test/math-m3-04",
    status: SessionStatus.SCHEDULED,
  });

  const physicsSession1 = await upsertLessonSession(db, {
    courseId: coursePhysics.id,
    title: "แรงและกฎของนิวตัน",
    description: "วิเคราะห์ free-body diagram และแรงลัพธ์",
    startsAt: at("2026-04-06T13:00:00+07:00"),
    endsAt: at("2026-04-06T14:30:00+07:00"),
    meetingUrl: "https://meet.tutortrack.test/physics-m4-01",
    status: SessionStatus.COMPLETED,
  });

  await upsertLessonSession(db, {
    courseId: coursePhysics.id,
    title: "การเคลื่อนที่แนวตรง",
    description: "กราฟ s-t, v-t และโจทย์คำนวณ",
    startsAt: at("2026-04-13T13:00:00+07:00"),
    endsAt: at("2026-04-13T14:30:00+07:00"),
    meetingUrl: "https://meet.tutortrack.test/physics-m4-02",
    status: SessionStatus.COMPLETED,
  });

  const satSession1 = await upsertLessonSession(db, {
    courseId: courseSatPrivate.id,
    title: "SAT Math diagnostic review",
    description: "ดูจุดอ่อนจาก diagnostic และวางแผน drill",
    startsAt: at("2026-05-06T18:00:00+07:00"),
    endsAt: at("2026-05-06T19:30:00+07:00"),
    meetingUrl: "https://meet.tutortrack.test/sat-private-01",
    status: SessionStatus.SCHEDULED,
  });

  await upsertLessonSession(db, {
    courseId: courseEnglish.id,
    title: "Self introduction and interview warm-up",
    description: "ฝึกแนะนำตัวและตอบคำถามพื้นฐาน",
    startsAt: at("2026-05-11T17:00:00+07:00"),
    endsAt: at("2026-05-11T18:00:00+07:00"),
    meetingUrl: "https://meet.tutortrack.test/english-speaking-01",
    status: SessionStatus.SCHEDULED,
  });

  await Promise.all([
    db.attendance.upsert({
      where: {
        sessionId_studentId: {
          sessionId: mathSession1.id,
          studentId: student1.id,
        },
      },
      update: {
        enrollmentId: enrollment1.id,
        status: AttendanceStatus.PRESENT,
        note: "เข้าเรียนตรงเวลาและตอบคำถามได้ดี",
      },
      create: {
        sessionId: mathSession1.id,
        studentId: student1.id,
        enrollmentId: enrollment1.id,
        status: AttendanceStatus.PRESENT,
        note: "เข้าเรียนตรงเวลาและตอบคำถามได้ดี",
      },
    }),
    db.attendance.upsert({
      where: {
        sessionId_studentId: {
          sessionId: mathSession2.id,
          studentId: student1.id,
        },
      },
      update: {
        enrollmentId: enrollment1.id,
        status: AttendanceStatus.PRESENT,
        note: "ทำแบบฝึกหัดครบ",
      },
      create: {
        sessionId: mathSession2.id,
        studentId: student1.id,
        enrollmentId: enrollment1.id,
        status: AttendanceStatus.PRESENT,
        note: "ทำแบบฝึกหัดครบ",
      },
    }),
    db.attendance.upsert({
      where: {
        sessionId_studentId: {
          sessionId: mathSession3.id,
          studentId: student1.id,
        },
      },
      update: {
        enrollmentId: enrollment1.id,
        status: AttendanceStatus.LATE,
        note: "เข้าเรียนช้า 8 นาที แต่ตามเนื้อหาทัน",
      },
      create: {
        sessionId: mathSession3.id,
        studentId: student1.id,
        enrollmentId: enrollment1.id,
        status: AttendanceStatus.LATE,
        note: "เข้าเรียนช้า 8 นาที แต่ตามเนื้อหาทัน",
      },
    }),
    db.attendance.upsert({
      where: {
        sessionId_studentId: {
          sessionId: mathSession1.id,
          studentId: student2.id,
        },
      },
      update: {
        enrollmentId: enrollment2.id,
        status: AttendanceStatus.PRESENT,
        note: "ยังต้องทวนการย้ายข้างสมการ",
      },
      create: {
        sessionId: mathSession1.id,
        studentId: student2.id,
        enrollmentId: enrollment2.id,
        status: AttendanceStatus.PRESENT,
        note: "ยังต้องทวนการย้ายข้างสมการ",
      },
    }),
    db.attendance.upsert({
      where: {
        sessionId_studentId: {
          sessionId: mathSession2.id,
          studentId: student2.id,
        },
      },
      update: {
        enrollmentId: enrollment2.id,
        status: AttendanceStatus.ABSENT,
        note: "แจ้งลาป่วยหลังคลาส",
      },
      create: {
        sessionId: mathSession2.id,
        studentId: student2.id,
        enrollmentId: enrollment2.id,
        status: AttendanceStatus.ABSENT,
        note: "แจ้งลาป่วยหลังคลาส",
      },
    }),
    db.attendance.upsert({
      where: {
        sessionId_studentId: {
          sessionId: physicsSession1.id,
          studentId: student3.id,
        },
      },
      update: {
        enrollmentId: enrollment3.id,
        status: AttendanceStatus.PRESENT,
        note: "วาด free-body diagram ได้ถูกต้อง",
      },
      create: {
        sessionId: physicsSession1.id,
        studentId: student3.id,
        enrollmentId: enrollment3.id,
        status: AttendanceStatus.PRESENT,
        note: "วาด free-body diagram ได้ถูกต้อง",
      },
    }),
    db.attendance.upsert({
      where: {
        sessionId_studentId: {
          sessionId: satSession1.id,
          studentId: student5.id,
        },
      },
      update: {
        enrollmentId: enrollment5.id,
        status: AttendanceStatus.EXCUSED,
        note: "เลื่อนคลาสเพราะสอบกลางภาค",
      },
      create: {
        sessionId: satSession1.id,
        studentId: student5.id,
        enrollmentId: enrollment5.id,
        status: AttendanceStatus.EXCUSED,
        note: "เลื่อนคลาสเพราะสอบกลางภาค",
      },
    }),
  ]);

  console.info("Seeding assignments, submissions, assessments, and skills...");

  const mathAssignment1 = await upsertAssignment(db, {
    courseId: courseMathGroup.id,
    title: "แบบฝึกหัดสมการเชิงเส้น ชุดที่ 1",
    instructions: "ทำข้อ 1-20 พร้อมเขียนวิธีคิดทุกข้อ",
    dueAt: at("2026-04-10T23:59:00+07:00"),
    maxScore: 100,
  });

  const mathAssignment2 = await upsertAssignment(db, {
    courseId: courseMathGroup.id,
    title: "โจทย์ประยุกต์ก่อนสอบย่อย",
    instructions: "เลือกทำ 12 ข้อจากชุดโจทย์และสรุปจุดที่ยังไม่มั่นใจ",
    dueAt: at("2026-04-24T23:59:00+07:00"),
    maxScore: 100,
  });

  const physicsAssignment1 = await upsertAssignment(db, {
    courseId: coursePhysics.id,
    title: "รายงานแรงลัพธ์จาก free-body diagram",
    instructions: "ส่งภาพ free-body diagram พร้อมคำอธิบายแรงแต่ละทิศ",
    dueAt: at("2026-04-16T23:59:00+07:00"),
    maxScore: 50,
  });

  const satAssignment1 = await upsertAssignment(db, {
    courseId: courseSatPrivate.id,
    title: "SAT Math diagnostic drill",
    instructions: "ทำ timed drill 25 นาทีและบันทึกข้อที่เดา",
    dueAt: at("2026-05-13T23:59:00+07:00"),
    maxScore: 100,
  });

  await upsertAssignment(db, {
    courseId: courseEnglish.id,
    title: "Speaking reflection",
    instructions: "อัดเสียงแนะนำตัว 1 นาทีหลังคลาสแรก",
    dueAt: at("2026-05-14T23:59:00+07:00"),
    maxScore: 20,
  });

  await Promise.all([
    db.submission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: mathAssignment1.id,
          studentId: student1.id,
        },
      },
      update: {
        enrollmentId: enrollment1.id,
        content: "ส่งครบ 20 ข้อ พร้อมวิธีทำละเอียด",
        submittedAt: at("2026-04-09T20:30:00+07:00"),
        score: 92,
        feedback: "แม่นยำขึ้นมาก ระวังเครื่องหมายลบในข้อยาว",
        gradedAt: at("2026-04-10T09:00:00+07:00"),
      },
      create: {
        assignmentId: mathAssignment1.id,
        studentId: student1.id,
        enrollmentId: enrollment1.id,
        content: "ส่งครบ 20 ข้อ พร้อมวิธีทำละเอียด",
        submittedAt: at("2026-04-09T20:30:00+07:00"),
        score: 92,
        feedback: "แม่นยำขึ้นมาก ระวังเครื่องหมายลบในข้อยาว",
        gradedAt: at("2026-04-10T09:00:00+07:00"),
      },
    }),
    db.submission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: mathAssignment2.id,
          studentId: student1.id,
        },
      },
      update: {
        enrollmentId: enrollment1.id,
        content: "สรุปจุดพลาดเรื่องการตีความโจทย์เวลา/ระยะทาง",
        submittedAt: at("2026-04-23T21:10:00+07:00"),
        score: 88,
        feedback: "โครงวิธีคิดดีขึ้น ให้ฝึกจับ keyword เพิ่ม",
        gradedAt: at("2026-04-24T10:00:00+07:00"),
      },
      create: {
        assignmentId: mathAssignment2.id,
        studentId: student1.id,
        enrollmentId: enrollment1.id,
        content: "สรุปจุดพลาดเรื่องการตีความโจทย์เวลา/ระยะทาง",
        submittedAt: at("2026-04-23T21:10:00+07:00"),
        score: 88,
        feedback: "โครงวิธีคิดดีขึ้น ให้ฝึกจับ keyword เพิ่ม",
        gradedAt: at("2026-04-24T10:00:00+07:00"),
      },
    }),
    db.submission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: mathAssignment1.id,
          studentId: student2.id,
        },
      },
      update: {
        enrollmentId: enrollment2.id,
        content: "ส่ง 12 จาก 20 ข้อ",
        submittedAt: at("2026-04-11T08:40:00+07:00"),
        score: 54,
        feedback: "ควรทวนการจัดรูปก่อนแก้สมการ",
        gradedAt: at("2026-04-11T12:00:00+07:00"),
      },
      create: {
        assignmentId: mathAssignment1.id,
        studentId: student2.id,
        enrollmentId: enrollment2.id,
        content: "ส่ง 12 จาก 20 ข้อ",
        submittedAt: at("2026-04-11T08:40:00+07:00"),
        score: 54,
        feedback: "ควรทวนการจัดรูปก่อนแก้สมการ",
        gradedAt: at("2026-04-11T12:00:00+07:00"),
      },
    }),
    db.submission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: physicsAssignment1.id,
          studentId: student3.id,
        },
      },
      update: {
        enrollmentId: enrollment3.id,
        content: "แนบภาพ diagram และคำอธิบายแรงปกติ/แรงเสียดทาน",
        fileUrl: "https://files.tutortrack.test/demo/physics-fbd-thanapat.pdf",
        submittedAt: at("2026-04-15T19:20:00+07:00"),
        score: 42,
        feedback: "เข้าใจแรงหลักดีแล้ว เพิ่มทิศแรงเสียดทานให้ชัด",
        gradedAt: at("2026-04-16T09:30:00+07:00"),
      },
      create: {
        assignmentId: physicsAssignment1.id,
        studentId: student3.id,
        enrollmentId: enrollment3.id,
        content: "แนบภาพ diagram และคำอธิบายแรงปกติ/แรงเสียดทาน",
        fileUrl: "https://files.tutortrack.test/demo/physics-fbd-thanapat.pdf",
        submittedAt: at("2026-04-15T19:20:00+07:00"),
        score: 42,
        feedback: "เข้าใจแรงหลักดีแล้ว เพิ่มทิศแรงเสียดทานให้ชัด",
        gradedAt: at("2026-04-16T09:30:00+07:00"),
      },
    }),
    db.submission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: satAssignment1.id,
          studentId: student5.id,
        },
      },
      update: {
        enrollmentId: enrollment5.id,
        content: "ยังไม่ครบชุด ส่งเฉพาะข้อที่มั่นใจ",
        submittedAt: at("2026-05-03T22:10:00+07:00"),
        score: null,
        feedback: "รอตรวจหลังคลาส diagnostic",
        gradedAt: null,
      },
      create: {
        assignmentId: satAssignment1.id,
        studentId: student5.id,
        enrollmentId: enrollment5.id,
        content: "ยังไม่ครบชุด ส่งเฉพาะข้อที่มั่นใจ",
        submittedAt: at("2026-05-03T22:10:00+07:00"),
        feedback: "รอตรวจหลังคลาส diagnostic",
      },
    }),
  ]);

  await Promise.all([
    upsertAssessment(db, {
      courseId: courseMathGroup.id,
      studentId: student1.id,
      enrollmentId: enrollment1.id,
      title: "Pre-test คณิต ม.3",
      type: AssessmentType.PRE_TEST,
      score: 62,
      maxScore: 100,
      takenAt: at("2026-04-01T17:00:00+07:00"),
      note: "พื้นฐานดีแต่โจทย์ประยุกต์ยังช้า",
    }),
    upsertAssessment(db, {
      courseId: courseMathGroup.id,
      studentId: student1.id,
      enrollmentId: enrollment1.id,
      title: "Quiz สมการและกราฟ",
      type: AssessmentType.QUIZ,
      score: 84,
      maxScore: 100,
      takenAt: at("2026-04-22T17:00:00+07:00"),
      note: "จัดรูปสมการได้คล่องขึ้น",
    }),
    upsertAssessment(db, {
      courseId: courseMathGroup.id,
      studentId: student1.id,
      enrollmentId: enrollment1.id,
      title: "Post-test รอบที่ 1",
      type: AssessmentType.POST_TEST,
      score: 89,
      maxScore: 100,
      takenAt: at("2026-04-29T17:00:00+07:00"),
      note: "พร้อมเริ่มชุดโจทย์จับเวลา",
    }),
    upsertAssessment(db, {
      courseId: courseMathGroup.id,
      studentId: student2.id,
      enrollmentId: enrollment2.id,
      title: "Pre-test คณิต ม.3",
      type: AssessmentType.PRE_TEST,
      score: 41,
      maxScore: 100,
      takenAt: at("2026-04-01T17:00:00+07:00"),
      note: "ต้องเสริมพื้นฐานก่อนทำโจทย์ยาว",
    }),
    upsertAssessment(db, {
      courseId: coursePhysics.id,
      studentId: student3.id,
      enrollmentId: enrollment3.id,
      title: "Quiz แรงและกฎนิวตัน",
      type: AssessmentType.QUIZ,
      score: 76,
      maxScore: 100,
      takenAt: at("2026-04-20T13:00:00+07:00"),
      note: "เข้าใจ concept ดี แต่โจทย์หลายแรงยังช้า",
    }),
    upsertAssessment(db, {
      courseId: courseSatPrivate.id,
      studentId: student5.id,
      enrollmentId: enrollment5.id,
      title: "SAT Math diagnostic",
      type: AssessmentType.PRE_TEST,
      score: 680,
      maxScore: 800,
      takenAt: at("2026-05-02T18:00:00+07:00"),
      note: "เป้าหมาย 740 ต้องเร่ง geometry และ data analysis",
    }),
  ]);

  const algebraSkill = await db.skill.upsert({
    where: {
      courseId_name: {
        courseId: courseMathGroup.id,
        name: "พื้นฐานพีชคณิต",
      },
    },
    update: {
      description: "การจัดรูปและแก้สมการพื้นฐาน",
      sortOrder: 1,
    },
    create: {
      courseId: courseMathGroup.id,
      name: "พื้นฐานพีชคณิต",
      description: "การจัดรูปและแก้สมการพื้นฐาน",
      sortOrder: 1,
    },
  });

  const equationSkill = await db.skill.upsert({
    where: {
      courseId_name: {
        courseId: courseMathGroup.id,
        name: "แก้สมการเชิงเส้น",
      },
    },
    update: {
      description: "แก้สมการหลายขั้นตอนและตรวจคำตอบ",
      sortOrder: 2,
    },
    create: {
      courseId: courseMathGroup.id,
      name: "แก้สมการเชิงเส้น",
      description: "แก้สมการหลายขั้นตอนและตรวจคำตอบ",
      sortOrder: 2,
    },
  });

  const wordProblemSkill = await db.skill.upsert({
    where: {
      courseId_name: {
        courseId: courseMathGroup.id,
        name: "วิเคราะห์โจทย์ประยุกต์",
      },
    },
    update: {
      description: "แปลงโจทย์ภาษาเป็นสมการและเลือกข้อมูลสำคัญ",
      sortOrder: 3,
    },
    create: {
      courseId: courseMathGroup.id,
      name: "วิเคราะห์โจทย์ประยุกต์",
      description: "แปลงโจทย์ภาษาเป็นสมการและเลือกข้อมูลสำคัญ",
      sortOrder: 3,
    },
  });

  const pacingSkill = await db.skill.upsert({
    where: {
      courseId_name: {
        courseId: courseMathGroup.id,
        name: "การจัดเวลาทำข้อสอบ",
      },
    },
    update: {
      description: "เลือกข้อ วางเวลา และลดความผิดพลาดตอนจับเวลา",
      sortOrder: 4,
    },
    create: {
      courseId: courseMathGroup.id,
      name: "การจัดเวลาทำข้อสอบ",
      description: "เลือกข้อ วางเวลา และลดความผิดพลาดตอนจับเวลา",
      sortOrder: 4,
    },
  });

  const forceSkill = await db.skill.upsert({
    where: {
      courseId_name: {
        courseId: coursePhysics.id,
        name: "Free-body diagram",
      },
    },
    update: {
      description: "แยกแรงและวาด diagram ได้ครบ",
      sortOrder: 1,
    },
    create: {
      courseId: coursePhysics.id,
      name: "Free-body diagram",
      description: "แยกแรงและวาด diagram ได้ครบ",
      sortOrder: 1,
    },
  });

  const satGeometrySkill = await db.skill.upsert({
    where: {
      courseId_name: {
        courseId: courseSatPrivate.id,
        name: "SAT Geometry",
      },
    },
    update: {
      description: "รูปเรขาคณิต พื้นที่ ปริมาตร และมุม",
      sortOrder: 1,
    },
    create: {
      courseId: courseSatPrivate.id,
      name: "SAT Geometry",
      description: "รูปเรขาคณิต พื้นที่ ปริมาตร และมุม",
      sortOrder: 1,
    },
  });

  await Promise.all([
    db.studentSkillProgress.upsert({
      where: {
        skillId_studentId: { skillId: algebraSkill.id, studentId: student1.id },
      },
      update: {
        enrollmentId: enrollment1.id,
        updatedByTutorId: tutor1.id,
        level: SkillLevel.EXCELLENT,
        note: "จัดรูปสมการเร็วและอธิบายวิธีคิดได้",
        evaluatedAt: at("2026-04-29T18:30:00+07:00"),
      },
      create: {
        skillId: algebraSkill.id,
        studentId: student1.id,
        enrollmentId: enrollment1.id,
        updatedByTutorId: tutor1.id,
        level: SkillLevel.EXCELLENT,
        note: "จัดรูปสมการเร็วและอธิบายวิธีคิดได้",
        evaluatedAt: at("2026-04-29T18:30:00+07:00"),
      },
    }),
    db.studentSkillProgress.upsert({
      where: {
        skillId_studentId: {
          skillId: equationSkill.id,
          studentId: student1.id,
        },
      },
      update: {
        enrollmentId: enrollment1.id,
        updatedByTutorId: tutor1.id,
        level: SkillLevel.GOOD,
        note: "ผิดเครื่องหมายเล็กน้อยเมื่อโจทย์ยาว",
        evaluatedAt: at("2026-04-29T18:30:00+07:00"),
      },
      create: {
        skillId: equationSkill.id,
        studentId: student1.id,
        enrollmentId: enrollment1.id,
        updatedByTutorId: tutor1.id,
        level: SkillLevel.GOOD,
        note: "ผิดเครื่องหมายเล็กน้อยเมื่อโจทย์ยาว",
        evaluatedAt: at("2026-04-29T18:30:00+07:00"),
      },
    }),
    db.studentSkillProgress.upsert({
      where: {
        skillId_studentId: {
          skillId: wordProblemSkill.id,
          studentId: student1.id,
        },
      },
      update: {
        enrollmentId: enrollment1.id,
        updatedByTutorId: tutor1.id,
        level: SkillLevel.GOOD,
        note: "จับ keyword ดีขึ้น แต่ยังต้องฝึกโจทย์เวลา/ระยะทาง",
        evaluatedAt: at("2026-04-29T18:30:00+07:00"),
      },
      create: {
        skillId: wordProblemSkill.id,
        studentId: student1.id,
        enrollmentId: enrollment1.id,
        updatedByTutorId: tutor1.id,
        level: SkillLevel.GOOD,
        note: "จับ keyword ดีขึ้น แต่ยังต้องฝึกโจทย์เวลา/ระยะทาง",
        evaluatedAt: at("2026-04-29T18:30:00+07:00"),
      },
    }),
    db.studentSkillProgress.upsert({
      where: {
        skillId_studentId: {
          skillId: pacingSkill.id,
          studentId: student1.id,
        },
      },
      update: {
        enrollmentId: enrollment1.id,
        updatedByTutorId: tutor1.id,
        level: SkillLevel.BASIC,
        note: "เริ่มจัดเวลาได้ แต่ควรทำ mock แบบจับเวลาเพิ่ม",
        evaluatedAt: at("2026-04-29T18:30:00+07:00"),
      },
      create: {
        skillId: pacingSkill.id,
        studentId: student1.id,
        enrollmentId: enrollment1.id,
        updatedByTutorId: tutor1.id,
        level: SkillLevel.BASIC,
        note: "เริ่มจัดเวลาได้ แต่ควรทำ mock แบบจับเวลาเพิ่ม",
        evaluatedAt: at("2026-04-29T18:30:00+07:00"),
      },
    }),
    db.studentSkillProgress.upsert({
      where: {
        skillId_studentId: { skillId: algebraSkill.id, studentId: student2.id },
      },
      update: {
        enrollmentId: enrollment2.id,
        updatedByTutorId: tutor1.id,
        level: SkillLevel.BASIC,
        note: "ทำได้เมื่อมีตัวอย่างนำ แต่ยังพลาดเมื่อโจทย์เปลี่ยนรูป",
        evaluatedAt: at("2026-04-20T18:30:00+07:00"),
      },
      create: {
        skillId: algebraSkill.id,
        studentId: student2.id,
        enrollmentId: enrollment2.id,
        updatedByTutorId: tutor1.id,
        level: SkillLevel.BASIC,
        note: "ทำได้เมื่อมีตัวอย่างนำ แต่ยังพลาดเมื่อโจทย์เปลี่ยนรูป",
        evaluatedAt: at("2026-04-20T18:30:00+07:00"),
      },
    }),
    db.studentSkillProgress.upsert({
      where: {
        skillId_studentId: {
          skillId: equationSkill.id,
          studentId: student2.id,
        },
      },
      update: {
        enrollmentId: enrollment2.id,
        updatedByTutorId: tutor1.id,
        level: SkillLevel.NEEDS_WORK,
        note: "ต้องฝึกย้ายข้างและตรวจคำตอบ",
        evaluatedAt: at("2026-04-20T18:30:00+07:00"),
      },
      create: {
        skillId: equationSkill.id,
        studentId: student2.id,
        enrollmentId: enrollment2.id,
        updatedByTutorId: tutor1.id,
        level: SkillLevel.NEEDS_WORK,
        note: "ต้องฝึกย้ายข้างและตรวจคำตอบ",
        evaluatedAt: at("2026-04-20T18:30:00+07:00"),
      },
    }),
    db.studentSkillProgress.upsert({
      where: {
        skillId_studentId: { skillId: forceSkill.id, studentId: student3.id },
      },
      update: {
        enrollmentId: enrollment3.id,
        updatedByTutorId: tutor2.id,
        level: SkillLevel.GOOD,
        note: "แยกแรงหลักได้ครบ เหลือแรงเสียดทานในโจทย์ซ้อน",
        evaluatedAt: at("2026-04-20T14:30:00+07:00"),
      },
      create: {
        skillId: forceSkill.id,
        studentId: student3.id,
        enrollmentId: enrollment3.id,
        updatedByTutorId: tutor2.id,
        level: SkillLevel.GOOD,
        note: "แยกแรงหลักได้ครบ เหลือแรงเสียดทานในโจทย์ซ้อน",
        evaluatedAt: at("2026-04-20T14:30:00+07:00"),
      },
    }),
    db.studentSkillProgress.upsert({
      where: {
        skillId_studentId: {
          skillId: satGeometrySkill.id,
          studentId: student5.id,
        },
      },
      update: {
        enrollmentId: enrollment5.id,
        updatedByTutorId: tutor1.id,
        level: SkillLevel.BASIC,
        note: "พื้นฐานพอใช้ แต่เสียเวลาข้อ geometry มาก",
        evaluatedAt: at("2026-05-03T19:30:00+07:00"),
      },
      create: {
        skillId: satGeometrySkill.id,
        studentId: student5.id,
        enrollmentId: enrollment5.id,
        updatedByTutorId: tutor1.id,
        level: SkillLevel.BASIC,
        note: "พื้นฐานพอใช้ แต่เสียเวลาข้อ geometry มาก",
        evaluatedAt: at("2026-05-03T19:30:00+07:00"),
      },
    }),
  ]);

  console.info("Seeding progress notes, reviews, and manual payments...");

  await Promise.all([
    upsertProgressNote(db, {
      courseId: courseMathGroup.id,
      studentId: student1.id,
      enrollmentId: enrollment1.id,
      tutorId: tutor1.id,
      note: "น้องพิมพ์มีข้อมูลครบสำหรับ progress report รอบแรกแล้ว",
      strengths: "เข้าเรียนสม่ำเสมอ ส่งงานครบ คะแนน quiz ดีขึ้นชัดเจน",
      weaknesses: "ยังใช้เวลานานกับโจทย์ประยุกต์หลายเงื่อนไข",
      recommendedNextSteps:
        "ทำ mock test แบบจับเวลา 2 ชุด และทบทวนโจทย์เวลา/ระยะทาง",
    }),
    upsertProgressNote(db, {
      courseId: courseMathGroup.id,
      studentId: student2.id,
      enrollmentId: enrollment2.id,
      tutorId: tutor1.id,
      note: "น้องกานต์มีข้อมูลบางส่วน เหมาะสำหรับทดสอบ partial report state",
      strengths: "เริ่มถามคำถามเมื่อไม่เข้าใจและไม่กลัวโจทย์พื้นฐาน",
      weaknesses: "ขาดเรียนหนึ่งครั้ง ส่งงานไม่ครบ และยังไม่มี post-test",
      recommendedNextSteps:
        "นัดชดเชยบทโจทย์ประยุกต์ และให้ทำแบบฝึกหัดสั้นทุกวัน",
    }),
    upsertProgressNote(db, {
      courseId: coursePhysics.id,
      studentId: student3.id,
      enrollmentId: enrollment3.id,
      tutorId: tutor2.id,
      note: "น้องธันเข้าใจ free-body diagram แล้วพร้อมต่อยอดเรื่องการเคลื่อนที่",
      strengths: "อธิบายแรงหลักได้เป็นลำดับ",
      weaknesses: "ยังสับสนแรงเสียดทานในโจทย์หลายวัตถุ",
      recommendedNextSteps: "ฝึกโจทย์ระบบสองวัตถุและสรุปทิศแรงก่อนคำนวณ",
    }),
    upsertProgressNote(db, {
      courseId: courseSatPrivate.id,
      studentId: student5.id,
      enrollmentId: enrollment5.id,
      tutorId: tutor1.id,
      note: "น้องปุณมี diagnostic แล้ว แต่ยังต้องเติม session และ homework completion",
      strengths: "พื้นฐาน algebra ดีและมีเป้าหมายคะแนนชัด",
      weaknesses: "Geometry และ data analysis ใช้เวลามาก",
      recommendedNextSteps: "เริ่ม drill geometry แบบจับเวลาและเก็บ error log",
    }),
  ]);

  await Promise.all([
    upsertReview(db, {
      tutorId: tutor1.id,
      courseId: courseMathGroup.id,
      studentId: student1.id,
      authorId: parent1User.id,
      rating: 5,
      comment: "ครูอธิบายเป็นระบบและส่งสรุปหลังเรียนทุกครั้ง",
    }),
    upsertReview(db, {
      tutorId: tutor2.id,
      courseId: coursePhysics.id,
      studentId: student3.id,
      authorId: parent3User.id,
      rating: 4,
      comment: "ลูกเข้าใจฟิสิกส์มากขึ้น อยากให้มีโจทย์เสริมเพิ่มอีก",
    }),
  ]);

  await Promise.all([
    db.payment.upsert({
      where: { referenceCode: "TT-DEMO-PAID-001" },
      update: {
        payerId: parent1User.id,
        courseId: courseMathGroup.id,
        enrollmentId: enrollment1.id,
        method: PaymentMethod.MANUAL_TRANSFER,
        status: PaymentStatus.PAID,
        amountCents: 520000,
        currency: "THB",
        proofUrl: "https://files.tutortrack.test/demo/payment-paid-001.jpg",
        paidAt: at("2026-03-25T09:15:00+07:00"),
        note: "โอนเต็มจำนวนผ่านบัญชีธนาคาร",
      },
      create: {
        referenceCode: "TT-DEMO-PAID-001",
        payerId: parent1User.id,
        courseId: courseMathGroup.id,
        enrollmentId: enrollment1.id,
        method: PaymentMethod.MANUAL_TRANSFER,
        status: PaymentStatus.PAID,
        amountCents: 520000,
        currency: "THB",
        proofUrl: "https://files.tutortrack.test/demo/payment-paid-001.jpg",
        paidAt: at("2026-03-25T09:15:00+07:00"),
        note: "โอนเต็มจำนวนผ่านบัญชีธนาคาร",
      },
    }),
    db.payment.upsert({
      where: { referenceCode: "TT-DEMO-PENDING-001" },
      update: {
        payerId: parent2User.id,
        courseId: courseMathGroup.id,
        enrollmentId: enrollment2.id,
        method: PaymentMethod.PROMPTPAY,
        status: PaymentStatus.PENDING,
        amountCents: 520000,
        currency: "THB",
        proofUrl: null,
        paidAt: null,
        note: "รอตรวจหลักฐานการชำระจากผู้ปกครอง",
      },
      create: {
        referenceCode: "TT-DEMO-PENDING-001",
        payerId: parent2User.id,
        courseId: courseMathGroup.id,
        enrollmentId: enrollment2.id,
        method: PaymentMethod.PROMPTPAY,
        status: PaymentStatus.PENDING,
        amountCents: 520000,
        currency: "THB",
        note: "รอตรวจหลักฐานการชำระจากผู้ปกครอง",
      },
    }),
    db.payment.upsert({
      where: { referenceCode: "TT-DEMO-PAID-002" },
      update: {
        payerId: parent1User.id,
        courseId: courseSatPrivate.id,
        enrollmentId: enrollment5.id,
        method: PaymentMethod.MANUAL_TRANSFER,
        status: PaymentStatus.PAID,
        amountCents: 1200000,
        currency: "THB",
        proofUrl: "https://files.tutortrack.test/demo/payment-paid-002.jpg",
        paidAt: at("2026-04-28T10:15:00+07:00"),
        note: "ชำระคอร์ส private รอบแรก",
      },
      create: {
        referenceCode: "TT-DEMO-PAID-002",
        payerId: parent1User.id,
        courseId: courseSatPrivate.id,
        enrollmentId: enrollment5.id,
        method: PaymentMethod.MANUAL_TRANSFER,
        status: PaymentStatus.PAID,
        amountCents: 1200000,
        currency: "THB",
        proofUrl: "https://files.tutortrack.test/demo/payment-paid-002.jpg",
        paidAt: at("2026-04-28T10:15:00+07:00"),
        note: "ชำระคอร์ส private รอบแรก",
      },
    }),
    db.payment.upsert({
      where: { referenceCode: "TT-DEMO-FAILED-001" },
      update: {
        payerId: parent3User.id,
        courseId: courseChemistry.id,
        enrollmentId: enrollment4.id,
        method: PaymentMethod.CARD,
        status: PaymentStatus.FAILED,
        amountCents: 420000,
        currency: "THB",
        proofUrl: null,
        paidAt: null,
        note: "ใช้ทดสอบ payment failed state",
      },
      create: {
        referenceCode: "TT-DEMO-FAILED-001",
        payerId: parent3User.id,
        courseId: courseChemistry.id,
        enrollmentId: enrollment4.id,
        method: PaymentMethod.CARD,
        status: PaymentStatus.FAILED,
        amountCents: 420000,
        currency: "THB",
        note: "ใช้ทดสอบ payment failed state",
      },
    }),
  ]);

  console.info("TutorTrack demo seed completed.");
  console.info("Progress report ready: student1@tutortrack.test");
  console.info("Partial report state: student2@tutortrack.test");
}

let prisma: PrismaClient | undefined;

async function main() {
  const adapter = new PrismaPg({ connectionString: requiredDatabaseUrl() });
  prisma = new PrismaClient({ adapter });

  await seed(prisma);
}

main()
  .catch((error: unknown) => {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      console.error(error.message);
    } else {
      console.error("Database seed failed. Check DATABASE_URL and migration state.");
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma?.$disconnect();
  });
