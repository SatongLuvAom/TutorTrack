export default function TutorsLoading() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground sm:px-10 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="h-8 w-56 rounded-md bg-muted" />
        <div className="mt-4 h-4 w-full max-w-xl rounded-md bg-muted" />
        <div className="mt-8 h-40 rounded-md bg-muted" />
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div className="h-72 rounded-md bg-muted" key={item} />
          ))}
        </div>
      </div>
    </main>
  );
}
