"use client";

import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <div className="w-full max-w-md rounded-md border border-border bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Error</p>
        <h1 className="mt-2 text-2xl font-semibold">Something went wrong.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Retry the request. If it keeps failing, check the server logs without
          exposing private student data.
        </p>
        <Button className="mt-6" type="button" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
