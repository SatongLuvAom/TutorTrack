type StrengthsWeaknessesCardProps = {
  strengths: string[];
  weaknesses: string[];
};

export function StrengthsWeaknessesCard({
  strengths,
  weaknesses,
}: StrengthsWeaknessesCardProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <article className="tt-card p-5">
        <p className="tt-kicker">Strengths</p>
        <h2 className="tt-heading mt-1 text-xl">What is going well</h2>
        <ul className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
          {strengths.map((item) => (
            <li key={item} className="rounded-lg bg-emerald-50 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </article>
      <article className="tt-card p-5">
        <p className="tt-kicker">Weaknesses</p>
        <h2 className="tt-heading mt-1 text-xl">Needs attention</h2>
        <ul className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
          {weaknesses.map((item) => (
            <li key={item} className="rounded-lg bg-amber-50 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
