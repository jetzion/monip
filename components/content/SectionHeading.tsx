import { cn } from "cn";

type Props = {
  id?: string;
  children: React.ReactNode;
  className?: string;
};

/** Section heading with a short indigo accent bar above it. */
export function SectionHeading({ id, children, className }: Props) {
  return (
    <h2 id={id} className={cn("font-display text-3xl font-semibold text-navy sm:text-4xl", className)}>
      <span aria-hidden="true" className="mb-4 block h-1 w-12 rounded-full bg-primary" />
      {children}
    </h2>
  );
}
