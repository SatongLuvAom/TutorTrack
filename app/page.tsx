import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/courses/course-card";
import { TutorCard } from "@/components/tutors/tutor-card";
import { StatusBadge } from "@/components/marketplace/status-badge";
import { getFeaturedCourses, getPopularSubjects } from "@/services/course.service";
import { getFeaturedTutors } from "@/services/tutor.service";

export const dynamic = "force-dynamic";

const howItWorks = [
  {
    icon: Search,
    title: "เลือกวิชาและเป้าหมาย",
    description:
      "เริ่มจากวิชาที่อยากพัฒนา ระดับชั้น และรูปแบบเรียนที่เข้ากับตารางหลังเลิกเรียน",
  },
  {
    icon: Star,
    title: "เทียบครูและคอร์ส",
    description:
      "ดูโปรไฟล์ครู รีวิว ราคา แนวการสอน และคอร์สที่เปิดเผยแพร่จากครูที่ผ่านการอนุมัติ",
  },
  {
    icon: BarChart3,
    title: "พร้อมติดตามผล",
    description:
      "โครงสร้างข้อมูลรองรับคะแนน การบ้าน attendance และรายงานความก้าวหน้าในเฟสถัดไป",
  },
];

const valueProps = [
  {
    icon: ShieldCheck,
    title: "ครูที่ผ่านการตรวจสอบ",
    description: "แสดงเฉพาะติวเตอร์ที่ได้รับอนุมัติแล้วใน marketplace",
  },
  {
    icon: BookOpen,
    title: "คอร์สชัดเจนก่อนสมัคร",
    description: "เห็นวิชา ระดับ จำนวนครั้ง ราคา และจำนวนที่นั่งตั้งแต่หน้าแรก",
  },
  {
    icon: GraduationCap,
    title: "ออกแบบเพื่อเด็กมัธยม",
    description: "ค้นหาง่าย อ่านง่าย และเหมาะกับการวางแผนเรียนระยะยาว",
  },
];

