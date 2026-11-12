import type { Home, Media } from "@/payload-types";

export type HeroTransition = "fade" | "zoom" | "slide";

export type HeroSlide = { url: string; width: number; height: number; seconds: number };

export type HeroBackground =
  | { kind: "video"; src: string; poster?: string }
  | {
      kind: "images";
      slides: HeroSlide[];
      transition: HeroTransition;
      transitionSeconds: number;
      /** Mask strength, 0 to 1. */
      overlayOpacity: number;
    };

const asMedia = (value: number | Media | null | undefined): Media | null =>
  typeof value === "object" ? value : null;

/** Built-in video, used until an editor uploads a video or images. */
export const defaultHeroVideo: HeroBackground = {
  kind: "video",
  src: "/hero/decoration.mp4",
  poster: "/hero/decoration-poster.jpg",
};

/** Resolves the Home global's hero settings (queried at depth 1) to what the page renders. */
export function heroBackground(hero: Home["hero"]): HeroBackground {
  if (hero.background === "images") {
    const slides = (hero.slides ?? []).flatMap(({ image, seconds }) => {
      const media = asMedia(image);
      if (!media?.url) return [];
      return [{ url: media.url, width: media.width ?? 1920, height: media.height ?? 1080, seconds }];
    });
    if (slides.length > 0) {
      return {
        kind: "images",
        slides,
        transition: hero.transition ?? "fade",
        transitionSeconds: hero.transitionSeconds ?? 1.2,
        overlayOpacity: (hero.overlayOpacity ?? 100) / 100,
      };
    }
  }
  if (hero.background === "video") {
    const video = asMedia(hero.video);
    if (video?.url) return { kind: "video", src: video.url };
  }
  return defaultHeroVideo;
}
