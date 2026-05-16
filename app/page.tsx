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
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/courses/course-card";
import { TutorCard } from "@/components/tutors/tutor-card";
import { StatusBadge } from "@/components/marketplace/status-badge";
import { HeroIllustration } from "@/components/visual/hero-illustration";
import { VisualStepCard } from "@/components/visual/visual-step-card";
import { getFeaturedCourses, getPopularSubjects } from "@/services/course.service";
import { getFeaturedTutors } from "@/services/tutor.service";

export const dynamic = "force-dynamic";

const howItWorks = [
  {
    icon: Search,
    title: "เลือกวิชาและเป้าหมาย",
    description: "เริ่มจากวิชาที่อยากพัฒนา ระดับชั้น และรูปแบบเรียนที่เข้ากับตารางหลังเลิกเรียน",
  },
  {
    icon: Star,
    title: "เทียบครูและคอร์ส",
    description: "ดูโปรไฟล์ครู รีวิว ราคา แนวการสอน และคอร์สที่ผ่านการเผยแพร่แล้ว",
  },
  {
    icon: BarChart3,
    title: "ติดตามผลเป็นระบบ",
    description: "เมื่อเริ่มเรียน ระบบรองรับ attendance, homework, scores, skills และ progress report",
  },
];

const valueProps = [
  {
    icon: ShieldCheck,
    title: "ครูที่ผ่านการตรวจสอบ",
    description: "Marketplace แสดงเฉพาะติวเตอร์ที่ได้รับอนุมัติแล้ว",
  },
  {
    icon: BookOpen,
    title: "คอร์สชัดเจนก่อนสมัคร",
    description: "เห็นวิชา ระดับ จำนวนครั้ง ราคา และรูปแบบเรียนตั้งแต่แรก",
  },
  {
    icon: UsersRound,
    title: "เหมาะกับเด็กมัธยม",
    description: "ออกแบบให้ค้นหาง่าย อ่านง่าย และช่วยวางแผนเรียนต่อเนื่อง",
  },
];

const subjectIcons = [GraduationCap, BookOpen, BarChart3, Sparkles, Star, Search];

export default async function Home() {
  const [subjects, tutors, courses] = await Promise.all([
    getPopularSubjects(),
    getFeaturedTutors(3),
    getFeaturedCourses(3),
  ]);

  return (
    <main className="tt-page">
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-sky-50 via-white to-emerald-50">
        <header className="tt-shell flex items-center justify-between py-5">
          <Link className="flex items-center gap-2 font-semibold" href="/">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              TT
            </span>
            TutorTrack
          </Link>
          <nav className="hidden items-center gap-2 text-sm font-medium md:flex">
            <Link className="rounded-lg px-3 py-2 text-muted-foreground transition hover:bg-white hover:text-foreground" href="/tutors">
              ติวเตอร์
            </Link>
            <Link className="rounded-lg px-3 py-2 text-muted-foreground transition hover:bg-white hover:text-foreground" href="/courses">
              คอร์สเรียน
            </Link>
            <Link className="rounded-lg px-3 py-2 text-muted-foreground transition hover:bg-white hover:text-foreground" href="/auth/login">
              เข้าสู่ระบบ
            </Link>
          </nav>
        </header>

        <div className="tt-shell grid min-h-[78vh] items-center gap-10 pb-14 pt-8 lg:grid-cols-[0.95fr_1.05fr] lg:pb-20">
          <div className="max-w-3xl">
            <StatusBadge tone="accent">Education marketplace for secondary students</StatusBadge>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.15] tracking-normal text-foreground sm:text-5xl lg:text-6xl">
              หา tutor ที่ใช่ และเห็นความก้าวหน้าการเรียนได้ชัดเจน
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              TutorTrack รวมการค้นหาครู คอร์สเรียน การสมัครเรียน และข้อมูลติดตามผลไว้ในระบบเดียวสำหรับนักเรียนและผู้ปกครอง
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
                <Link href="/auth/register">Become a tutor</Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {valueProps.map((item) => {
                const Icon = item.icon;

                return (
                  <div className="rounded-lg border border-border bg-white/75 p-4 shadow-sm" key={item.title}>
                    <Icon aria-hidden="true" className="size-5 text-primary" />
                    <p className="mt-3 text-sm font-semibold">{item.title}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <HeroIllustration />
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
          {subjects.map((subject, index) => {
            const Icon = subjectIcons[index % subjectIcons.length] ?? BookOpen;

            return (
              <Link
                className="tt-card tt-card-hover group p-5"
                href={`/courses?subject=${subject.slug}`}
                key={subject.slug}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-secondary text-primary">
                    <Icon aria-hidden="true" className="size-6" />
                  </div>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">
                    {subject.courseCount ?? 0} courses
                  </span>
                </div>
                <p className="mt-5 text-lg font-semibold">{subject.name}</p>
                <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">
                  {subject.description ?? "วิชาสำหรับวางแผนเรียนกับ TutorTrack"}
                </p>
              </Link>
            );
          })}
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
            {howItWorks.map((step, index) => (
              <VisualStepCard
                description={step.description}
                icon={step.icon}
                key={step.title}
                step={`Step ${index + 1}`}
                title={step.title}
              />
            ))}
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
