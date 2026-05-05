import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpenCheck, LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/current-user";
import { getDashboardPathForRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  invalid: "Email or password is incorrect.",
  suspended: "This account is suspended.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect(getDashboardPathForRole(currentUser.role));
  }

  const params = searchParams ? await searchParams : {};
  const errorMessage = params.error ? errorMessages[params.error] : undefined;

  return (
    <main className="tt-page grid min-h-screen place-items-center px-6 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-border bg-card shadow-md lg:grid-cols-[1fr_420px]">
        <div className="tt-hero-band hidden p-8 lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link className="flex items-center gap-2 font-semibold text-foreground" href="/">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                TT
              </span>
              TutorTrack
            </Link>
            <h1 className="tt-heading mt-10 text-4xl leading-[1.2]">
              กลับมาเรียนต่อจากจุดที่วางแผนไว้
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
              เข้าสู่ระบบเพื่อไปยัง dashboard ตามบทบาทของคุณ ทั้งนักเรียน ผู้ปกครอง ติวเตอร์ และแอดมิน
            </p>
          </div>
          <div className="grid gap-3">
            <div className="flex items-center gap-3 rounded-lg bg-white/80 p-4">
              <BookOpenCheck aria-hidden="true" className="size-5 text-primary" />
              <p className="text-sm font-semibold">คอร์สและความก้าวหน้าพร้อมต่อยอดใน dashboard</p>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-white/80 p-4">
              <ShieldCheck aria-hidden="true" className="size-5 text-emerald-600" />
              <p className="text-sm font-semibold">ข้อมูลนักเรียนถูกแยกสิทธิ์ตามบทบาท</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <p className="tt-kicker">TutorTrack</p>
          <h2 className="tt-heading mt-2 text-3xl">Sign in</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            ใช้อีเมล demo หรือบัญชีที่สมัครไว้เพื่อเข้าสู่ระบบ
          </p>

          {errorMessage ? (
            <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <form action="/api/auth/login" className="mt-6 space-y-4" method="post">
            <div className="space-y-2">
              <label className="tt-label" htmlFor="email">
                Email
              </label>
              <input
                autoComplete="email"
                className="tt-input"
                id="email"
                name="email"
                required
                type="email"
              />
            </div>

            <div className="space-y-2">
              <label className="tt-label" htmlFor="password">
                Password
              </label>
              <input
                autoComplete="current-password"
                className="tt-input"
                id="password"
                name="password"
                required
                type="password"
              />
            </div>

            <Button className="w-full" type="submit">
              <LogIn aria-hidden="true" />
              Sign in
            </Button>
          </form>

          <p className="mt-5 text-sm text-muted-foreground">
            New to TutorTrack?{" "}
            <Link className="font-semibold text-primary underline underline-offset-4" href="/auth/register">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