export default async function Home() {
  const [subjects, tutors, courses] = await Promise.all([
    getPopularSubjects(),
    getFeaturedTutors(3),
    getFeaturedCourses(3),
  ]);

  return (
    <main className="tt-page">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="นักเรียนมัธยมกำลังเรียนกับติวเตอร์"
            className="h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1800&q=80"
          />
          <div className="absolute inset-0 bg-slate-950/62" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div>

        <header className="tt-shell flex items-center justify-between py-5 text-white">
          <Link className="flex items-center gap-2 font-semibold" href="/">
            <span className="flex size-9 items-center justify-center rounded-lg bg-white text-primary">
              TT
            </span>
            TutorTrack
          </Link>
          <nav className="hidden items-center gap-2 text-sm font-medium md:flex">
            <Link className="rounded-lg px-3 py-2 text-white/85 transition hover:bg-white/10 hover:text-white" href="/tutors">
              ติวเตอร์
            </Link>
            <Link className="rounded-lg px-3 py-2 text-white/85 transition hover:bg-white/10 hover:text-white" href="/courses">
              คอร์สเรียน
            </Link>
            <Link className="rounded-lg px-3 py-2 text-white/85 transition hover:bg-white/10 hover:text-white" href="/auth/login">
              เข้าสู่ระบบ
            </Link>
          </nav>
        </header>

        <div className="tt-shell grid min-h-[76vh] items-center gap-10 py-12 text-white lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="max-w-3xl">
            <StatusBadge className="border-white/25 bg-white/12 text-white" tone="neutral">
              Marketplace สำหรับการเรียนมัธยม
            </StatusBadge>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.18] tracking-normal sm:text-5xl lg:text-6xl">
              หาครูที่ใช่ วางแผนเรียนง่าย เห็นความก้าวหน้าได้จริง
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/88 sm:text-lg">
              TutorTrack ช่วยให้นักเรียนและผู้ปกครองค้นหาติวเตอร์ ดูคอร์สที่เหมาะกับเป้าหมาย และเตรียมข้อมูลสำหรับติดตามผลการเรียนอย่างเป็นระบบ
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/tutors">
                  Find a tutor
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/courses">Browse courses</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link className="border-white/30 bg-white/10 text-white hover:bg-white/20" href="/auth/register">
                  Become a tutor
                </Link>
              </Button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="grid gap-4 rounded-lg border border-white/20 bg-white/12 p-5 shadow-lg backdrop-blur-md">
              <div className="rounded-lg bg-white p-5 text-foreground shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-primary">Learning snapshot</p>
                    <p className="mt-1 text-2xl font-semibold">Math M.4 Bootcamp</p>
                  </div>
                  <StatusBadge tone="success">Published</StatusBadge>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
                  <div className="rounded-lg bg-sky-50 p-3 text-sky-800">
                    <p className="text-xl font-semibold">10</p>
                    <p>sessions</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-3 text-emerald-800">
                    <p className="text-xl font-semibold">4.8</p>
                    <p>rating</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3 text-amber-800">
                    <p className="text-xl font-semibold">1:1</p>
                    <p>private</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {valueProps.slice(0, 2).map((item) => {
                  const Icon = item.icon;
                  return (
                    <div className="rounded-lg bg-white/92 p-4 text-foreground shadow-sm" key={item.title}>
                      <Icon aria-hidden="true" className="size-5 text-primary" />
                      <p className="mt-3 text-sm font-semibold">{item.title}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="tt-shell py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {valueProps.map((item) => {
            const Icon = item.icon;
            return (
              <div className="tt-card p-5" key={item.title}>
                <div className="flex size-11 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Icon aria-hidden="true" className="size-5" />
                </div>
                <h2 className="tt-heading mt-4 text-lg">{item.title}</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="tt-shell py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="tt-kicker">Popular subjects</p>
            <h2 className="tt-heading mt-2 text-3xl">เริ่มจากวิชาที่อยากเก่งขึ้น</h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/courses">ดูคอร์สทั้งหมด</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject, index) => (
            <Link
              className="tt-card tt-card-hover group p-5"
              href={`/courses?subject=${subject.slug}`}
              key={subject.slug}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex size-11 items-center justify-center rounded-lg bg-secondary text-lg font-semibold text-primary">
                  {index + 1}
                </div>
                <span className="text-sm font-semibold text-primary">
                  {subject.courseCount ?? 0} courses
                </span>
              </div>
              <p className="mt-5 text-lg font-semibold">{subject.name}</p>
              <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">
                {subject.description ?? "วิชาสำหรับการวางแผนเรียนกับ TutorTrack"}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-card/55 py-14">
        <div className="tt-shell">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="tt-kicker">Featured tutors</p>
              <h2 className="tt-heading mt-2 text-3xl">ติวเตอร์ที่พร้อมช่วยให้เรียนเป็นระบบ</h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/tutors">Find a tutor</Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {tutors.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} />
            ))}
          </div>
        </div>
      </section>

      <section className="tt-shell py-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="tt-kicker">Featured courses</p>
            <h2 className="tt-heading mt-2 text-3xl">คอร์สที่เปิดให้ดูรายละเอียดแล้ว</h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/courses">Browse courses</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard course={course} key={course.id} />
          ))}
        </div>
      </section>

      <section className="tt-shell pb-16">
        <div className="tt-hero-band rounded-lg border border-border p-6 sm:p-8">
          <div className="max-w-2xl">
            <StatusBadge tone="accent">How it works</StatusBadge>
            <h2 className="tt-heading mt-4 text-3xl">
              จากการเลือกครูสู่การติดตามความก้าวหน้า
            </h2>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {howItWorks.map((step, index) => {
              const Icon = step.icon;
              return (
                <div className="rounded-lg border border-white/70 bg-white/85 p-5 shadow-sm" key={step.title}>
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Icon aria-hidden="true" className="size-5" />
                    </div>
                    <span className="text-sm font-semibold text-primary">Step {index + 1}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/tutors">
                เริ่มค้นหาครู
                <CheckCircle2 aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/auth/register">
                สมัครเป็นติวเตอร์
                <Sparkles aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
