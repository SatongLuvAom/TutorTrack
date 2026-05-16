import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/current-user";
import { getDashboardPathForRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

type RegisterPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  invalid: "Check the registration details and try again.",
  exists: "An account already exists for this email.",
  failed: "Registration could not be completed.",
  rate_limited: "Too many attempts. Please wait and try again.",
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect(getDashboardPathForRole(currentUser.role));
  }

  const params = searchParams ? await searchParams : {};
  const errorMessage = params.error ? errorMessages[params.error] : undefined;

  return (
    <main className="tt-page grid min-h-screen place-items-center px-6 py-10">
      <section className="w-full max-w-lg rounded-lg border border-border bg-card p-6 text-card-foreground shadow-md sm:p-8">
        <Link className="flex items-center gap-2 font-semibold text-foreground" href="/">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            TT
          </span>
          TutorTrack
        </Link>
        <h1 className="tt-heading mt-8 text-3xl">Create account</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          สมัครบัญชีพื้นฐานก่อน แล้วระบบจะพาไปยัง dashboard ตามบทบาทที่เลือก
        </p>

        {errorMessage ? (
          <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <form
          action="/api/auth/register"
          className="mt-6 space-y-4"
          method="post"
        >
          <div className="space-y-2">
            <label className="tt-label" htmlFor="name">
              Name
            </label>
            <input
              autoComplete="name"
              className="tt-input"
              id="name"
              name="name"
              required
              type="text"
            />
          </div>

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
              autoComplete="new-password"
              className="tt-input"
              id="password"
              minLength={8}
              name="password"
              required
              type="password"
            />
          </div>

          <div className="space-y-2">
            <label className="tt-label" htmlFor="role">
              Role
            </label>
            <select
              className="tt-input"
              defaultValue="STUDENT"
              id="role"
              name="role"
              required
            >
              <option value="STUDENT">Student</option>
              <option value="PARENT">Parent</option>
              <option value="TUTOR">Tutor</option>
            </select>
          </div>

          <div className="rounded-lg bg-secondary/65 p-3 text-sm leading-7 text-muted-foreground">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <ShieldCheck aria-hidden="true" className="size-4 text-emerald-600" />
              Server-side permission checks
            </div>
            ข้อมูลนักเรียนและผู้ปกครองจะแยกสิทธิ์ตามบทบาทหลังเข้าสู่ระบบ
          </div>

          <Button className="w-full" type="submit">
            <UserPlus aria-hidden="true" />
            Create account
          </Button>
        </form>

        <p className="mt-5 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="font-semibold text-primary underline underline-offset-4" href="/auth/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
