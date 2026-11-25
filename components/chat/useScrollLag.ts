"use client";

import { type RefObject, useEffect } from "react";

/** Largest distance, in pixels, the element trails behind the page. */
const MAX_LAG = 200;
/** Share of the scroll the element follows before easing back. */
const FOLLOW = 0.5;
/** Share of the lag kept each frame while easing back. */
const EASE = 0.965;

/**
 * Makes a fixed element drift with the page as it scrolls, then ease back
 * into place, so it seems to follow more slowly. Off for reduced motion.
 */
export function useScrollLag(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let lastY = window.scrollY;
    let offset = 0;
    let frame = 0;

    const settle = () => {
      offset = Math.abs(offset) < 0.5 ? 0 : offset * EASE;
      if (ref.current) ref.current.style.transform = offset ? `translateY(${offset}px)` : "";
      frame = offset ? requestAnimationFrame(settle) : 0;
    };

    const onScroll = () => {
      const delta = window.scrollY - lastY;
      lastY = window.scrollY;
      offset = Math.max(-MAX_LAG, Math.min(MAX_LAG, offset - delta * FOLLOW));
      if (!frame) frame = requestAnimationFrame(settle);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [ref]);
}
