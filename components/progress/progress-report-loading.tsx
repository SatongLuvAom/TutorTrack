export function ProgressReportLoading() {
  return (
    <section className="tt-card animate-pulse p-5">
      <div className="h-5 w-40 rounded bg-muted" />
      <div className="mt-5 h-20 rounded bg-muted" />
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="h-24 rounded bg-muted" />
        <div className="h-24 rounded bg-muted" />
        <div className="h-24 rounded bg-muted" />
      </div>
    </section>
  );
}
