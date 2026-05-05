"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TutorCoursesError() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="max-w-md rounded-md border border-border bg-card p-6 text-card-foreground shadow-sm">
        <h1 className="text-2xl font-semibold">Unable to load courses</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The tutor course management page could not be loaded.
        </p>
        <Button asChild className="mt-5">
          <Link href="/dashboard/tutor">Back to dashboard</Link>
        </Button>
      </section>
    </main>
  );
}
