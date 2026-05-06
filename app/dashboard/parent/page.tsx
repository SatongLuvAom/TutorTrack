import Link from "next/link";
import { LogOut, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireParent } from "@/lib/guards";
import { getActiveParentChildren } from "@/services/enrollment.service";

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage() {
  const user = await requireParent();
  const children = await getActiveParentChildren(user.id);

  return (
    <main className="tt-page">
      <section className="tt-shell flex min-h-screen flex-col justify-center gap-6 py-12">
        <div className="tt-hero-band rounded-lg border border-border p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="tt-kicker">TutorTrack dashboard</p>
              <h1 className="tt-heading mt-2 text-3xl">Parent Dashboard</h1>
              <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
                ดูข้อมูลลูกที่เชื่อมด้วย ParentStudentLink ที่ active และจัดการ enrollment เบื้องต้น
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
            <p className="text-sm font-medium text-muted-foreground">User</p>
            <p className="mt-2 text-lg font-semibold">{user.name}</p>
            <p className="mt-1 break-all text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
          <div className="tt-card p-5">
            <p className="text-sm font-medium text-muted-foreground">Role</p>
            <p className="mt-2 text-lg font-semibold text-primary">{user.role}</p>
          </div>
          <div className="tt-card p-5">
            <p className="text-sm font-medium text-muted-foreground">
              Active children
            </p>
            <p className="mt-2 text-3xl font-semibold">{children.length}</p>
          </div>
        </div>

        <section className="tt-card p-5">
          <div className="flex items-center gap-2">
            <UsersRound aria-hidden="true" className="size-5 text-primary" />
            <h2 className="tt-heading text-xl">Children</h2>
          </div>
          {children.length === 0 ? (
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              ยังไม่มี ParentStudentLink ที่ active สำหรับบัญชีนี้
            </p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {children.map((child) => (
                <article
                  className="rounded-lg border border-border bg-card p-4"
                  key={child.studentId}
                >
                  <p className="font-semibold">{child.name}</p>
                  <p className="mt-1 break-all text-sm text-muted-foreground">
                    {child.email}
                  </p>
                  {child.gradeLevel ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {child.gradeLevel}
                    </p>
                  ) : null}
                  <Button asChild className="mt-4" variant="outline">
                    <Link
                      href={`/dashboard/parent/children/${child.studentId}/enrollments`}
                    >
                      Open enrollments
                    </Link>
                  </Button>
                  <Button asChild className="mt-4 sm:ml-2" variant="outline">
                    <Link
                      href={`/dashboard/parent/children/${child.studentId}/schedule`}
                    >
                      Schedule
                    </Link>
                  </Button>
                  <Button asChild className="mt-4 sm:ml-2" variant="outline">
                    <Link
                      href={`/dashboard/parent/children/${child.studentId}/attendance`}
                    >
                      Attendance
                    </Link>
                  </Button>
                  <Button asChild className="mt-4 sm:ml-2" variant="outline">
                    <Link
                      href={`/dashboard/parent/children/${child.studentId}/assignments`}
                    >
                      Assignments
                    </Link>
                  </Button>
                  <Button asChild className="mt-4 sm:ml-2" variant="outline">
                    <Link
                      href={`/dashboard/parent/children/${child.studentId}/assessments`}
                    >
                      Assessments
                    </Link>
                  </Button>
                  <Button asChild className="mt-4 sm:ml-2" variant="outline">
                    <Link
                      href={`/dashboard/parent/children/${child.studentId}/skills`}
                    >
                      Skills
                    </Link>
                  </Button>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
