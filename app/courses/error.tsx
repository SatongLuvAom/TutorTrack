"use client";

import { Button } from "@/components/ui/button";

type CoursesErrorProps = {
  reset: () => void;
};

export default function CoursesError({ reset }: CoursesErrorProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <section className="w-full max-w-md rounded-md border border-border bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Course marketplace</p>
        <h1 className="mt-2 text-2xl font-semibold">Unable to load courses.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Retry the marketplace request. Draft and archived course data remains hidden.
        </p>
        <Button className="mt-6" onClick={reset} type="button">
          Try again
        </Button>
      </section>
    </main>
  );
}
