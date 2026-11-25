"use client";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import { cn } from "cn";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Children, useCallback, useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";

import { iconButtonClassName } from "@/components/ui/icon-button";
import { drumPlace } from "@/lib/carousel-drum";

import { prefersReducedMotion, subscribeReducedMotion } from "./HeroControls";

type EmblaCarouselType = NonNullable<UseEmblaCarouselType[1]>;

type Props = {
  /** One product card per slide. */
  children: React.ReactNode[];
  autoplay: boolean;
  seconds: number;
};

/** Viewer distance from the drum, in card slots: smaller is a stronger 3D effect. */
const PERSPECTIVE_SLOTS = 5;

/**
 * Each slide's signed distance from the centre of the carousel, in slots, and that centre
 * relative to the slide's left edge, in px. Measured on screen, so exact with the loop.
 */
function measure(api: EmblaCarouselType, slot: number) {
  const root = api.rootNode().getBoundingClientRect();
  const centre = root.left + root.width / 2;
  return api.slideNodes().map((node) => {
    const box = node.getBoundingClientRect();
    return { distance: (box.left + box.width / 2 - centre) / slot, centreX: centre - box.left };
  });
}

/**
 * Endless product carousel on a turning drum (lib/carousel-drum.ts), centre card in front. Rolls to the next product every
 * `seconds` unless paused, hovered, focused, dragged, or the visitor prefers reduced motion.
 */
