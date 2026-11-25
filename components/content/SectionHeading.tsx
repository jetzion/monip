import { cn } from "cn";

type Props = {
  id?: string;
  children: React.ReactNode;
  className?: string;
  /** A sentence or two under the heading; nothing shows when empty. */
  intro?: string | null;
};

/** Section heading with a short gold accent bar above it and an optional intro below. */
export function SectionHeading({ id, children, className, intro }: Props) {
  return (
    <div>
      <h2 id={id} className={cn("font-display text-3xl font-semibold text-navy sm:text-5xl", className)}>
        <span aria-hidden="true" className="mb-4 block h-1 w-12 rounded-full bg-gold" />
        {children}
      </h2>
      {intro && <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">{intro}</p>}
    </div>
  );
}
