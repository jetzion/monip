import { cn } from "cn";

type Props = {
  title: string;
  intro?: string | null;
  /** Shown above the title, e.g. a breadcrumb. */
  eyebrow?: React.ReactNode;
  /** Extra content inside the band, e.g. catalog filters or hero actions. */
  children?: React.ReactNode;
  size?: "page" | "hero";
};

/** Navy page header band shared by every page, including the homepage hero. */
export function PageHeader({ title, intro, eyebrow, children, size = "page" }: Props) {
  const hero = size === "hero";
  return (
    <section className="header-band text-white">
      <div
        className={cn(
          "mx-auto max-w-6xl px-4 sm:px-6",
          hero ? "py-20 sm:py-28" : "py-12 sm:py-16",
        )}
      >
        {eyebrow}
        <h1
          className={cn(
            "font-display max-w-4xl font-semibold leading-[1.05]",
            hero ? "text-4xl sm:text-6xl lg:text-7xl" : "text-4xl sm:text-5xl",
          )}
        >
          {title}
        </h1>
        {intro && (
          <p
            className={cn(
              "max-w-2xl leading-relaxed text-on-dark-muted",
              hero ? "mt-6 text-xl" : "mt-4 text-lg",
            )}
          >
            {intro}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
