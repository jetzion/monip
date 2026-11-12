import { cn } from "cn";

/**
 * Rounded pill link styles. `dark` is for use inside navy page headers;
 * `compact` is the smallest size, e.g. the catalog category tags.
 */
export function pillClassName({ active = false, dark = false, small = false, compact = false } = {}) {
  return cn(
    "inline-flex items-center rounded-full border font-medium transition-colors",
    compact ? "h-7 px-3 text-xs" : small ? "h-8 px-4 text-sm" : "h-9 px-4 text-sm",
    dark
      ? active
        ? "border-white bg-white text-navy shadow-sm"
        : "border-white/25 bg-white/10 text-white hover:border-white/60 hover:bg-white/20"
      : active
        ? "border-primary bg-primary text-primary-foreground shadow-sm"
        : "border-border bg-white text-navy hover:border-primary/50 hover:text-primary",
  );
}

/** List item for a tag in a TagScroller row: one quarter of the row, minus the gaps. */
export const tagItemClassName = "w-[calc((100%-1.5rem)/4)] shrink-0 snap-start";
