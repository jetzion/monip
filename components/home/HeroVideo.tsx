"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Decorative background video for the homepage hero. Plays muted and
 * looped unless the visitor prefers reduced motion; the button lets anyone
 * pause it (WCAG 2.2.2).
 */
export function HeroVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion) video.current?.play().catch(() => setPlaying(false));
  }, []);

  const toggle = () => {
    if (!video.current) return;
    if (video.current.paused) void video.current.play();
    else video.current.pause();
  };

  return (
    <>
      <video
        ref={video}
        className="absolute inset-0 h-full w-full object-cover"
        poster="/hero/decoration-poster.jpg"
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        <source src="/hero/decoration.mp4" type="video/mp4" />
      </video>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(100deg,rgb(20_27_58/0.94)_0%,rgb(20_27_58/0.82)_45%,rgb(44_58_133/0.55)_100%)]"
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute bottom-4 right-4 z-20 inline-flex size-10 items-center justify-center rounded-full border border-white/30 bg-navy/60 text-white backdrop-blur transition-colors hover:bg-navy/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        {playing ? <Pause aria-hidden="true" className="size-4" /> : <Play aria-hidden="true" className="size-4" />}
        <span className="sr-only">{playing ? "Pause background video" : "Play background video"}</span>
      </button>
    </>
  );
}
