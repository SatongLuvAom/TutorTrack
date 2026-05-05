import Link from "next/link";
import { BookOpen, LockKeyhole, LogOut, UserCircle } from "lucide-react";
import type { CurrentUser } from "@/lib/current-user";
import { UserRole } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";

type DashboardShellProps = {
  title: string;
  user: CurrentUser;
};

export function DashboardShell({ title, user }: DashboardShellProps) {
  return (
    <main className="tt-page">
      <section className="tt-shell flex min-h-screen flex-col justify-center gap-6 py-12">
        <div className="tt-hero-band rounded-lg border border-border p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="tt-kicker">TutorTrack dashboard</p>
              <h1 className="tt-heading mt-2 text-3xl">{title}</h1>
              <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
                พื้นที่ส่วนตัวสำหรับดูข้อมูลตามบทบาท โดยยังบังคับสิทธิ์เข้าถึงจากฝั่ง server
              </p>
            </div>
            <form action="/api/auth/logout" method="post">
              <Button type="submit" variant="outline">
                <LogOut aria-hidden="true" />
                Sign out
              </Button>
            </form>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="tt-card p-5">
            <UserCircle aria-hidden="true" className="size-5 text-primary" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">User</p>
            <p className="mt-2 text-lg font-semibold">{user.name}</p>
            <p className="mt-1 break-all text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>

          <div className="tt-card p-5">
            <LockKeyhole aria-hidden="true" className="size-5 text-primary" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">Role</p>
            <p className="mt-2 text-lg font-semibold text-primary">{user.role}</p>
          </div>

          <div className="tt-card p-5">
            <LockKeyhole aria-hidden="true" className="size-5 text-emerald-600" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">Access</p>
            <p className="mt-2 text-lg font-semibold text-emerald-700">Protected</p>
          </div>
        </div>

        {user.role === UserRole.TUTOR || user.role === UserRole.ADMIN ? (
          <div className="tt-card p-5">
            <BookOpen aria-hidden="true" className="size-5 text-primary" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              Course management
            </p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {user.role === UserRole.TUTOR
                ? "Create drafts and manage your own published courses."
                : "Review and manage all tutor courses."}
            </p>
            <Button asChild className="mt-4" variant="outline">
              <Link
                href={
                  user.role === UserRole.TUTOR
                    ? "/dashboard/tutor/courses"
                    : "/dashboard/admin/courses"
                }
              >
                Open courses
              </Link>
            </Button>
            <Button asChild className="mt-4 sm:ml-2" variant="outline">
              <Link
                href={
                  user.role === UserRole.TUTOR
                    ? "/dashboard/tutor/enrollments"
                    : "/dashboard/admin/enrollments"
                }
              >
                Open enrollments
              </Link>
            </Button>
          </div>
        ) : null}

        {user.role === UserRole.STUDENT ? (
          <div className="tt-card p-5">
            <BookOpen aria-hidden="true" className="size-5 text-primary" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              Learning
            </p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Track your course enrollment requests and active classes.
            </p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/dashboard/student/enrollments">Open enrollments</Link>
            </Button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
