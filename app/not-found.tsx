export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <div className="w-full max-w-md rounded-md border border-border bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-2 text-2xl font-semibold">Page not found.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The requested TutorTrack page does not exist yet.
        </p>
      </div>
    </main>
  );
}
