"use client";

import { Button } from "@/components/ui/button";

type TutorsErrorProps = {
  reset: () => void;
};

export default function TutorsError({ reset }: TutorsErrorProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <section className="w-full max-w-md rounded-md border border-border bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Tutor marketplace</p>
        <h1 className="mt-2 text-2xl font-semibold">Unable to load tutors.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Retry the marketplace request. No private student records are exposed on this page.
        </p>
        <Button className="mt-6" onClick={reset} type="button">
          Try again
        </Button>
      </section>
    </main>
  );
}
