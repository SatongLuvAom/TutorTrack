import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <section className="w-full max-w-md rounded-md border border-border bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">403</p>
        <h1 className="mt-2 text-2xl font-semibold">Access denied.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This TutorTrack account cannot access the requested resource.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </section>
    </main>
  );
}
