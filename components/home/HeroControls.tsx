import { Pause, Play } from "lucide-react";

/** Dark gradient over the hero background so the headline stays readable. */
export function HeroOverlay({ opacity = 1 }: { opacity?: number }) {
  return (
    <div
      aria-hidden="true"
      data-hero-overlay
      style={{ opacity }}
      className="absolute inset-0 bg-[linear-gradient(100deg,rgb(20_27_58/0.94)_0%,rgb(20_27_58/0.82)_45%,rgb(44_58_133/0.55)_100%)]"
    />
  );
}

type PauseProps = { playing: boolean; onToggle: () => void; what: string };

/** Pause/play button for moving hero backgrounds (WCAG 2.2.2). */
export function HeroPauseButton({ playing, onToggle, what }: PauseProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute bottom-4 right-4 z-20 inline-flex select-none size-10 items-center justify-center rounded-full border border-white/30 bg-navy/60 text-white backdrop-blur transition-colors hover:bg-navy/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      {playing ? <Pause aria-hidden="true" className="size-4" /> : <Play aria-hidden="true" className="size-4" />}
      <span className="sr-only">{playing ? `Pause ${what}` : `Play ${what}`}</span>
    </button>
  );
}

/** True when the visitor asked the system to reduce motion. */
export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Subscribes to reduced-motion changes, for useSyncExternalStore. */
export function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
