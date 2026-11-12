"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";

import type { HeroSlide, HeroTransition } from "@/lib/hero";

import { HeroOverlay, HeroPauseButton, prefersReducedMotion, subscribeReducedMotion } from "./HeroControls";

type Props = {
  slides: HeroSlide[];
  transition: HeroTransition;
  transitionSeconds: number;
  overlayOpacity: number;
};

/** CSS animation for the slide shown at `step` (keyframes in globals.css). */
function enterAnimation(transition: HeroTransition, enter: number, step: number, seconds: number) {
  const entering = step === 0 ? [] : [`${enter}s ease-out both hero-${transition === "slide" ? "slide" : "fade"}`];
  const zoom = transition === "zoom" ? [`${seconds + enter}s linear both hero-zoom`] : [];
  return [...entering, ...zoom].join(", ") || undefined;
}

/**
 * Decorative background slideshow for the homepage hero. Each new image
 * enters over the previous one; the next image is mounted invisibly so it
 * has loaded before it appears. Starts paused for reduced motion.
 */
export function HeroSlideshow({ slides, transition, transitionSeconds, overlayOpacity }: Props) {
  const [step, setStep] = useState(0);
  // null until the visitor presses the button; the server renders paused.
  const [userPlaying, setUserPlaying] = useState<boolean | null>(null);
  const reduceMotion = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => true);
  const count = slides.length;
  const seconds = slides[step % count].seconds;

  const playing = count > 1 && (userPlaying ?? !reduceMotion);

  useEffect(() => {
    if (!playing || count < 2) return;
    const timer = setTimeout(() => setStep((s) => s + 1), seconds * 1000);
    return () => clearTimeout(timer);
  }, [playing, step, count, seconds]);

  const layers = count < 2 ? [step] : [step - 1, step, step + 1].filter((s) => s >= 0);

  return (
    <>
      {layers.map((s) => {
        const slide = slides[s % count];
        const style: CSSProperties =
          s > step
            ? { opacity: 0 }
            : {
                animation: enterAnimation(transition, transitionSeconds, s, slide.seconds),
                animationPlayState: playing ? "running" : "paused",
              };
        return (
          <div key={s} aria-hidden="true" data-hero-slide={s <= step ? "shown" : "next"} className="absolute inset-0" style={style}>
            <Image
              src={slide.url}
              alt=""
              fill
              sizes="100vw"
              preload={s === 0}
              loading="eager"
              className="object-cover"
            />
          </div>
        );
      })}
      <HeroOverlay opacity={overlayOpacity} />
      {count > 1 && (
        <HeroPauseButton playing={playing} onToggle={() => setUserPlaying(!playing)} what="background slideshow" />
      )}
    </>
  );
}
