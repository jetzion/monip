type Props = {
  title: string;
  intro?: string | null;
  /** Extra content inside the band, e.g. catalog filters. */
  children?: React.ReactNode;
};

/** Tinted page title band shared by section and content pages. */
export function PageHeader({ title, intro, children }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-tint">
      <div aria-hidden="true" className="brand-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-display max-w-3xl text-4xl font-semibold leading-tight text-navy sm:text-5xl">
          {title}
        </h1>
        {intro && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{intro}</p>}
        {children}
      </div>
    </section>
  );
}
