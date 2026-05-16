import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ClipboardList,
  FileText,
  LockKeyhole,
  LogOut,
  UserCircle,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CurrentUser } from "@/lib/current-user";
import { UserRole } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { StatCard } from "@/components/visual/stat-card";

type DashboardShellProps = {
  title: string;
  user: CurrentUser;
};

type DashboardLink = {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  cta: string;
};

function getDashboardLinks(role: CurrentUser["role"]): DashboardLink[] {
  if (role === UserRole.STUDENT) {
    return [
      {
        icon: BookOpen,
        title: "คอร์สของฉัน",
        description: "ดูสถานะสมัครเรียน คอร์สที่กำลังเรียน และช่องทางชำระเงิน",
        href: "/dashboard/student/enrollments",
        cta: "เปิดรายการเรียน",
      },
      {
        icon: CalendarDays,
        title: "ตารางเรียนและเข้าเรียน",
        description: "เช็กคาบเรียนถัดไปและประวัติการเข้าเรียนของตัวเอง",
        href: "/dashboard/student/schedule",
        cta: "ดูตารางเรียน",
      },
      {
        icon: ClipboardList,
        title: "การบ้าน",
        description: "ส่งงาน ดูคะแนน และติดตามงานที่ยังต้องทำ",
        href: "/dashboard/student/assignments",
        cta: "เปิดการบ้าน",
      },
      {
        icon: ChartNoAxesColumnIncreasing,
        title: "ผลเรียนและความก้าวหน้า",
        description: "ดูคะแนน แบบทดสอบ ทักษะ และรายงานความก้าวหน้า",
        href: "/dashboard/student/progress",
        cta: "ดูรายงาน",
      },
      {
        icon: WalletCards,
        title: "การชำระเงิน",
        description: "ตรวจสอบประวัติชำระเงินและสร้าง PromptPay QR",
        href: "/dashboard/student/payments",
        cta: "ดูการชำระเงิน",
      },
    ];
  }

  if (role === UserRole.TUTOR) {
    return [
      {
        icon: BookOpen,
        title: "จัดการคอร์ส",
        description: "สร้าง แก้ไข เผยแพร่ และเก็บคอร์สของตัวเอง",
        href: "/dashboard/tutor/courses",
        cta: "เปิดคอร์ส",
      },
      {
        icon: CalendarDays,
        title: "คาบเรียน",
        description: "วางตารางสอนและจัดการสถานะคาบเรียน",
        href: "/dashboard/tutor/sessions",
        cta: "เปิดคาบเรียน",
      },
      {
        icon: ClipboardList,
        title: "การบ้านและการให้คะแนน",
        description: "สร้างงาน ตรวจงาน และให้ feedback นักเรียน",
        href: "/dashboard/tutor/assignments",
        cta: "เปิดการบ้าน",
      },
      {
        icon: ChartNoAxesColumnIncreasing,
        title: "แบบทดสอบและทักษะ",
        description: "บันทึกคะแนนและติดตาม skill progress ของนักเรียน",
        href: "/dashboard/tutor/assessments",
        cta: "เปิดแบบทดสอบ",
      },
      {
        icon: WalletCards,
        title: "สถานะชำระเงิน",
        description: "ดูสถานะการจ่ายเงินแบบจำกัดสำหรับคอร์สของตัวเอง",
        href: "/dashboard/tutor/payments",
        cta: "ดูสถานะ",
      },
    ];
  }

  return [
    {
      icon: BookOpen,
      title: "คอร์สทั้งหมด",
      description: "ดูและจัดการคอร์สของทุกติวเตอร์",
      href: "/dashboard/admin/courses",
      cta: "เปิดคอร์ส",
    },
    {
      icon: CalendarDays,
      title: "Enrollment และคาบเรียน",
      description: "ดู enrollment, session และ attendance ระดับระบบ",
      href: "/dashboard/admin/enrollments",
      cta: "เปิด enrollment",
    },
    {
      icon: FileText,
      title: "งานและผลสอบ",
      description: "ตรวจภาพรวม assignments, submissions และ assessments",
      href: "/dashboard/admin/assignments",
      cta: "เปิดงาน",
    },
    {
      icon: ChartNoAxesColumnIncreasing,
      title: "รายงานความก้าวหน้า",
      description: "เปิดภาพรวม progress reports และ skill progress",
      href: "/dashboard/admin/progress",
      cta: "เปิดรายงาน",
    },
    {
      icon: WalletCards,
      title: "การชำระเงิน",
      description: "ตรวจสอบ manual payment และ gateway payment",
      href: "/dashboard/admin/payments",
      cta: "เปิด payments",
    },
  ];
}

export function DashboardShell({ title, user }: DashboardShellProps) {
  const links = getDashboardLinks(user.role);

  return (
    <main className="tt-page">
      <section className="tt-shell flex min-h-screen flex-col gap-6 py-12">
        <div className="tt-hero-band rounded-lg border border-border p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="tt-kicker">TutorTrack dashboard</p>
              <h1 className="tt-heading mt-2 text-3xl">{title}</h1>
              <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
                พื้นที่ส่วนตัวที่ตรวจสิทธิ์ฝั่ง server ก่อนโหลดข้อมูลทุกหน้า
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
            icon={UserCircle}
            label="บัญชี"
            value={user.name}
            helper={user.email}
            tone="sky"
          />
          <StatCard
            icon={LockKeyhole}
            label="บทบาท"
            value={user.role}
            helper="Route guards enforce this role."
            tone="emerald"
          />
          <StatCard
            icon={LockKeyhole}
            label="สถานะการเข้าถึง"
            value="Protected"
            helper="ข้อมูลนักเรียนไม่โหลดก่อนผ่าน permission check."
            tone="amber"
          />
        </div>

        <section>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="tt-kicker">Quick actions</p>
              <h2 className="tt-heading mt-1 text-2xl">เลือกงานที่ต้องทำต่อ</h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/">กลับหน้า Marketplace</Link>
            </Button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {links.map((item) => (
              <SummaryCard key={item.href} {...item} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
