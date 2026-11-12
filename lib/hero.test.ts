import { describe, expect, it } from "vitest";

import type { Home, Media } from "@/payload-types";

import { defaultHeroVideo, heroBackground } from "./hero";

const media = (id: number, url: string | null): Media =>
  ({ id, alt: "x", url, width: 1600, height: 900 }) as Media;

const hero = (fields: Partial<Home["hero"]>): Home["hero"] => ({
  headline: "h",
  intro: "i",
  aboutLinkLabel: "a",
  background: "video",
  transitionSeconds: 1.2,
  overlayOpacity: 100,
  ...fields,
});

describe("heroBackground", () => {
  it("uses the built-in video when no video is uploaded", () => {
    expect(heroBackground(hero({}))).toEqual(defaultHeroVideo);
  });

  it("uses the uploaded video", () => {
    expect(heroBackground(hero({ video: media(1, "/api/media/file/a.mp4") }))).toEqual({
      kind: "video",
      src: "/api/media/file/a.mp4",
    });
  });

  it("ignores a video that was not populated", () => {
    expect(heroBackground(hero({ video: 1 }))).toEqual(defaultHeroVideo);
  });

  it("returns the slides in order with their display times and transition", () => {
    const result = heroBackground(
      hero({
        background: "images",
        transition: "zoom",
        video: media(9, "/v.mp4"),
        slides: [
          { image: media(1, "/a.jpg"), seconds: 4 },
          { image: media(2, "/b.png"), seconds: 8 },
        ],
      }),
    );
    expect(result).toEqual({
      kind: "images",
      transition: "zoom",
      transitionSeconds: 1.2,
      overlayOpacity: 1,
      slides: [
        { url: "/a.jpg", width: 1600, height: 900, seconds: 4 },
        { url: "/b.png", width: 1600, height: 900, seconds: 8 },
      ],
    });
  });

  it("skips slides whose image was deleted", () => {
    const result = heroBackground(
      hero({
        background: "images",
        slides: [
          { image: 5, seconds: 4 },
          { image: media(2, "/b.png"), seconds: 8 },
        ],
      }),
    );
    expect(result).toEqual({
      kind: "images",
      transition: "fade",
      transitionSeconds: 1.2,
      overlayOpacity: 1,
      slides: [{ url: "/b.png", width: 1600, height: 900, seconds: 8 }],
    });
  });

  it("passes the transition time and converts the mask opacity to a fraction", () => {
    const result = heroBackground(
      hero({ background: "images", transitionSeconds: 2.5, overlayOpacity: 40, slides: [{ image: media(1, "/a.jpg"), seconds: 6 }] }),
    );
    expect(result).toMatchObject({ kind: "images", transitionSeconds: 2.5, overlayOpacity: 0.4 });
  });

  it("falls back to the built-in video when the slideshow has no images", () => {
    expect(heroBackground(hero({ background: "images", slides: [] }))).toEqual(defaultHeroVideo);
  });
});
