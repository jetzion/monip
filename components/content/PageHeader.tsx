import { cn } from "cn";

type Props = {
  title: string;
  /** Optional large heading; when set, the title becomes the small label above it. */
  headline?: string | null;
  intro?: string | null;
  /** Shown above the title, e.g. a breadcrumb. */
  eyebrow?: React.ReactNode;
  /** Extra content inside the band, e.g. hero actions. */
  children?: React.ReactNode;
  /** Top-right column on large screens (below the intro on smaller ones), e.g. catalog filters. */
  aside?: React.ReactNode;
  /** The band's call to action, below the intro. */
  action?: React.ReactNode;
  size?: "page" | "hero";
  /** Full-bleed layer behind the content, e.g. a background video. */
  background?: React.ReactNode;
};

/** Navy page header band shared by every page, including the homepage hero. */
export function PageHeader({ title, headline, intro, eyebrow, children, aside, action, size = "page", background }: Props) {
  const hero = size === "hero";
  const label = headline ? (
    <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-on-dark-muted">{title}</p>
  ) : null;
  return (
    <section className="header-band relative overflow-hidden text-white">
      {background}
      <div
        className={cn(
          "relative z-10 mx-auto max-w-6xl px-4 sm:px-6",
          hero ? "py-6 sm:py-15" : "min-h-[19.4rem] sm:min-h-[17.8rem]",
          // The action sits under the intro, so the band trades padding for it to keep its height.
          !hero && (action ? "py-5 sm:py-8" : "py-12 sm:py-16"),
          aside && "lg:flex lg:items-start lg:justify-between lg:gap-12",
        )}
      >
        <div className="min-w-0">
          {eyebrow}
          {label}
          <h1
            className={cn(
              "font-display max-w-4xl font-semibold leading-[1.05]",
              hero ? "text-4xl sm:text-5xl lg:text-6xl" : "text-4xl sm:text-5xl",
            )}
          >
            {headline || title}
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
          {action && <div className="mt-5">{action}</div>}
        </div>
        {aside && <div className={cn("lg:mt-0 lg:w-[28rem] lg:shrink-0", action ? "mt-6" : "mt-8")}>{aside}</div>}
      </div>
    </section>
  );
}
