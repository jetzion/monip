import { cn } from "cn";

/**
 * Icon-only utility buttons (carousel, menu, chat header): round, 40px, no fill until hover.
 * `dark` is for navy bands; `overlay` adds a translucent navy backing for use over photos and video.
 */
export function iconButtonClassName({ dark = false, overlay = false } = {}) {
  return cn(
    "inline-flex size-10 shrink-0 select-none items-center justify-center rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    dark || overlay
      ? "text-white hover:bg-white/15 active:bg-white/25 focus-visible:ring-white focus-visible:ring-offset-navy"
      : "text-navy hover:bg-navy/10 active:bg-navy/15 focus-visible:ring-azure",
    overlay && "border border-white/30 bg-navy/60 backdrop-blur hover:bg-navy/80 active:bg-navy/90",
  );
}
