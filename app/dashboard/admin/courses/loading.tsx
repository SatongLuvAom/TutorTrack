export default function AdminCoursesLoading() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border bg-zinc-50">
        <div className="mx-auto max-w-6xl px-6 py-8 sm:px-10 lg:px-12">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="mt-4 h-9 w-72 max-w-full rounded bg-muted" />
          <div className="mt-3 h-4 w-full max-w-xl rounded bg-muted" />
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-8 sm:px-10 lg:px-12">
        <div className="h-36 rounded-md border border-border bg-card" />
        <div className="mt-6 h-80 rounded-md border border-border bg-card" />
      </section>
    </main>
  );
}
