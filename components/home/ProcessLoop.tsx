"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/*
 * The desktop loop's steps: even steps tick card n's number tag (globals.css), odd steps
 * grow the arrow from card n to the next, and the last step holds the full loop, then fades it.
 */
const DURATIONS_MS = [2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 1000];
const GROW_MS = 2000;

const CENTRE_X = "calc((100% - 6rem) / 4)";
const CENTRE_Y = "calc((100% - 4rem) / 4)";

/** Each arrow starts at the edge of its card and is rotated towards the next (gaps 6rem x 4rem). */
const ARROWS: { length: string; style: CSSProperties }[] = [
  { length: "6rem", style: { left: "calc(50% - 3rem)", top: CENTRE_Y } },
  { length: "4rem", style: { left: `calc(100% - ${CENTRE_X})`, top: "calc(50% - 2rem)", rotate: "90deg" } },
  { length: "6rem", style: { left: "calc(50% + 3rem)", top: `calc(100% - ${CENTRE_Y})`, rotate: "180deg" } },
  { length: "4rem", style: { left: CENTRE_X, top: "calc(50% + 2rem)", rotate: "270deg" } },
];

/** How arrow `index` looks at `step`; with no step (before it starts, or reduced motion) the loop is complete. */
function arrowState(index: number, step: number | null, length: string): CSSProperties {
  const grow = 2 * index + 1;
  if (step === null) return { width: length };
  if (step < grow) return { width: 0, opacity: 0 };
  if (step === grow) return { width: length, transition: `width ${GROW_MS}ms linear` };
  if (step === DURATIONS_MS.length - 1) return { width: length, opacity: 0, transition: "opacity 500ms 500ms" };
  return { width: length };
}

/**
 * Wraps the "How we work" cards and, for the 4-card loop on desktop, draws the arrows between
 * them and plays the sequence once half of it has scrolled into view.
 */
export function ProcessLoop({ loop, children }: { loop: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    if (!loop || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setStep(0);
      observer.disconnect();
    }, { threshold: 0.5 });
    observer.observe(ref.current!);
    return () => observer.disconnect();
  }, [loop]);

  useEffect(() => {
    if (step === null) return;
    const timer = setTimeout(() => setStep((step + 1) % DURATIONS_MS.length), DURATIONS_MS[step]);
    return () => clearTimeout(timer);
  }, [step]);

  return (
    <div ref={ref} className="relative mt-10" data-process-step={step ?? undefined}>
      {loop && (
        <div aria-hidden="true" className="hidden lg:block">
          {ARROWS.map(({ length, style }, index) => (
            <div key={index} className="absolute origin-left" style={style}>
              <div className="absolute -top-2 left-0 h-4" style={arrowState(index, step, length)}>
                <span className="absolute inset-y-1.5 left-0 right-3 bg-gold" />
                <span
                  className="absolute right-0 top-0 size-4 bg-gold"
                  style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
