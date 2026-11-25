"use client";

import { Pause, Play } from "lucide-react";
import { useState, type CSSProperties } from "react";

type Props = {
  /** The scrolling track (keyframes in globals.css). */
  children: React.ReactNode;
  /** Seconds for one full loop. */
  seconds: number;
};

/**
 * Endless logo strip that pauses on hover or with its button (WCAG 2.2.2).
 * With reduced motion it does not move and the button is hidden.
 */
export function LogoMarquee({ children, seconds }: Props) {
  const [paused, setPaused] = useState(false);
  return (
    <div className="flex items-center gap-4">
      <div
        className="logo-marquee min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] motion-reduce:[mask-image:none]"
        data-paused={paused || undefined}
        style={{ "--marquee-duration": `${seconds}s` } as CSSProperties}
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => setPaused(!paused)}
        className="inline-flex size-9 shrink-0 select-none items-center justify-center rounded-full border border-border text-navy transition-colors hover:bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:hidden"
      >
        {paused ? <Play aria-hidden="true" className="size-4" /> : <Pause aria-hidden="true" className="size-4" />}
        <span className="sr-only">{paused ? "Play client logos" : "Pause client logos"}</span>
      </button>
    </div>
  );
}
