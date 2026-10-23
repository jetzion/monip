type Row = { label: string; value: string };

/** Spec-sheet style label/value list on a tinted panel; empty rows are skipped. */
export function SpecSheet({ rows }: { rows: Row[] }) {
  const visible = rows.filter((row) => row.value.trim() !== "");
  if (visible.length === 0) return null;
  return (
    <dl className="divide-y divide-border rounded-xl border border-border bg-tint px-5">
      {visible.map((row) => (
        <div key={row.label} className="grid gap-1 py-3.5 sm:grid-cols-[11rem_1fr] sm:gap-6">
          <dt className="text-sm text-muted-foreground">{row.label}</dt>
          <dd className="text-sm font-medium text-navy">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
