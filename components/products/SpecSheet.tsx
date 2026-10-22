type Row = { label: string; value: string };

/** Spec-sheet style label/value list; rows with empty values are skipped. */
export function SpecSheet({ rows }: { rows: Row[] }) {
  const visible = rows.filter((row) => row.value.trim() !== "");
  if (visible.length === 0) return null;
  return (
    <dl className="divide-y divide-border border-y border-border">
      {visible.map((row) => (
        <div key={row.label} className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr] sm:gap-6">
          <dt className="text-sm text-muted-foreground">{row.label}</dt>
          <dd className="text-sm font-medium">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
