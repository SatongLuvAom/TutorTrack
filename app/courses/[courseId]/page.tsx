import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Clock,
  GraduationCap,
  Star,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnrollmentCta } from "@/components/enrollments/enroll-button";
import { StatusBadge } from "@/components/marketplace/status-badge";
import {
  COURSE_PLACEHOLDER_IMAGE,
  getLocalImageOrFallback,
  TUTOR_PLACEHOLDER_IMAGE,
} from "@/components/visual/image-utils";
import { getCurrentUser } from "@/lib/current-user";
import { UserRole } from "@/lib/generated/prisma/enums";
import { formatPrice, formatRating } from "@/services/marketplace-utils";
import { getPublicCourseDetail } from "@/services/course.service";
import {
  getParentEnrollmentOptions,
  getStudentCourseEnrollmentStatus,
} from "@/services/enrollment.service";
import {
  createParentEnrollmentAction,
  createStudentEnrollmentAction,
} from "@/app/courses/[courseId]/actions";

export const dynamic = "force-dynamic";

type CourseDetailPageProps = {
  params: Promise<{
    courseId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: Date | null) {
  if (!value) {
    return "ยังไม่ระบุ";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function CourseDetailPage({
  params,
  searchParams,
}: CourseDetailPageProps) {
  const { courseId } = await params;
  const [course, user] = await Promise.all([
    getPublicCourseDetail(courseId),
    getCurrentUser(),
  ]);
  const query = searchParams ? await searchParams : {};

  if (!course) {
    notFound();
  }

  const [studentEnrollment, parentChildren] = await Promise.all([
    user?.role === UserRole.STUDENT
      ? getStudentCourseEnrollmentStatus(user.id, course.id)
      : Promise.resolve(null),
    user?.role === UserRole.PARENT
      ? getParentEnrollmentOptions(user.id, course.id)
      : Promise.resolve([]),
  ]);

  const errorMessage = firstValue(query.error);
  const enrolledMessage = firstValue(query.enrolled);
  const tutorImageSrc = getLocalImageOrFallback(
    course.tutor.imageUrl,
    TUTOR_PLACEHOLDER_IMAGE,
  );

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-gradient-to-br from-emerald-50 via-white to-sky-50">
        <div className="tt-shell grid gap-8 py-12 lg:grid-cols-[1fr_340px]">
          <div>
            <Image
              alt={`ภาพประกอบคอร์ส ${course.title}`}
              className="mb-6 aspect-[16/7] w-full rounded-lg border border-white object-cover shadow-sm"
              height={520}
              priority
              src={COURSE_PLACEHOLDER_IMAGE}
              width={800}
            />
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="success">Published</StatusBadge>
              <StatusBadge tone="accent">{course.subject.name}</StatusBadge>
              <StatusBadge tone="neutral">{course.levelLabel}</StatusBadge>
            </div>
            <h1 className="tt-heading mt-5 text-4xl leading-[1.2]">
              {course.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">
              {course.description ?? "คอร์สเรียน TutorTrack"}
            </p>
          </div>

          <aside className="tt-card p-5">
            <p className="text-sm text-muted-foreground">ราคา</p>
            <p className="mt-1 text-3xl font-semibold">
              {formatPrice(course.priceCents)}
            </p>
            <div className="mt-5 grid gap-3 text-sm">
              <InfoRow icon={Users} label={course.maxStudents ? `${course.maxStudents} seats` : "Flexible seats"} />
              <InfoRow icon={CalendarDays} label={`${course.totalSessions} sessions`} />
              <InfoRow
                icon={Clock}
                label={course.type === "PRIVATE" ? "Private course" : "Group course"}
              />
            </div>
            {errorMessage ? (
              <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}
            {enrolledMessage ? (
              <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                ส่งคำขอสมัครเรียนแล้ว สถานะเริ่มต้นคือรออนุมัติ
              </div>
            ) : null}
            <EnrollmentCta
              courseId={course.id}
              createParentAction={createParentEnrollmentAction}
              createStudentAction={createStudentEnrollmentAction}
              parentChildren={parentChildren}
              returnTo={`/courses/${course.id}`}
              studentEnrollment={studentEnrollment}
              user={user}
            />
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              ระบบสมัครเรียนเริ่มจากสถานะรออนุมัติ และสามารถชำระเงินผ่าน flow ที่เปิดใน dashboard
            </p>
          </aside>
        </div>
      </section>

      <section className="tt-shell grid gap-8 py-12 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <section>
            <h2 className="tt-heading text-2xl">Course overview</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoCard label="Subject" value={course.subject.name} />
              <InfoCard label="Course type" value={course.type} />
              <InfoCard label="Starts" value={formatDate(course.startsAt)} />
              <InfoCard label="Ends" value={formatDate(course.endsAt)} />
            </div>
          </section>

          <section>
            <h2 className="tt-heading text-2xl">Lesson preview</h2>
            {course.sessions.length === 0 ? (
              <p className="mt-3 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                ยังไม่มี session preview สำหรับคอร์สนี้
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {course.sessions.map((session) => (
                  <article className="tt-card p-4" key={session.id}>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-semibold">{session.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(session.startsAt)}
                      </p>
                    </div>
                    {session.description ? (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {session.description}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="tt-card p-5">
            <h2 className="text-lg font-semibold">Tutor</h2>
            <div className="mt-4 flex items-center gap-3">
              <Image
                alt={`รูปโปรไฟล์ของ ${course.tutor.name}`}
                className="size-12 rounded-lg object-cover"
                height={96}
                src={tutorImageSrc}
                width={96}
              />
              <div className="min-w-0">
                <p className="truncate font-medium">{course.tutor.name}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Star
                    aria-hidden="true"
                    className="size-4 fill-amber-400 text-amber-400"
                  />
                  {formatRating(course.tutor.rating)}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {course.tutor.headline ?? "TutorTrack approved tutor"}
            </p>
            <Button asChild className="mt-5 w-full" variant="outline">
              <Link href={`/tutors/${course.tutor.id}`}>
                ดูโปรไฟล์ติวเตอร์
              </Link>
            </Button>
          </section>

          <section className="tt-card p-5">
            <div className="flex items-center gap-2">
              <GraduationCap aria-hidden="true" className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Public visibility</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              หน้านี้แสดงเฉพาะคอร์ส PUBLISHED จากติวเตอร์ที่ APPROVED แล้วเท่านั้น
            </p>
          </section>
        </aside>
      </section>
    </main>
  );
}

function InfoRow({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <p className="flex items-center gap-2">
      <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
      {label}
    </p>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="tt-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
