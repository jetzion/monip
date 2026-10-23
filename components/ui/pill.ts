import { cn } from "cn";

/** Rounded pill link styles. `dark` is for use inside navy page headers. */
export function pillClassName({ active = false, dark = false, small = false } = {}) {
  return cn(
    "inline-flex items-center rounded-full border px-4 font-medium transition-colors",
    small ? "h-8 text-sm" : "h-9 text-sm",
    dark
      ? active
        ? "border-white bg-white text-navy shadow-sm"
        : "border-white/25 bg-white/10 text-white hover:border-white/60 hover:bg-white/20"
      : active
        ? "border-primary bg-primary text-primary-foreground shadow-sm"
        : "border-border bg-white text-navy hover:border-primary/50 hover:text-primary",
  );
}
