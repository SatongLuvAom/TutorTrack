import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnrollmentCta } from "@/components/enrollments/enroll-button";
import { StatusBadge } from "@/components/marketplace/status-badge";
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

  return (
    <main className="tt-page">
      <section className="border-b border-border bg-card/60">
        <div className="tt-shell grid gap-8 py-12 lg:grid-cols-[1fr_320px]">
          <div>
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
            <div className="mt-5 space-y-3 text-sm">
              <p className="flex items-center gap-2">
                <Users
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                {course.maxStudents
                  ? `${course.maxStudents} seats`
                  : "Flexible seats"}
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                {course.totalSessions} sessions
              </p>
              <p className="flex items-center gap-2">
                <Clock
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                {course.type === "PRIVATE" ? "Private course" : "Group course"}
              </p>
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
              Payment gateway ยังไม่เปิดใช้ใน Phase นี้ การสมัครเริ่มที่สถานะรออนุมัติ
            </p>
          </aside>
        </div>
      </section>

      <section className="tt-shell grid gap-8 py-12 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section>
            <h2 className="tt-heading text-2xl">Course overview</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="tt-card p-4">
                <p className="text-sm text-muted-foreground">Subject</p>
                <p className="mt-1 font-medium">{course.subject.name}</p>
              </div>
              <div className="tt-card p-4">
                <p className="text-sm text-muted-foreground">Course type</p>
                <p className="mt-1 font-medium">{course.type}</p>
              </div>
              <div className="tt-card p-4">
                <p className="text-sm text-muted-foreground">Starts</p>
                <p className="mt-1 font-medium">{formatDate(course.startsAt)}</p>
              </div>
              <div className="tt-card p-4">
                <p className="text-sm text-muted-foreground">Ends</p>
                <p className="mt-1 font-medium">{formatDate(course.endsAt)}</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="tt-heading text-2xl">Lesson preview</h2>
            {course.sessions.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
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
            <p className="mt-3 font-medium">{course.tutor.name}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {course.tutor.headline ?? "TutorTrack approved tutor"}
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Star
                aria-hidden="true"
                className="size-4 fill-amber-400 text-amber-400"
              />
              {formatRating(course.tutor.rating)}
            </div>
            <Button asChild className="mt-5 w-full" variant="outline">
              <Link href={`/tutors/${course.tutor.id}`}>
                ดูโปรไฟล์ติวเตอร์
              </Link>
            </Button>
          </section>

          <section className="tt-card p-5">
            <h2 className="text-lg font-semibold">Published status</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              This page only renders courses with `PUBLISHED` status from
              approved tutors.
            </p>
          </section>
        </aside>
      </section>
    </main>
  );
}