export function FeaturedCarousel({ children, autoplay, seconds }: Props) {
  const slides = Children.toArray(children);
  // A longer duration (Embla default 25) makes each roll slower and smoother.
  const [viewportRef, api] = useEmblaCarousel({ loop: true, align: "center", duration: 45 }, [
    Autoplay({ delay: seconds * 1000, playOnInit: false, stopOnInteraction: false, stopOnFocusIn: false }),
  ]);
  const [paused, setPaused] = useState(!autoplay);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false);
  const [selected, setSelected] = useState(0);
  const [held, setHeld] = useState(false);
  /** Bumped whenever the autoplay timer restarts, so the countdown bar restarts with it. */
  const [run, setRun] = useState(0);
  const rolling = autoplay && !paused && !reducedMotion;

  useEffect(() => {
    if (!api) return;
    const tween = () => {
      const nodes = api.slideNodes();
      const slot = nodes[0].offsetWidth;
      measure(api, slot).forEach(({ distance: d, centreX }, index) => {
        const place = drumPlace(d, slot);
        const style = nodes[index].style;
        // Each card gets its own perspective, all seen from the carousel centre: one shared 3D
        // space (preserve-3d) would look the same but clips the cards' shadows in Chrome.
        style.perspective = `${PERSPECTIVE_SLOTS * slot}px`;
        style.perspectiveOrigin = `${centreX}px 50%`;
        // Front cards on top, since flat stacking follows page order, not depth.
        style.zIndex = String(Math.round(100 - Math.abs(d) * 10));
        style.setProperty("--x", `${place.x}px`);
        style.setProperty("--z", `${place.z}px`);
        style.setProperty("--ry", `${place.rotate}deg`);
        style.setProperty("--fade", String(place.opacity));
        style.setProperty("--shade", String(place.shade));
        style.setProperty("--focus", String(Math.max(0, 1 - Math.abs(d))));
        // Faded cards at the back of the drum must not catch clicks.
        style.pointerEvents = place.opacity < 0.5 ? "none" : "";
      });
    };
    const select = () => setSelected(api.selectedScrollSnap());
    const grab = () => setPaused(true);
    tween();
    select();
    api.on("scroll", tween).on("reInit", tween).on("select", select).on("pointerDown", grab);
    return () => {
      api.off("scroll", tween).off("reInit", tween).off("select", select).off("pointerDown", grab);
    };
  }, [api]);

  useEffect(() => {
    const plugin = api?.plugins().autoplay;
    if (!plugin) return;
    if (rolling) plugin.play();
    else plugin.stop();
  }, [api, rolling]);

  // Hover or keyboard focus holds the carousel still; leaving rolls on at once unless paused.
  const hold = useCallback(() => {
    setHeld(true);
    api?.plugins().autoplay?.stop();
  }, [api]);
  const resume = useCallback(() => {
    if (!held) return;
    setHeld(false);
    setRun((count) => count + 1);
    if (!rolling) return;
    api?.scrollNext();
    api?.plugins().autoplay?.play();
  }, [api, held, rolling]);

  const go = (move: () => void) => {
    setPaused(true);
    move();
  };
  // Pressing play rolls to the next product at once, even with the pointer still over the carousel.
  const togglePause = () => {
    if (paused) {
      setHeld(false);
      api?.scrollNext();
    }
    setPaused(!paused);
    setRun((count) => count + 1);
  };

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Featured products"
      onPointerEnter={hold}
      onPointerLeave={resume}
      onFocus={hold}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) resume();
      }}
    >
      {/* No horizontal padding: Embla centres slides without it, so padding would push them off centre. */}
      <div ref={viewportRef} className="overflow-hidden pt-6 pb-14">
        <ul className="flex touch-pan-y">
          {slides.map((slide, index) => (
            <li
              key={index}
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slides.length}`}
              className="flex min-w-0 shrink-0 grow-0 basis-[78%] px-2 sm:basis-1/3 lg:basis-1/5"
              style={{ "--x": "0px", "--z": "0px", "--ry": "0deg", "--fade": 1, "--shade": 1, "--focus": 1 } as CSSProperties}
            >
              <div className="drum-card flex w-full opacity-(--fade) [filter:brightness(var(--shade))] [transform:translateX(var(--x))_translateZ(var(--z))_rotateY(var(--ry))] [&_h3+p]:opacity-(--focus)">
                {slide}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-2 flex justify-center">
        <div className="flex max-w-full items-center gap-2 rounded-full border border-white/80 bg-white/70 p-1.5 shadow-card backdrop-blur-md">
          <CarouselButton label="Previous product" onClick={() => go(() => api?.scrollPrev())}>
            <ChevronLeft aria-hidden="true" className="size-5" />
          </CarouselButton>
          {/* Each dot sits in a 24px button, the smallest touch target WCAG 2.2 allows. Phones have no
              room for them all, so they show the current dot and a count instead. */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-0">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Show product ${index + 1}`}
                aria-current={index === selected || undefined}
                onClick={() => go(() => api?.scrollTo(index))}
                className={cn(
                  "group h-6 min-w-6 items-center justify-center focus-visible:outline-none",
                  index === selected ? "flex" : "hidden sm:flex",
                )}
              >
                <span
                  className={cn(
                    "relative h-2 overflow-hidden rounded-full transition-[width,background-color] duration-300 group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2",
                    index === selected ? "w-7 bg-navy/15" : "w-2 bg-navy/20 group-hover:bg-navy/45",
                  )}
                >
                  {index === selected && (
                    <span
                      key={`${selected}-${run}`}
                      aria-hidden="true"
                      className="carousel-countdown absolute inset-0 origin-left rounded-full bg-gold"
                      style={rolling ? { animationDuration: `${seconds}s`, animationPlayState: held ? "paused" : "running" } : { animation: "none" }}
                    />
                  )}
                </span>
              </button>
            ))}
            <span className="pr-1 text-sm font-semibold tabular-nums text-navy sm:hidden">
              {selected + 1} / {slides.length}
            </span>
          </div>
          <CarouselButton label="Next product" onClick={() => go(() => api?.scrollNext())}>
            <ChevronRight aria-hidden="true" className="size-5" />
          </CarouselButton>
          {autoplay && !reducedMotion && (
            <>
              <span aria-hidden="true" className="h-5 w-px bg-navy/15" />
              <CarouselButton
                label={paused ? "Play featured products" : "Pause featured products"}
                onClick={togglePause}
              >
                {paused ? <Play aria-hidden="true" className="size-4 fill-current" /> : <Pause aria-hidden="true" className="size-4 fill-current" />}
              </CarouselButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type ButtonProps = {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
};

function CarouselButton({ label, onClick, children }: ButtonProps) {
  return (
    <button type="button" onClick={onClick} className={iconButtonClassName()}>
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}
