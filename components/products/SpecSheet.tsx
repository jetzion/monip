type Row = { label: string; value: string };

/** Specifications card with a tinted header strip; empty rows are skipped. */
export function SpecSheet({ rows }: { rows: Row[] }) {
  const visible = rows.filter((row) => row.value.trim() !== "");
  if (visible.length === 0) return null;
  return (
    <section aria-labelledby="specs-heading" className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <h2 id="specs-heading" className="border-b border-border bg-accent px-5 py-3 font-display text-lg font-semibold text-navy">
        Specifications
      </h2>
      <dl className="divide-y divide-border px-5">
        {visible.map((row) => (
          <div key={row.label} className="grid gap-1 py-3.5 sm:grid-cols-[11rem_1fr] sm:gap-6">
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="text-sm font-medium text-navy">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
