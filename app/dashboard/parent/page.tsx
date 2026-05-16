import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardList,
  LogOut,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/visual/stat-card";
import { requireParent } from "@/lib/guards";
import { getActiveParentChildren } from "@/services/enrollment.service";

export const dynamic = "force-dynamic";

const childActions = [
  { label: "สมัครเรียน", icon: BookOpen, suffix: "enrollments" },
  { label: "ตารางเรียน", icon: CalendarDays, suffix: "schedule" },
  { label: "การบ้าน", icon: ClipboardList, suffix: "assignments" },
  { label: "ความก้าวหน้า", icon: BarChart3, suffix: "progress" },
  { label: "ชำระเงิน", icon: WalletCards, suffix: "payments" },
];

export default async function ParentDashboardPage() {
  const user = await requireParent();
  const children = await getActiveParentChildren(user.id);

  return (
    <main className="tt-page">
      <section className="tt-shell flex min-h-screen flex-col gap-6 py-12">
        <div className="tt-hero-band rounded-lg border border-border p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="tt-kicker">TutorTrack dashboard</p>
              <h1 className="tt-heading mt-2 text-3xl">Parent Dashboard</h1>
              <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
                ดูภาพรวมลูกที่เชื่อมด้วย ParentStudentLink ที่ยัง active พร้อมติดตามการเรียนแบบอ่านง่าย
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
          <StatCard
            helper={user.email}
            icon={UserRound}
            label="ผู้ปกครอง"
            tone="sky"
            value={user.name}
          />
          <StatCard
            helper="เข้าถึงได้เฉพาะลิงก์ที่ active"
            icon={UsersRound}
            label="เด็กที่ดูแล"
            tone="emerald"
            value={children.length}
          />
          <StatCard
            helper="ติดตามงาน เข้าเรียน คะแนน และ progress"
            icon={BarChart3}
            label="มุมมอง"
            tone="amber"
            value="Read-only"
          />
        </div>

        <section className="tt-card p-5">
          <div className="flex items-center gap-2">
            <UsersRound aria-hidden="true" className="size-5 text-primary" />
            <h2 className="tt-heading text-xl">Children</h2>
          </div>
          {children.length === 0 ? (
            <p className="mt-4 rounded-lg bg-muted px-4 py-3 text-sm leading-7 text-muted-foreground">
              ยังไม่มี ParentStudentLink ที่ active สำหรับบัญชีนี้
            </p>
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {children.map((child) => (
                <article
                  className="rounded-lg border border-border bg-card p-5"
                  key={child.studentId}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-12 items-center justify-center rounded-lg bg-secondary text-primary">
                      <UserRound aria-hidden="true" className="size-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold">{child.name}</p>
                      <p className="mt-1 break-all text-sm text-muted-foreground">
                        {child.email}
                      </p>
                      {child.gradeLevel ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {child.gradeLevel}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    {childActions.map((action) => {
                      const Icon = action.icon;

                      return (
                        <Button
                          asChild
                          key={action.suffix}
                          size="sm"
                          variant="outline"
                        >
                          <Link
                            href={`/dashboard/parent/children/${child.studentId}/${action.suffix}`}
                          >
                            <Icon aria-hidden="true" />
                            {action.label}
                          </Link>
                        </Button>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
