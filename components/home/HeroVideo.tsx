"use client";

import { useEffect, useRef, useState } from "react";

import { HeroOverlay, HeroPauseButton, prefersReducedMotion } from "./HeroControls";

type Props = { src: string; poster?: string };

/**
 * Decorative background video for the homepage hero. Plays muted and
 * looped unless the visitor prefers reduced motion; the button lets anyone
 * pause it (WCAG 2.2.2).
 */
export function HeroVideo({ src, poster }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!prefersReducedMotion()) video.current?.play().catch(() => setPlaying(false));
  }, [src]);

  const toggle = () => {
    if (!video.current) return;
    if (video.current.paused) void video.current.play();
    else video.current.pause();
  };

  return (
    <>
      <video
        key={src}
        ref={video}
        className="absolute inset-0 h-full w-full object-cover"
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        <source src={src} type="video/mp4" />
      </video>
      <HeroOverlay />
      <HeroPauseButton playing={playing} onToggle={toggle} what="background video" />
    </>
  );
}
